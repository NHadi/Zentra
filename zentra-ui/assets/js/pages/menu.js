import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define MenuPage
window.MenuPage = class {
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
        const gridElement = $('#menuGrid');
        if (!gridElement.length) {
            console.error('Menu grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        const iconLookup = [
            { id: 'ni ni-settings', text: 'Settings' },
            { id: 'ni ni-archive-2', text: 'Archive' },
            { id: 'ni ni-cart', text: 'Cart' },
            { id: 'ni ni-box-2', text: 'Box' },
            { id: 'ni ni-money-coins', text: 'Money' },
            { id: 'ni ni-tag', text: 'Tag' },
            { id: 'ni ni-collection', text: 'Collection' },
            { id: 'ni ni-world-2', text: 'World' },
            { id: 'ni ni-building', text: 'Building' },
            { id: 'ni ni-map-big', text: 'Map' },
            { id: 'ni ni-circle-08', text: 'User' }
        ];

        this.grid = $('#menuGrid').dxDataGrid({
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
                    caption: 'Menu Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>')
                                    .addClass(options.data.icon || 'ni ni-menu')
                                    .addClass('mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.url || '')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'icon',
                    caption: 'Icon',
                    lookup: {
                        dataSource: iconLookup,
                        valueExpr: 'id',
                        displayExpr: 'text'
                    },
                    cellTemplate: (container, options) => {
                        if (!options.value) return;
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>')
                                    .addClass(options.value)
                                    .css({ 'font-size': '1.2em', 'margin-right': '8px' })
                            )
                            .append(
                                $('<span>').text(
                                    iconLookup.find(item => item.id === options.value)?.text || options.value
                                )
                            )
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-center align-items-center');

                        // Cyan Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm rounded-circle bg-info text-white mr-2')
                            .attr('title', 'Edit Menu')
                            .append($('<i>').addClass('fas fa-pencil-alt'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Red Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm rounded-circle bg-danger text-white')
                            .attr('title', 'Delete Menu')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this menu?", "Confirm deletion")
                                    .then((result) => {
                                        if (result) {
                                            this.grid.deleteRow(options.rowIndex);
                                        }
                                    });
                            })
                            .appendTo($buttonContainer);

                        container.append($buttonContainer);
                    }
                },
                {
                    dataField: 'sort',
                    caption: 'Sort Order',
                    dataType: 'number',
                    width: 100,
                    alignment: 'center',
                    visible: false
                },
                {
                    dataField: 'url',
                    caption: 'URL',
                    visible: false
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
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    const currentItem = options.data;
                    
                    const subGrid = $('<div>')
                        .dxDataGrid({
                            dataSource: currentItem.children || [],
                            columns: [
                                {
                                    dataField: 'name',
                                    caption: 'Sub Menu Name',
                                    validationRules: [{ type: 'required' }],
                                    cellTemplate: (container, options) => {
                                        $('<div>')
                                            .addClass('d-flex align-items-center')
                                            .append(
                                                $('<i>')
                                                    .addClass(options.data.icon || 'ni ni-menu')
                                                    .addClass('mr-2 text-primary')
                                            )
                                            .append(
                                                $('<div>').addClass('d-flex flex-column')
                                                    .append(
                                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                                    )
                                                    .append(
                                                        $('<small>').addClass('text-muted').text(options.data.url || '')
                                                    )
                                            )
                                            .appendTo(container);
                                    }
                                },
                                {
                                    dataField: 'icon',
                                    caption: 'Icon',
                                    lookup: {
                                        dataSource: iconLookup,
                                        valueExpr: 'id',
                                        displayExpr: 'text'
                                    },
                                    cellTemplate: (container, options) => {
                                        if (!options.value) return;
                                        $('<div>')
                                            .addClass('d-flex align-items-center')
                                            .append(
                                                $('<i>')
                                                    .addClass(options.value)
                                                    .css({ 'font-size': '1.2em', 'margin-right': '8px' })
                                            )
                                            .append(
                                                $('<span>').text(
                                                    iconLookup.find(item => item.id === options.value)?.text || options.value
                                                )
                                            )
                                            .appendTo(container);
                                    }
                                },
                                {
                                    dataField: 'sort',
                                    caption: 'Sort Order',
                                    dataType: 'number',
                                    width: 100,
                                    alignment: 'center'
                                },
                                {
                                    type: 'buttons',
                                    width: 110,
                                    alignment: 'center',
                                    cellTemplate: (container, options) => {
                                        const $buttonContainer = $('<div>')
                                            .addClass('d-flex justify-content-center align-items-center');

                                        // Cyan Edit Button
                                        $('<button>')
                                            .addClass('btn btn-icon-only btn-sm rounded-circle bg-info text-white mr-2')
                                            .attr('title', 'Edit Sub Menu')
                                            .append($('<i>').addClass('fas fa-pencil-alt'))
                                            .on('click', () => {
                                                const subGridInstance = subGrid.dxDataGrid('instance');
                                                subGridInstance.editRow(options.rowIndex);
                                            })
                                            .appendTo($buttonContainer);

                                        // Red Delete Button
                                        $('<button>')
                                            .addClass('btn btn-icon-only btn-sm rounded-circle bg-danger text-white')
                                            .attr('title', 'Delete Sub Menu')
                                            .append($('<i>').addClass('fas fa-trash'))
                                            .on('click', () => {
                                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this sub menu?", "Confirm deletion")
                                                    .then((result) => {
                                                        if (result) {
                                                            const subGridInstance = subGrid.dxDataGrid('instance');
                                                            subGridInstance.deleteRow(options.rowIndex);
                                                        }
                                                    });
                                            })
                                            .appendTo($buttonContainer);

                                        container.append($buttonContainer);
                                    }
                                },
                                {
                                    dataField: 'url',
                                    caption: 'URL',
                                    visible: false
                                }
                            ],
                            showBorders: true,
                            editing: {
                                mode: 'popup',
                                allowUpdating: true,
                                allowDeleting: true,
                                allowAdding: true,
                                popup: {
                                    title: 'Sub Menu Information',
                                    showTitle: true,
                                    width: 700,
                                    height: 480,
                                    position: { my: 'center', at: 'center', of: window },
                                    showCloseButton: true
                                },
                                form: {
                                    labelLocation: 'top',
                                    colCount: 1,
                                    items: [
                                        {
                                            dataField: 'name',
                                            label: { text: 'Sub Menu Name', showColon: true },
                                            isRequired: true,
                                            editorOptions: {
                                                placeholder: 'Enter sub menu name',
                                                stylingMode: 'filled',
                                                showClearButton: true,
                                                mode: 'text',
                                                inputAttr: {
                                                    'aria-label': 'Sub Menu Name'
                                                }
                                            },
                                            validationRules: [{ type: 'required', message: 'Sub menu name is required' }]
                                        },
                                        {
                                            dataField: 'icon',
                                            label: { text: 'Icon', showColon: true },
                                            editorType: 'dxSelectBox',
                                            editorOptions: {
                                                dataSource: iconLookup,
                                                valueExpr: 'id',
                                                displayExpr: 'text',
                                                stylingMode: 'filled',
                                                showClearButton: true,
                                                searchEnabled: true,
                                                inputAttr: {
                                                    'aria-label': 'Icon'
                                                }
                                            }
                                        },
                                        {
                                            dataField: 'sort',
                                            label: { text: 'Sort Order', showColon: true },
                                            dataType: 'number',
                                            editorOptions: {
                                                placeholder: 'Enter sort order',
                                                stylingMode: 'filled',
                                                showClearButton: true,
                                                mode: 'number',
                                                showSpinButtons: true,
                                                min: 0,
                                                value: 0,
                                                inputAttr: {
                                                    'aria-label': 'Sort Order'
                                                }
                                            }
                                        },
                                        {
                                            dataField: 'url',
                                            label: { text: 'URL', showColon: true },
                                            editorOptions: {
                                                placeholder: 'Enter URL (e.g., /submenu)',
                                                stylingMode: 'filled',
                                                showClearButton: true,
                                                mode: 'text',
                                                inputAttr: {
                                                    'aria-label': 'URL'
                                                }
                                            }
                                        }
                                    ]
                                },
                                useIcons: true,
                                texts: {
                                    saveRowChanges: 'Save',
                                    cancelRowChanges: 'Cancel',
                                    confirmDeleteMessage: 'Are you sure you want to delete this sub menu?'
                                }
                            },
                            toolbar: {
                                items: [
                                    {
                                        location: 'before',
                                        widget: 'dxButton',
                                        options: {
                                            icon: 'plus',
                                            text: 'Add Sub Menu',
                                            onClick: () => {
                                                const subGridInstance = subGrid.dxDataGrid('instance');
                                                subGridInstance.addRow();
                                            }
                                        }
                                    }
                                ]
                            },
                            onRowUpdating: async (e) => {
                                try {
                                    const updatedData = {
                                        ...e.oldData,
                                        ...e.newData,
                                        name: e.newData.name || e.oldData.name,
                                        url: e.newData.url || e.oldData.url || null,
                                        icon: e.newData.icon || e.oldData.icon || null,
                                        sort: e.newData.sort || e.oldData.sort || 0,
                                        parent_id: currentItem.id
                                    };

                                    await zentra.updateMenu(e.key.id, updatedData);
                                    gridUtils.showSuccess('Sub menu updated successfully');
                                } catch (error) {
                                    e.cancel = true;
                                    gridUtils.handleGridError(error, 'updating sub menu');
                                }
                            },
                            onRowRemoving: async (e) => {
                                try {
                                    await zentra.deleteMenu(e.key.id);
                                    gridUtils.showSuccess('Sub menu deleted successfully');
                                } catch (error) {
                                    e.cancel = true;
                                    gridUtils.handleGridError(error, 'deleting sub menu');
                                }
                            },
                            onRowInserting: async (e) => {
                                try {
                                    if (!e.data.name) {
                                        e.cancel = true;
                                        DevExpress.ui.notify('Sub menu name is required', 'error', 3000);
                                        return;
                                    }

                                    const menuData = {
                                        name: e.data.name.trim(),
                                        url: e.data.url || null,
                                        icon: e.data.icon || null,
                                        sort: e.data.sort || 0,
                                        parent_id: currentItem.id
                                    };

                                    const result = await zentra.createMenu(menuData);
                                    e.data.id = result.id;
                                    gridUtils.showSuccess('Sub menu created successfully');
                                } catch (error) {
                                    e.cancel = true;
                                    gridUtils.handleGridError(error, 'creating sub menu');
                                }
                            }
                        }).appendTo(container);
                }
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                popup: {
                    title: 'Menu Information',
                    showTitle: true,
                    width: 700,
                    height: 480,
                    position: { my: 'center', at: 'center', of: window },
                    showCloseButton: true
                },
                form: {
                    labelLocation: 'top',
                    colCount: 1,
                    items: [
                        {
                            dataField: 'name',
                            label: { text: 'Menu Name', showColon: true },
                            isRequired: true,
                            editorOptions: {
                                placeholder: 'Enter menu name',
                                stylingMode: 'filled',
                                showClearButton: true,
                                mode: 'text',
                                inputAttr: {
                                    'aria-label': 'Menu Name'
                                }
                            },
                            validationRules: [{ type: 'required', message: 'Menu name is required' }]
                        },
                        {
                            dataField: 'icon',
                            label: { text: 'Icon', showColon: true },
                            editorType: 'dxSelectBox',
                            editorOptions: {
                                dataSource: iconLookup,
                                valueExpr: 'id',
                                displayExpr: 'text',
                                stylingMode: 'filled',
                                showClearButton: true,
                                searchEnabled: true,
                                inputAttr: {
                                    'aria-label': 'Icon'
                                }
                            }
                        },
                        {
                            dataField: 'sort',
                            label: { text: 'Sort Order', showColon: true },
                            dataType: 'number',
                            editorOptions: {
                                placeholder: 'Enter sort order',
                                stylingMode: 'filled',
                                showClearButton: true,
                                mode: 'number',
                                showSpinButtons: true,
                                min: 0,
                                value: 0,
                                inputAttr: {
                                    'aria-label': 'Sort Order'
                                }
                            }
                        },
                        {
                            dataField: 'url',
                            label: { text: 'URL', showColon: true },
                            editorOptions: {
                                placeholder: 'Enter URL (e.g., /menu)',
                                stylingMode: 'filled',
                                showClearButton: true,
                                mode: 'text',
                                inputAttr: {
                                    'aria-label': 'URL'
                                }
                            }
                        }
                    ]
                },
                useIcons: true,
                texts: {
                    saveRowChanges: 'Save',
                    cancelRowChanges: 'Cancel',
                    confirmDeleteMessage: 'Are you sure you want to delete this menu?'
                }
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Menu',
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
                    gridUtils.addExportButtons(this.grid, 'Menu_List');
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
            this.grid.beginCustomLoading('Loading menus...');
            
            const data = await zentra.getMenus();
            if (Array.isArray(data)) {
                this.grid.option('dataSource', data);
            } else {
                console.warn('Invalid data format received:', data);
                this.grid.option('dataSource', []);
            }
        } catch (error) {
            console.error('Error loading menus:', error);
            gridUtils.handleGridError(error, 'loading menus');
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
                DevExpress.ui.notify('Menu name is required', 'error', 3000);
                return;
            }

            // Create menu data
            const menuData = {
                name: e.data.name.trim(),
                url: e.data.url || null,
                icon: e.data.icon || null,
                sort: e.data.sort || 0,
                parent_id: e.data.parent_id || null
            };

            const result = await zentra.createMenu(menuData);
            e.data.id = result.id;
            gridUtils.showSuccess('Menu created successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating menu');
        }
    }

    async handleRowUpdating(e) {
        try {
            const updatedData = {
                ...e.oldData,
                ...e.newData,
                name: e.newData.name || e.oldData.name,
                url: e.newData.url || e.oldData.url || null,
                icon: e.newData.icon || e.oldData.icon || null,
                sort: e.newData.sort || e.oldData.sort || 0
            };

            await zentra.updateMenu(e.key.id, updatedData);
            gridUtils.showSuccess('Menu updated successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating menu');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteMenu(e.key.id);
            gridUtils.showSuccess('Menu deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting menu');
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.menuPageInstance) {
    window.menuPageInstance = new window.MenuPage();
}