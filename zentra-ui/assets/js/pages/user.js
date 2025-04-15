import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define UserPage
window.UserPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.roles = [];
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
    }

    dispose() {
        // Dispose of the grid
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    async initialize() {
        const gridElement = $('#userGrid');
        if (!gridElement.length) {
            console.error('User grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Load roles for the dropdown
        try {
            this.roles = await zentra.getRoles();
        } catch (error) {
            console.error('Failed to load roles:', error);
            this.roles = [];
        }

        this.grid = $('#userGrid').dxDataGrid({
            dataSource: {
                store: {
                    type: 'array',
                    key: 'id',
                    data: []
                }
            },
            remoteOperations: false,
            ...gridUtils.getCommonGridConfig(),
            columns: [
                {
                    dataField: 'username',
                    caption: 'Username',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-single-02 mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.username || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.email || '')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'email',
                    caption: 'Email',
                    validationRules: [
                        { type: 'required' },
                        { type: 'email' }
                    ]
                },
                {
                    dataField: 'role_id',
                    caption: 'Role',
                    lookup: {
                        dataSource: this.roles,
                        valueExpr: 'id',
                        displayExpr: 'name'
                    },
                    cellTemplate: (container, options) => {
                        const role = this.roles.find(r => r.id === options.value);
                        if (role) {
                            $('<div>')
                                .addClass('role-badge')
                                .text(role.name)
                                .appendTo(container);
                        }
                    }
                },
                {
                    dataField: 'password',
                    visible: false,
                    allowEditing: true
                },
                {
                    type: 'buttons',
                    width: 140,
                    alignment: 'right',
                    fixed: true,
                    fixedPosition: 'right',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit User')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        const deleteButton = $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete User')
                            .append($('<i>').addClass('fas fa-trash'));

                        // Check if this is the current user
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        if (currentUser.id === options.data.id) {
                            deleteButton.prop('disabled', true)
                                .addClass('disabled')
                                .attr('title', 'Cannot delete your own account');
                        } else {
                            deleteButton.on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this user?", "Confirm deletion")
                                    .then((result) => {
                                        if (result) {
                                            this.grid.deleteRow(options.rowIndex);
                                        }
                                    });
                            });
                        }

                        deleteButton.appendTo($buttonContainer);
                        container.append($buttonContainer);
                    }
                }
            ],
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: true },
            columnChooser: { enabled: false },
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                popup: {
                    title: 'User Information',
                    showTitle: true,
                    width: 700,
                    height: 'auto',
                    showCloseButton: true,
                    position: { my: 'center', at: 'center', of: window }
                },
                form: {
                    labelLocation: 'top',
                    items: [
                        {
                            itemType: 'group',
                            caption: 'Basic Information',
                            colCount: 2,
                            items: [
                                {
                                    dataField: 'username',
                                    isRequired: true,
                                    label: {
                                        text: 'Username'
                                    },
                                    editorOptions: {
                                        placeholder: 'Enter username',
                                        stylingMode: 'filled',
                                        mode: 'text',
                                        inputAttr: {
                                            'aria-label': 'Username'
                                        }
                                    },
                                    validationRules: [{ 
                                        type: 'required',
                                        message: 'Username is required'
                                    }]
                                },
                                {
                                    dataField: 'email',
                                    isRequired: true,
                                    label: {
                                        text: 'Email Address'
                                    },
                                    editorOptions: {
                                        placeholder: 'Enter email address',
                                        stylingMode: 'filled',
                                        mode: 'email',
                                        inputAttr: {
                                            'aria-label': 'Email Address'
                                        }
                                    },
                                    validationRules: [
                                        { 
                                            type: 'required',
                                            message: 'Email is required'
                                        },
                                        { 
                                            type: 'email',
                                            message: 'Invalid email format'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Security',
                            colCount: 2,
                            items: [
                                {
                                    dataField: 'password',
                                    isRequired: true,
                                    label: {
                                        text: 'Password'
                                    },
                                    editorType: 'dxTextBox',
                                    editorOptions: {
                                        placeholder: 'Enter password',
                                        stylingMode: 'filled',
                                        mode: 'password',
                                        inputAttr: {
                                            'aria-label': 'Password'
                                        }
                                    },
                                    validationRules: [{ 
                                        type: 'required',
                                        message: 'Password is required'
                                    }]
                                },
                                {
                                    dataField: 'role_id',
                                    isRequired: true,
                                    label: {
                                        text: 'Role'
                                    },
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        dataSource: this.roles,
                                        valueExpr: 'id',
                                        displayExpr: 'name',
                                        placeholder: 'Select role',
                                        stylingMode: 'filled',
                                        searchEnabled: true,
                                        inputAttr: {
                                            'aria-label': 'Role'
                                        }
                                    },
                                    validationRules: [{ 
                                        type: 'required',
                                        message: 'Role is required'
                                    }]
                                }
                            ]
                        }
                    ]
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add User',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel',
                    'columnChooserButton'
                ]
            },
            onContentReady: (e) => {
                // Add export buttons after grid is fully loaded
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'User_List');
                    this.exportButtonsAdded = true;
                }
            },
            onInitialized: () => {
                if (this.grid) {
                    this.loadData();
                }
            },
            onRowInserting: (e) => this.handleRowInserting(e),
            onRowUpdating: (e) => this.handleRowUpdating(e),
            onRowRemoving: (e) => this.handleRowRemoving(e)
        }).dxDataGrid('instance');

        // Initial data load
        this.loadData();
    }

    async loadData() {
        try {
            if (!this.grid) {
                console.warn('Grid instance is not available');
                return;
            }

            // Show loading panel
            this.grid.beginCustomLoading('Loading users...');
            
            const data = await zentra.getUsers();
            this.grid.option('dataSource', data);
            
            // Hide loading panel
            this.grid.endCustomLoading();
        } catch (error) {
            gridUtils.handleGridError(error, 'loading users');
        }
    }

    async handleRowInserting(e) {
        try {
            // Ensure password is included in the data
            if (!e.data.password) {
                throw new Error('Password is required');
            }
            const result = await zentra.createUser(e.data);
            e.data.id = result.id;
            gridUtils.showSuccess('User created successfully');
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating user');
        }
    }

    async handleRowUpdating(e) {
        try {
            await zentra.updateUser(e.key.id, {...e.oldData, ...e.newData});
            gridUtils.showSuccess('User updated successfully');
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating user');
        }
    }

    async handleRowRemoving(e) {
        try {
            // Check if trying to delete own account
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser.id === e.key.id) {
                throw new Error('You cannot delete your own account while logged in');
            }
            await zentra.deleteUser(e.key.id);
            gridUtils.showSuccess('User deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting user');
        }
    }

    editUser(user) {
        const rowIndex = this.grid.getRowIndexByKey(user.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteUser(user) {
        const rowIndex = this.grid.getRowIndexByKey(user.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this user?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.userPageInstance) {
    window.userPageInstance = new window.UserPage();
} 