import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define PermissionPage
window.PermissionPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
    }

    initialize() {
        const gridElement = $('#permissionGrid');
        if (!gridElement.length) {
            console.error('Permission grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#permissionGrid').dxDataGrid({
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
                    dataField: 'name',
                    caption: 'Permission Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-key mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.description || '')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    editorType: 'dxTextArea',
                    editorOptions: {
                        height: 100
                    },
                    visible: false
                },
                {
                    type: 'buttons',
                    width: 140,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Permission')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Permission')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this permission?", "Confirm deletion")
                                    .then((result) => {
                                        if (result) {
                                            this.grid.deleteRow(options.rowIndex);
                                        }
                                    });
                            })
                            .appendTo($buttonContainer);

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
                    title: 'Permission Information',
                    showTitle: true,
                    width: 700,
                    height: 325,
                    position: { my: 'center', at: 'center', of: window },
                    showCloseButton: true
                },
                form: {
                    items: [
                        {
                            itemType: 'group',
                            colCount: 1,
                            items: [
                                {
                                    dataField: 'name',
                                    label: { text: 'Permission Name', showColon: true },
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter permission name',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mode: 'text',
                                        inputAttr: {
                                            'aria-label': 'Permission Name'
                                        }
                                    },
                                    validationRules: [{ type: 'required', message: 'Permission name is required' }]
                                },
                                {
                                    dataField: 'description',
                                    label: { text: 'Description', showColon: true },
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        placeholder: 'Enter permission description',
                                        stylingMode: 'filled',
                                        height: 100,
                                        maxLength: 500,
                                        showClearButton: true,
                                        inputAttr: {
                                            'aria-label': 'Permission Description'
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                useIcons: true,
                texts: {
                    saveRowChanges: 'Save',
                    cancelRowChanges: 'Cancel'
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Permission',
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
                    gridUtils.addExportButtons(this.grid, 'Permissions');
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
            this.grid.beginCustomLoading('Loading permissions...');
            
            const data = await zentra.getPermissions();
            if (Array.isArray(data)) {
                this.grid.option('dataSource', data);
            } else {
                console.warn('Invalid data format received:', data);
                this.grid.option('dataSource', []);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
            gridUtils.handleGridError(error, 'loading permissions');
        } finally {
            // Always hide loading panel
            this.grid.endCustomLoading();
        }
    }

    async handleRowInserting(e) {
        try {
            // Validate required fields
            if (!e.data.name) {
                e.cancel = true;
                DevExpress.ui.notify('Permission name is required', 'error', 3000);
                return;
            }

            // Create permission data
            const permissionData = {
                name: e.data.name.trim(),
                description: e.data.description || null
            };

            const result = await zentra.createPermission(permissionData);
            e.data.id = result.id;
            gridUtils.showSuccess('Permission created successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating permission');
        }
    }

    async handleRowUpdating(e) {
        try {
            const updatedData = {
                ...e.oldData,
                ...e.newData,
                name: e.newData.name || e.oldData.name,
                description: e.newData.description || e.oldData.description || null
            };

            await zentra.updatePermission(e.key.id, updatedData);
            gridUtils.showSuccess('Permission updated successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating permission');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deletePermission(e.key.id);
            gridUtils.showSuccess('Permission deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting permission');
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.permissionPageInstance) {
    window.permissionPageInstance = new window.PermissionPage();
} 