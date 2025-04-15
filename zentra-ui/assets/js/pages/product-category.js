import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define ProductCategoryPage
window.ProductCategoryPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        
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

    initialize() {
        const gridElement = $('#productCategoryGrid');
        if (!gridElement.length) {
            console.error('Product category grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#productCategoryGrid').dxDataGrid({
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
                    caption: 'Category Name',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<i>').addClass('ni ni-box-2 mr-2 text-primary')
                            )
                            .append(
                                $('<div>').addClass('d-flex flex-column')
                                    .append(
                                        $('<span>').addClass('font-weight-bold').text(options.data.name || '')
                                    )
                                    .append(
                                        $('<small>').addClass('text-muted').text(options.data.description || 'No description')
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'code',
                    caption: 'Code',
                    validationRules: [{ type: 'required' }],
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('code-badge')
                            .text(options.data.code || '')
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    validationRules: [{ type: 'required' }],
                    visible: false
                },
                {
                    dataField: 'is_active',
                    caption: 'Status',
                    width: 100,
                    cellTemplate: (container, options) => {
                        const isActive = options.data.is_active;
                        $('<div>')
                            .addClass(`status-badge ${isActive ? 'active' : 'inactive'}`)
                            .text(isActive ? 'Active' : 'Inactive')
                            .appendTo(container);
                    }
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
                            .attr('title', 'Edit Category')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Category')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm("Are you sure you want to delete this category?", "Confirm deletion")
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
                    title: 'Product Category Information',
                    showTitle: true,
                    width: 700,
                    height: 325
                },
                form: {
                    items: [
                        {
                            itemType: 'group',
                            colCount: 1,
                            items: [
                                {
                                    dataField: 'name',
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter category name'
                                    }
                                },
                                {
                                    dataField: 'code',
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter category code'
                                    }
                                },
                                {
                                    dataField: 'description',
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        height: 100,
                                        placeholder: 'Enter category description'
                                    }
                                },
                                {
                                    dataField: 'is_active',
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        text: 'Active Status'
                                    }
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
                            text: 'Add Category',
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
                    gridUtils.addExportButtons(this.grid, 'Product_Category_List');
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
            this.grid.beginCustomLoading('Loading product categories...');
            
            const data = await zentra.getProductCategories();
            this.grid.option('dataSource', data);
            
            // Hide loading panel
            this.grid.endCustomLoading();
        } catch (error) {
            gridUtils.handleGridError(error, 'loading product categories');
        }
    }

    async handleRowInserting(e) {
        try {
            const result = await zentra.createProductCategory(e.data);
            e.data.id = result.id;
            gridUtils.showSuccess('Product category created successfully');
            // Refresh the grid data
            await this.loadData();
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'creating product category');
        }
    }

    async handleRowUpdating(e) {
        try {
            await zentra.updateProductCategory(e.key.id, {...e.oldData, ...e.newData});
            gridUtils.showSuccess('Product category updated successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'updating product category');
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteProductCategory(e.key.id);
            gridUtils.showSuccess('Product category deleted successfully');
        } catch (error) {
            e.cancel = true;
            gridUtils.handleGridError(error, 'deleting product category');
        }
    }

    editCategory(category) {
        const rowIndex = this.grid.getRowIndexByKey(category.id);
        if (rowIndex >= 0) {
            this.grid.editRow(rowIndex);
        }
    }

    deleteCategory(category) {
        const rowIndex = this.grid.getRowIndexByKey(category.id);
        if (rowIndex >= 0) {
            DevExpress.ui.dialog.confirm("Are you sure you want to delete this category?", "Confirm deletion")
                .then((result) => {
                    if (result) {
                        this.grid.deleteRow(rowIndex);
                    }
                });
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.productCategoryPageInstance) {
    window.productCategoryPageInstance = new window.ProductCategoryPage();
} 