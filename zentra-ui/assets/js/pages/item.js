import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define ItemPage
window.ItemPage = class {
    constructor() {
        this.grid = null;
        this.stockMovementGrid = null;
        this.exportButtonsAdded = false;
        this.showInactive = false;
        this.items = [];
        this.currentItem = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        if (this.stockMovementGrid) {
            this.stockMovementGrid.dispose();
            this.stockMovementGrid = null;
        }
        // Clean up event listeners
        $('#btnShowInactive').off('click');
        $('#btnGrouping').off('click');
        $('#itemDetailsModal').off('show.bs.modal');
        $('#itemDetailsModal').off('hide.bs.modal');
        $('#editItem').off('click');
        $('#adjustStock').off('click');
        $('#deactivateItem').off('click');
        $('#stockAdjustmentForm').off('submit');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        $('#btnShowInactive').on('click', () => {
            this.showInactive = !this.showInactive;
            this.updateGridData();
            $('#btnShowInactive i').toggleClass('fa-eye fa-eye-slash');
        });

        $('#btnGrouping').on('click', () => {
            const groupPanel = this.grid.option('groupPanel');
            if (groupPanel.visible) {
                this.grid.clearGrouping();
            }
            this.grid.option('groupPanel.visible', !groupPanel.visible);
        });

        // Modal events
        $('#itemDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const itemId = button.data('item-id');
            if (itemId) {
                this.loadItemDetails(itemId);
            }
        });

        $('#itemDetailsModal').on('hide.bs.modal', () => {
            this.currentItem = null;
            this.clearItemDetails();
        });

        // Action buttons
        $('#editItem').on('click', () => {
            if (this.currentItem) {
                this.editItem(this.currentItem);
            }
        });

        $('#adjustStock').on('click', () => {
            if (this.currentItem) {
                this.switchTab('stockManagement');
            }
        });

        $('#deactivateItem').on('click', () => {
            if (this.currentItem) {
                this.deactivateItem(this.currentItem);
            }
        });

        // Stock adjustment form
        $('#stockAdjustmentForm').on('submit', (e) => {
            e.preventDefault();
            if (this.currentItem) {
                this.applyStockAdjustment();
            }
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });
    }

    initialize() {
        const gridElement = $('#itemGrid');
        if (!gridElement.length) {
            console.error('Item grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#itemGrid').dxDataGrid({
            dataSource: {
                store: {
                    type: 'array',
                    key: 'id',
                    data: []
                }
            },
            remoteOperations: false,
            columns: [
                {
                    dataField: 'code',
                    caption: 'Item Code',
                    width: 140,
                    cellTemplate: (container, options) => {
                        const prefix = options.value.split('-')[0];
                        $('<div>')
                            .addClass('code-badge')
                            .append($('<i>').addClass('ni ni-tag'))
                            .append($('<span>').text(options.value))
                            .appendTo(container);
                    },
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'name',
                    caption: 'Name',
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    width: 250
                },
                {
                    dataField: 'unit',
                    caption: 'Unit',
                    width: 100,
                    validationRules: [{ type: 'required' }]
                },
                {
                    caption: 'Stock Levels',
                    width: 200,
                    cellTemplate: (container, options) => {
                        const currentStock = Math.floor(Math.random() * (options.data.max_stock - options.data.min_stock) + options.data.min_stock);
                        const percentage = (currentStock / options.data.max_stock) * 100;
                        let levelClass = 'high';
                        
                        if (currentStock <= options.data.min_stock) {
                            levelClass = 'low';
                        } else if (currentStock < options.data.min_stock * 1.5) {
                            levelClass = 'medium';
                        }

                        const $container = $('<div>').addClass('stock-level');
                        const $bar = $('<div>').addClass('stock-bar')
                            .append($('<div>')
                                .addClass(`stock-bar-fill ${levelClass}`)
                                .css('width', `${percentage}%`));
                        const $text = $('<div>').addClass('stock-text')
                            .text(`${currentStock}/${options.data.max_stock}`);

                        $container.append($bar, $text);
                        container.append($container);
                    }
                },
                {
                    dataField: 'min_stock',
                    caption: 'Min Stock',
                    dataType: 'number',
                    width: 100,
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'max_stock',
                    caption: 'Max Stock',
                    dataType: 'number',
                    width: 100,
                    validationRules: [{ type: 'required' }]
                },
                {
                    dataField: 'is_active',
                    caption: 'Status',
                    width: 100,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('status-badge ' + (options.value ? 'active' : 'inactive'))
                            .append($('<i>').addClass(options.value ? 'fas fa-check' : 'fas fa-times'))
                            .append(options.value ? 'Active' : 'Inactive')
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    alignment: 'center',
                    cellTemplate: (container, options) => {
                        const $buttonContainer = $('<div>')
                            .addClass('d-flex justify-content-end align-items-center');

                        // Edit Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-info mr-2')
                            .attr('title', 'Edit Item')
                            .append($('<i>').addClass('fas fa-edit'))
                            .on('click', () => {
                                this.grid.editRow(options.rowIndex);
                            })
                            .appendTo($buttonContainer);

                        // Delete Button
                        $('<button>')
                            .addClass('btn btn-icon-only btn-sm btn-danger')
                            .attr('title', 'Delete Item')
                            .append($('<i>').addClass('fas fa-trash'))
                            .on('click', () => {
                                DevExpress.ui.dialog.confirm('Are you sure you want to delete this item?', 'Confirm Delete')
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
            searchPanel: {
                visible: true,
                width: 250,
                placeholder: 'Search...'
            },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            paging: { pageSize: 10 },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [10, 20, 50],
                showInfo: true
            },
            toolbar: {
                items: [
                    {
                        location: 'before',
                        widget: 'dxButton',
                        options: {
                            icon: 'plus',
                            text: 'Add Item',
                            type: 'default',
                            stylingMode: 'contained',
                            onClick: () => this.grid.addRow()
                        }
                    },
                    'searchPanel'
                ]
            },
            export: {
                enabled: true,
                formats: ['xlsx', 'pdf']
            },
            onToolbarPreparing: (e) => {
                const toolbarItems = e.toolbarOptions.items;
                
                // Move search box to the end
                const searchBox = toolbarItems.find(i => i.name === "searchPanel");
                if (searchBox) {
                    searchBox.location = 'after';
                }

                // Find the export button and modify its properties
                const exportButton = toolbarItems.find(i => i.name === "exportButton");
                if (exportButton) {
                    exportButton.location = 'before';
                    exportButton.options = {
                        ...exportButton.options,
                        stylingMode: 'outlined',
                        icon: 'export',
                        text: 'Export',
                        type: 'default'
                    };
                }
            },
            editing: {
                mode: 'popup',
                allowUpdating: true,
                allowDeleting: true,
                allowAdding: true,
                useIcons: true,
                texts: {
                    confirmDeleteMessage: 'Are you sure you want to delete this item?',
                    saveRowChanges: 'Save',
                    cancelRowChanges: 'Cancel',
                    deleteRow: 'Delete',
                    editRow: 'Edit',
                    addRow: 'New Item'
                },
                popup: {
                    title: 'Item Information',
                    showTitle: true,
                    width: 800,
                    height: 'auto',
                    position: { my: 'center', at: 'center', of: window },
                    showCloseButton: true
                },
                form: {
                    labelLocation: 'top',
                    showColonAfterLabel: false,
                    colCount: 2,
                    items: [
                        {
                            itemType: 'group',
                            caption: 'Basic Information',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'code',
                                    label: { text: 'Item Code' },
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter item code (XXX-000)',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mode: 'text'
                                    }
                                },
                                {
                                    dataField: 'name',
                                    label: { text: 'Item Name' },
                                    isRequired: true,
                                    editorOptions: {
                                        placeholder: 'Enter item name',
                                        stylingMode: 'filled',
                                        showClearButton: true,
                                        mode: 'text'
                                    }
                                },
                                {
                                    dataField: 'description',
                                    label: { text: 'Description' },
                                    editorType: 'dxTextArea',
                                    editorOptions: {
                                        placeholder: 'Enter item description',
                                        stylingMode: 'filled',
                                        height: 100,
                                        maxLength: 500,
                                        showClearButton: true
                                    }
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Stock Settings',
                            colSpan: 1,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'unit',
                                    label: { text: 'Unit of Measure' },
                                    isRequired: true,
                                    editorType: 'dxSelectBox',
                                    editorOptions: {
                                        items: ['pieces', 'yards', 'spools', 'rolls', 'liters'],
                                        searchEnabled: true,
                                        placeholder: 'Select unit',
                                        stylingMode: 'filled',
                                        showClearButton: true
                                    }
                                },
                                {
                                    dataField: 'min_stock',
                                    label: { text: 'Minimum Stock Level' },
                                    isRequired: true,
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        min: 0,
                                        showSpinButtons: true,
                                        stylingMode: 'filled',
                                        placeholder: 'Enter minimum stock'
                                    }
                                },
                                {
                                    dataField: 'max_stock',
                                    label: { text: 'Maximum Stock Level' },
                                    isRequired: true,
                                    editorType: 'dxNumberBox',
                                    editorOptions: {
                                        min: 0,
                                        showSpinButtons: true,
                                        stylingMode: 'filled',
                                        placeholder: 'Enter maximum stock'
                                    }
                                }
                            ]
                        },
                        {
                            itemType: 'group',
                            caption: 'Status',
                            colSpan: 2,
                            cssClass: 'form-section',
                            items: [
                                {
                                    dataField: 'is_active',
                                    label: { text: 'Item Status' },
                                    editorType: 'dxSwitch',
                                    editorOptions: {
                                        switchedOnText: 'Active',
                                        switchedOffText: 'Inactive',
                                        width: 100,
                                        value: true
                                    }
                                }
                            ]
                        }
                    ]
                }
            },
            onInitNewRow: (e) => {
                e.data = {
                    is_active: true,
                    min_stock: 0,
                    max_stock: 0
                };
            },
            onRowValidating: (e) => {
                const data = { ...e.oldData, ...e.newData };
                
                // Validate required fields
                const requiredFields = ['code', 'name', 'unit', 'min_stock', 'max_stock'];
                const missingFields = requiredFields.filter(field => {
                    const value = data[field];
                    return value === undefined || value === null || value === '';
                });

                if (missingFields.length > 0) {
                    e.isValid = false;
                    e.errorText = `Please fill in all required fields: ${missingFields.join(', ')}`;
                    return;
                }

                // Validate item code format
                const codePattern = /^[A-Z]+-\d{3}$/;
                if (!codePattern.test(data.code)) {
                    e.isValid = false;
                    e.errorText = 'Item code must be in format XXX-000 (e.g. ABC-123)';
                    return;
                }

                // Validate stock levels
                if (data.max_stock <= data.min_stock) {
                    e.isValid = false;
                    e.errorText = 'Maximum stock must be greater than minimum stock';
                    return;
                }
            },
            onRowInserting: async (e) => {
                try {
                    const result = await zentra.createItem(e.data);
                    e.data.id = result.id;
                    this.items.push(e.data);
                    DevExpress.ui.notify('Item created successfully', 'success', 3000);
                } catch (error) {
                    e.cancel = true;
                    DevExpress.ui.notify(error.message || 'Failed to create item', 'error', 3000);
                }
            },
            onRowUpdating: async (e) => {
                try {
                    // Get the item ID from the old data
                    const itemId = e.oldData.id;
                    
                    // Create updated data without the id field
                    const { id, ...dataToUpdate } = { ...e.oldData, ...e.newData };
                    
                    console.log('Updating item with ID:', itemId, 'Data:', dataToUpdate);
                    
                    if (!itemId) {
                        throw new Error('Item ID is missing');
                    }

                    await zentra.updateItem(itemId, dataToUpdate);
                    
                    // Update local data
                    const index = this.items.findIndex(item => item.id === itemId);
                    if (index !== -1) {
                        this.items[index] = { ...dataToUpdate, id: itemId };
                    }
                    
                    DevExpress.ui.notify('Item updated successfully', 'success', 3000);
                } catch (error) {
                    console.error('Update error:', error);
                    e.cancel = true;
                    DevExpress.ui.notify(error.message || 'Failed to update item', 'error', 3000);
                }
            },
            onRowRemoving: async (e) => {
                try {
                    await zentra.deleteItem(e.key);
                    const index = this.items.findIndex(item => item.id === e.key);
                    if (index !== -1) {
                        this.items.splice(index, 1);
                    }
                    DevExpress.ui.notify('Item deleted successfully', 'success', 3000);
                } catch (error) {
                    e.cancel = true;
                    DevExpress.ui.notify(error.message || 'Failed to delete item', 'error', 3000);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Item_List');
                    this.exportButtonsAdded = true;
                }
                this.updateStats();
            },
            onInitialized: () => this.loadData(),
            onOptionChanged: (e) => {
                if (e.fullName === 'groupPanel.visible') {
                    $('#btnGrouping').toggleClass('btn-info btn-primary');
                }
            }
        }).dxDataGrid('instance');

        this.loadData();
    }

    updateStats() {
        const items = this.grid.getDataSource().items();
        const totalItems = items.length;
        const activeItems = items.filter(item => item.is_active).length;
        const lowStockItems = items.filter(item => {
            const currentStock = Math.floor(Math.random() * (item.max_stock - item.min_stock) + item.min_stock);
            return currentStock <= item.min_stock;
        }).length;
        const categories = new Set(items.map(item => item.code.split('-')[0])).size;

        $('#totalItems').text(totalItems);
        $('#activeItems').text(activeItems);
        $('#lowStockItems').text(lowStockItems);
        $('#itemCategories').text(categories);
    }

    updateGridData() {
        const filteredData = this.showInactive ? 
            this.items : 
            this.items.filter(item => item.is_active);
        this.grid.option('dataSource', filteredData);
    }

    async loadData() {
        try {
            this.items = await zentra.getItems();
            this.updateGridData();
        } catch (error) {
            console.error('Error loading items:', error);
            DevExpress.ui.notify('Failed to load items', 'error', 3000);
        }
    }

    async handleRowRemoving(e) {
        try {
            await zentra.deleteItem(e.key);
            const index = this.items.findIndex(item => item.id === e.key);
            if (index !== -1) {
                this.items.splice(index, 1);
            }
            DevExpress.ui.notify('Item deleted successfully', 'success', 3000);
        } catch (error) {
            console.error('Error deleting item:', error);
            e.cancel = true;
            DevExpress.ui.notify('Failed to delete item', 'error', 3000);
        }
    }

    showItemDetails(item) {
        this.currentItem = item;
        $('#itemDetailsModal').modal('show');
        this.updateItemDetails(item);
    }

    updateItemDetails(item) {
        // Update item info
        $('#itemCode').text(item.code);
        $('#itemName').text(item.name);
        $('#itemDescription').text(item.description || 'No description available');
        $('#itemUnit').text(item.unit);
        
        // Update status badge
        const statusBadge = $('#itemStatus');
        statusBadge.find('.status').text(item.is_active ? 'Active' : 'Inactive');
        statusBadge.find('i').removeClass().addClass(`bg-${item.is_active ? 'success' : 'danger'}`);

        // Update stock information
        $('#minStock').text(item.min_stock);
        $('#maxStock').text(item.max_stock);
        this.updateStockLevelDisplay(item);

        // Initialize stock movement grid
        this.initializeStockMovementGrid(item);

        // Update history timeline
        this.updateItemTimeline(item);
    }

    updateStockLevelDisplay(item) {
        const currentStock = Math.floor(Math.random() * (item.max_stock - item.min_stock) + item.min_stock);
        const percentage = (currentStock / item.max_stock) * 100;
        let levelClass = 'high';
        
        if (currentStock <= item.min_stock) {
            levelClass = 'low';
        } else if (currentStock < item.min_stock * 1.5) {
            levelClass = 'medium';
        }

        const $stockLevel = $('.stock-level-display');
        $stockLevel.empty().append(
            $('<div>').addClass('stock-info')
                .append($('<div>').addClass('stock-value').text(currentStock))
                .append($('<div>').addClass('stock-label').text('Current Stock'))
        ).append(
            $('<div>').addClass('stock-bar')
                .append($('<div>')
                    .addClass(`stock-bar-fill ${levelClass}`)
                    .css('width', `${percentage}%`))
        );
    }

    initializeStockMovementGrid(item) {
        if (this.stockMovementGrid) {
            this.stockMovementGrid.dispose();
        }

        // Sample stock movement data - replace with actual API call
        const movements = [
            {
                id: 1,
                type: 'add',
                quantity: 50,
                reason: 'purchase',
                notes: 'Initial stock purchase',
                date: new Date().toISOString(),
                user: 'John Doe'
            },
            {
                id: 2,
                type: 'remove',
                quantity: 10,
                reason: 'damage',
                notes: 'Damaged during transport',
                date: new Date().toISOString(),
                user: 'Jane Smith'
            }
        ];

        this.stockMovementGrid = $('#stockMovementGrid').dxDataGrid({
            dataSource: movements,
            columns: [
                {
                    dataField: 'type',
                    caption: 'Type',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass(`movement-type ${options.value}`)
                            .append($('<i>').addClass(options.value === 'add' ? 'fas fa-plus' : 'fas fa-minus'))
                            .append(` ${options.value.toUpperCase()}`)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'quantity',
                    caption: 'Quantity',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('font-weight-bold')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'reason',
                    caption: 'Reason',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .text(options.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'notes',
                    caption: 'Notes'
                },
                {
                    dataField: 'date',
                    caption: 'Date',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .text(new Date(options.value).toLocaleString())
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'user',
                    caption: 'User'
                }
            ],
            showBorders: true,
            showRowLines: true,
            rowAlternationEnabled: true,
            sorting: {
                mode: 'multiple'
            },
            paging: {
                pageSize: 5
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true
            }
        }).dxDataGrid('instance');
    }

    updateItemTimeline(item) {
        const $timeline = $('.item-timeline');
        $timeline.empty();

        // Sample timeline events - replace with actual data
        const events = [
            {
                title: 'Item Created',
                info: `Item ${item.code} was created`,
                date: item.created_at,
                type: 'create'
            },
            {
                title: 'Stock Adjusted',
                info: 'Initial stock added: 50 units',
                date: item.created_at,
                type: 'stock'
            },
            {
                title: 'Item Updated',
                info: 'Stock levels adjusted',
                date: item.updated_at,
                type: 'update'
            }
        ];

        events.forEach(event => {
            const $item = $('<div>').addClass('timeline-item');
            $item.append($('<div>').addClass('timeline-badge'));
            $item.append(
                $('<div>')
                    .addClass('timeline-content')
                    .append($('<div>').addClass('timeline-title').text(event.title))
                    .append($('<div>').addClass('timeline-info').text(event.info))
                    .append(
                        $('<small>')
                            .addClass('text-muted d-block mt-2')
                            .text(new Date(event.date).toLocaleString())
                    )
            );
            $timeline.append($item);
        });
    }

    async applyStockAdjustment() {
        const type = $('#adjustmentType').val();
        const quantity = parseInt($('#adjustmentQuantity').val());
        const reason = $('#adjustmentReason').val();
        const notes = $('#adjustmentNotes').val();

        if (!quantity || quantity < 1) {
            DevExpress.ui.notify('Please enter a valid quantity', 'error', 3000);
            return;
        }

        try {
            // Replace with actual API call
            await this.adjustStock(this.currentItem.id, type, quantity, reason, notes);
            
            // Refresh the stock movement grid and timeline
            this.initializeStockMovementGrid(this.currentItem);
            this.updateItemTimeline(this.currentItem);
            
            // Clear the form
            $('#stockAdjustmentForm')[0].reset();
            
            DevExpress.ui.notify('Stock adjustment applied successfully', 'success', 3000);
        } catch (error) {
            console.error('Error adjusting stock:', error);
            DevExpress.ui.notify('Failed to adjust stock', 'error', 3000);
        }
    }

    async adjustStock(itemId, type, quantity, reason, notes) {
        // Implement stock adjustment API call
        console.log('Adjusting stock:', { itemId, type, quantity, reason, notes });
    }

    editItem(item) {
        // Show edit form in modal
        this.grid.editRow(this.grid.getRowIndexByKey(item.id));
    }

    async deactivateItem(item) {
        const result = await DevExpress.ui.dialog.confirm(
            'Are you sure you want to deactivate this item?',
            'Confirm Deactivation'
        );

        if (result) {
            try {
                await zentra.updateItem(item.id, { ...item, is_active: false });
                this.loadData();
                $('#itemDetailsModal').modal('hide');
                DevExpress.ui.notify('Item deactivated successfully', 'success', 3000);
            } catch (error) {
                console.error('Error deactivating item:', error);
                DevExpress.ui.notify('Failed to deactivate item', 'error', 3000);
            }
        }
    }

    clearItemDetails() {
        // Clear all dynamic content
        $('#itemCode').text('');
        $('#itemName').text('');
        $('#itemDescription').text('');
        $('#itemUnit').text('');
        $('.stock-level-display').empty();
        $('#stockMovementGrid').empty();
        $('.item-timeline').empty();
        
        // Reset form
        $('#stockAdjustmentForm')[0].reset();
        
        // Reset grids
        if (this.stockMovementGrid) {
            this.stockMovementGrid.dispose();
            this.stockMovementGrid = null;
        }
    }

    switchTab(tab) {
        $('.nav-tabs .nav-link').removeClass('active');
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $('.tab-pane').removeClass('show active');
        $(`#${tab}`).addClass('show active');

        // Initialize grid if switching to stock management tab
        if (tab === 'stockManagement' && this.currentItem) {
            this.initializeStockMovementGrid(this.currentItem);
        }
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.itemPageInstance) {
    window.itemPageInstance = new window.ItemPage();
} 