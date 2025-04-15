import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define StockMovementPage
window.StockMovementPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.stockMovements = [];
        this.currentMovement = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Movement Type Badges */
            .movement-type {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .movement-type.in {
                background-color: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .movement-type.out {
                background-color: rgba(245, 54, 92, 0.1);
                color: #f5365c;
            }

            .movement-type.adjustment {
                background-color: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }

            /* Reference Badge */
            .reference-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background-color: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            .reference-badge i {
                margin-right: 0.5rem;
            }

            /* Quantity Display */
            .quantity-display {
                display: inline-flex;
                align-items: center;
                font-family: "Monaco", "Courier New", monospace;
                font-size: 0.875rem;
                font-weight: 600;
            }

            .quantity-display.positive {
                color: #2dce89;
            }

            .quantity-display.negative {
                color: #f5365c;
            }

            /* Item Code Style */
            .item-code {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                color: #8898aa;
                background: rgba(136, 152, 170, 0.1);
                font-family: "Monaco", "Courier New", monospace;
            }

            /* Timeline Styles */
            .movement-timeline {
                position: relative;
                padding: 2rem;
            }

            .timeline-item {
                position: relative;
                padding-left: 3rem;
                margin-bottom: 2rem;
            }

            .timeline-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: -2rem;
                width: 2px;
                background: #e9ecef;
            }

            .timeline-item:last-child::before {
                bottom: 0;
            }

            .timeline-badge {
                position: absolute;
                left: -0.5rem;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                background: #5e72e4;
                border: 2px solid white;
                box-shadow: 0 0 0 2px #5e72e4;
            }

            .timeline-content {
                background: white;
                border-radius: 0.375rem;
                padding: 1rem;
                box-shadow: 0 2px 4px rgba(50, 50, 93, 0.1);
            }

            /* Summary Styles */
            .movement-summary {
                background: white;
                border-radius: 0.375rem;
                padding: 1rem;
            }

            .summary-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .summary-item:last-child {
                border-bottom: none;
            }

            .summary-icon {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                background: #f6f9fc;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
            }

            .summary-details {
                flex: 1;
            }

            .summary-value {
                font-weight: 600;
                color: #2dce89;
            }

            .summary-value.negative {
                color: #f5365c;
            }
        `)
        .appendTo('head');
    }

    dispose() {
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        // Clean up event listeners
        $('#stockMovementDetailsModal').off('show.bs.modal');
        $('#stockMovementDetailsModal').off('hide.bs.modal');
        $('#printReport').off('click');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#stockMovementDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const movementId = button.data('movement-id');
            if (movementId) {
                this.loadMovementDetails(movementId);
            }
        });

        $('#stockMovementDetailsModal').on('hide.bs.modal', () => {
            this.currentMovement = null;
            this.clearMovementDetails();
        });

        // Action buttons
        $('#printReport').on('click', () => {
            if (this.currentMovement) {
                this.printReport(this.currentMovement);
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
        this.initializeGrid();
        this.loadData();
    }

    initializeGrid() {
        const gridElement = $('#stockMovementGrid');
        if (!gridElement.length) {
            console.error('Stock movement grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#stockMovementGrid').dxDataGrid({
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
                    dataField: 'item',
                    caption: 'Item Info',
                    cellTemplate: (container, options) => {
                        const item = options.data.item;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(item.name)
                            )
                            .append(
                                $('<div>')
                                    .addClass('item-code')
                                    .append($('<i>').addClass('ni ni-tag mr-1'))
                                    .append(item.code)
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'movement_type',
                    caption: 'Type',
                    cellTemplate: (container, options) => {
                        const typeIcons = {
                            'in': 'fas fa-arrow-down',
                            'out': 'fas fa-arrow-up',
                            'adjustment': 'fas fa-adjust'
                        };
                        
                        $('<div>')
                            .addClass(`movement-type ${options.value}`)
                            .append($('<i>').addClass(typeIcons[options.value] + ' mr-1'))
                            .append(options.value.charAt(0).toUpperCase() + options.value.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'quantity',
                    caption: 'Quantity',
                    cellTemplate: (container, options) => {
                        const quantity = options.value;
                        const isPositive = quantity > 0;
                        
                        $('<div>')
                            .addClass(`quantity-display ${isPositive ? 'positive' : 'negative'}`)
                            .append($('<i>').addClass(isPositive ? 'fas fa-plus' : 'fas fa-minus'))
                            .append(Math.abs(quantity))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'reference_type',
                    caption: 'Reference',
                    cellTemplate: (container, options) => {
                        const reference = options.data;
                        $('<div>')
                            .addClass('reference-badge')
                            .append($('<i>').addClass(this.getReferenceIcon(reference.reference_type)))
                            .append(reference.reference_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'notes',
                    caption: 'Notes',
                    cellTemplate: (container, options) => {
                        if (options.value) {
                            $('<div>')
                                .addClass('text-muted text-small')
                                .text(options.value)
                                .appendTo(container);
                        }
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    buttons: [{
                        hint: 'View Details',
                        icon: 'fas fa-eye',
                        onClick: (e) => {
                            this.showMovementDetails(e.row.data);
                        }
                    }, {
                        hint: 'Print Report',
                        icon: 'fas fa-print',
                        onClick: (e) => {
                            this.printReport(e.row.data);
                        }
                    }]
                }
            ],
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20],
                showInfo: true,
                showNavigationButtons: true
            },
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    this.renderMovementDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Stock_Movement_List');
                    this.exportButtonsAdded = true;
                }
                this.updateStats();
            }
        }).dxDataGrid('instance');
    }

    getReferenceIcon(referenceType) {
        const icons = {
            'purchase_order': 'fas fa-shopping-cart',
            'production': 'fas fa-industry',
            'stock_opname': 'fas fa-clipboard-check'
        };
        return icons[referenceType] || 'fas fa-file-alt';
    }

    updateStats() {
        const movements = this.grid.getDataSource().items();
        const totalMovements = movements.length;
        const totalIn = movements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + m.quantity, 0);
        const totalOut = movements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + Math.abs(m.quantity), 0);
        const totalAdjustments = movements.filter(m => m.movement_type === 'adjustment').length;

        $('#totalMovements').text(totalMovements);
        $('#totalIn').text(totalIn);
        $('#totalOut').text(totalOut);
        $('#totalAdjustments').text(totalAdjustments);
    }

    async loadData() {
        try {
            this.stockMovements = await zentra.getStockMovements();
            this.grid.option('dataSource', this.stockMovements);
        } catch (error) {
            console.error('Error loading stock movements:', error);
            DevExpress.ui.notify('Failed to load stock movements', 'error', 3000);
        }
    }

    showMovementDetails(movement) {
        this.currentMovement = movement;
        $('#stockMovementDetailsModal').modal('show');
        this.updateMovementDetails(movement);
    }

    updateMovementDetails(movement) {
        // Update movement info
        $('#movementType').text(movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1));
        $('#movementDate').text(new Date(movement.created_at).toLocaleString());
        $('#createdBy').text(movement.created_by);
        $('#movementNotes').text(movement.notes || 'No notes available');
        
        // Update item info
        $('#itemName').text(movement.item.name);
        $('#itemCode').text(movement.item.code);
        $('#itemUnit').text(movement.item.unit);
        
        // Update quantity
        const quantityElement = $('#movementQuantity');
        quantityElement.text(Math.abs(movement.quantity));
        quantityElement.removeClass('positive negative').addClass(movement.quantity > 0 ? 'positive' : 'negative');
        
        // Update reference
        $('#referenceType').text(movement.reference_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        $('#referenceId').text(movement.reference_id);

        // Update timeline
        this.updateTimeline(movement);

        // Update summary
        this.updateSummary(movement);
    }

    updateTimeline(movement) {
        const $timeline = $('.movement-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Movement Created',
            `Movement recorded by ${movement.created_by}`,
            movement.created_at
        ));

        // Updated if different from created
        if (movement.updated_at !== movement.created_at) {
            $timeline.append(this.createTimelineItem(
                'Movement Updated',
                `Last updated by ${movement.updated_by}`,
                movement.updated_at
            ));
        }
    }

    createTimelineItem(title, info, date) {
        return $('<div>')
            .addClass('timeline-item')
            .append($('<div>').addClass('timeline-badge'))
            .append(
                $('<div>')
                    .addClass('timeline-content')
                    .append($('<div>').addClass('timeline-title').text(title))
                    .append($('<div>').addClass('timeline-info').text(info))
                    .append(
                        $('<small>')
                            .addClass('text-muted d-block mt-2')
                            .text(new Date(date).toLocaleString())
                    )
            );
    }

    updateSummary(movement) {
        const $summary = $('.movement-summary');
        $summary.empty();

        // Movement Type
        $summary.append(
            $('<div>')
                .addClass('summary-item')
                .append(
                    $('<div>')
                        .addClass('summary-icon')
                        .append($('<i>').addClass(this.getMovementTypeIcon(movement.movement_type)))
                )
                .append(
                    $('<div>')
                        .addClass('summary-details')
                        .append($('<div>').addClass('font-weight-bold').text('Movement Type'))
                        .append($('<small>').addClass('text-muted').text(movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)))
                )
        );

        // Quantity
        $summary.append(
            $('<div>')
                .addClass('summary-item')
                .append(
                    $('<div>')
                        .addClass('summary-icon')
                        .append($('<i>').addClass('ni ni-box-2'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-details')
                        .append($('<div>').addClass('font-weight-bold').text('Quantity'))
                        .append($('<small>').addClass('text-muted').text(`${movement.quantity} ${movement.item.unit}`))
                )
        );

        // Reference
        $summary.append(
            $('<div>')
                .addClass('summary-item')
                .append(
                    $('<div>')
                        .addClass('summary-icon')
                        .append($('<i>').addClass(this.getReferenceIcon(movement.reference_type)))
                )
                .append(
                    $('<div>')
                        .addClass('summary-details')
                        .append($('<div>').addClass('font-weight-bold').text('Reference'))
                        .append($('<small>').addClass('text-muted').text(`${movement.reference_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} #${movement.reference_id}`))
                )
        );
    }

    getMovementTypeIcon(type) {
        const icons = {
            'in': 'ni ni-bold-down',
            'out': 'ni ni-bold-up',
            'adjustment': 'ni ni-bold-right'
        };
        return icons[type] || 'ni ni-bold-right';
    }

    clearMovementDetails() {
        // Clear all dynamic content
        $('#movementType').text('');
        $('#movementDate').text('');
        $('#createdBy').text('');
        $('#movementNotes').text('');
        $('#itemName').text('');
        $('#itemCode').text('');
        $('#itemUnit').text('');
        $('#movementQuantity').text('');
        $('#referenceType').text('');
        $('#referenceId').text('');
        $('.movement-timeline').empty();
        $('.movement-summary').empty();
    }

    switchTab(tab) {
        $('.nav-tabs .nav-link').removeClass('active');
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $('.tab-pane').removeClass('show active');
        $(`#${tab}`).addClass('show active');
    }

    printReport(movement) {
        // Implement report printing functionality
        console.log('Print report for movement:', movement);
    }

    renderMovementDetails(container, movement) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row').appendTo($detailContent);
        
        // Left column - Main info and summary
        const $leftCol = $('<div>').addClass('col-lg-4').appendTo($row);
        
        // Right column - Items list
        const $rightCol = $('<div>').addClass('col-lg-8').appendTo($row);

        // Main Info Card
        const $mainInfo = $('<div>')
            .addClass('card shadow-sm mb-4')
            .appendTo($leftCol);

        // Header with item info and movement type
        $('<div>')
            .addClass('card-header bg-gradient-primary text-white py-3')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center mb-1')
                            .append($('<i>').addClass('ni ni-box-2 mr-2'))
                            .append($('<h3>').addClass('mb-0').text(movement.item?.name || 'Unknown Item'))
                    )
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center small')
                            .append($('<i>').addClass('ni ni-tag mr-2'))
                            .append(movement.item?.code || 'No Code')
                    )
            )
            .appendTo($mainInfo);

        // Movement Type and Reference Badge
        $('<div>')
            .addClass('card-body border-bottom')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center justify-content-between mb-3')
                            .append($('<h6>').addClass('mb-0').text('Movement Type'))
                            .append($(this.formatMovementType(movement.movement_type || 'unknown')))
                    )
                    .append(
                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<div>')
                                    .addClass('reference-badge w-100')
                                    .append($('<i>').addClass(this.getReferenceIcon(movement.reference_type)))
                                    .append(
                                        movement.reference_type 
                                            ? `${movement.reference_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${movement.reference_id ? `#${movement.reference_id}` : ''}`
                                            : 'No Reference'
                                    )
                            )
                    )
            )
            .appendTo($mainInfo);

        // Basic Info
        $('<div>')
            .addClass('card-body')
            .append(
                $('<div>').addClass('info-group mb-3')
                    .append($('<h6>').addClass('text-muted mb-1').text('Movement Date'))
                    .append($('<p>').addClass('mb-0 font-weight-bold')
                        .append($('<i>').addClass('ni ni-calendar-grid-58 mr-2 text-primary'))
                        .append(movement.movement_date ? new Date(movement.movement_date).toLocaleString() : 
                               movement.created_at ? new Date(movement.created_at).toLocaleString() : 'No Date')
                    )
            )
            .append(
                $('<div>').addClass('info-group mb-3')
                    .append($('<h6>').addClass('text-muted mb-1').text('Created By'))
                    .append($('<p>').addClass('mb-0 font-weight-bold')
                        .append($('<i>').addClass('ni ni-single-02 mr-2 text-primary'))
                        .append(movement.created_by || 'System')
                    )
            )
            .append(
                $('<div>').addClass('info-group')
                    .append($('<h6>').addClass('text-muted mb-1').text('Notes'))
                    .append($('<p>').addClass('mb-0 text-sm').text(movement.notes || 'No notes available'))
            )
            .appendTo($mainInfo);

        // Summary Card
        const $summary = $('<div>')
            .addClass('card shadow-sm')
            .appendTo($leftCol);

        $('<div>')
            .addClass('card-header bg-light')
            .append($('<h5>').addClass('mb-0').text('Summary'))
            .appendTo($summary);

        // Calculate summary data
        const totalQuantity = movement.quantity || 0;
        const quantityClass = totalQuantity > 0 ? 'success' : totalQuantity < 0 ? 'danger' : 'secondary';

        // Summary Stats
        const $summaryBody = $('<div>').addClass('card-body p-0').appendTo($summary);
        
        // Summary Items
        [
            {
                icon: 'ni ni-box-2',
                label: 'Quantity',
                value: `${Math.abs(totalQuantity)} ${movement.item?.unit || 'units'}`,
                color: quantityClass
            },
            {
                icon: movement.movement_type === 'in' ? 'ni ni-bold-down' : 
                      movement.movement_type === 'out' ? 'ni ni-bold-up' : 'ni ni-bold-right',
                label: 'Direction',
                value: movement.movement_type ? movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1) : 'Unknown',
                color: movement.movement_type === 'in' ? 'success' : 
                       movement.movement_type === 'out' ? 'danger' : 'warning'
            }
        ].forEach(item => {
            $('<div>')
                .addClass('px-4 py-3 border-bottom')
                .append(
                    $('<div>')
                        .addClass('d-flex align-items-center')
                        .append(
                            $('<div>')
                                .addClass(`icon icon-shape icon-sm rounded-circle bg-${item.color} text-white mr-3`)
                                .append($('<i>').addClass(item.icon))
                        )
                        .append(
                            $('<div>')
                                .addClass('flex-fill')
                                .append($('<h6>').addClass('mb-0').text(item.label))
                                .append($('<small>').addClass(`text-${item.color} font-weight-bold`).text(item.value))
                        )
                )
                .appendTo($summaryBody);
        });

        // Items List Card
        const $itemsCard = $('<div>')
            .addClass('card shadow-sm')
            .appendTo($rightCol);

        $('<div>')
            .addClass('card-header bg-light d-flex justify-content-between align-items-center')
            .append($('<h5>').addClass('mb-0').text('Movement Details'))
            .appendTo($itemsCard);

        // Items Table
        const $tableResponsive = $('<div>').addClass('table-responsive').appendTo($itemsCard);
        const $table = $('<table>')
            .addClass('table table-hover table-sm align-items-center mb-0')
            .appendTo($tableResponsive);

        // Table Header
        $('<thead>')
            .addClass('thead-light')
            .append(
                $('<tr>')
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold').text('Item'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold').text('Code'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold text-center').text('Quantity'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold').text('Unit'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold').text('Reference'))
            )
            .appendTo($table);

        // Table Body
        const $tbody = $('<tbody>').appendTo($table);

        // Add item to table
        if (movement.item) {
            $('<tr>')
                .append(
                    $('<td>')
                        .append(
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<div>')
                                        .addClass('icon-shape icon-xs rounded-circle bg-light mr-2')
                                        .append($('<i>').addClass('ni ni-box-2 text-primary'))
                                )
                                .append(
                                    $('<span>')
                                        .addClass('font-weight-bold text-sm')
                                        .text(movement.item.name || 'Unknown Item')
                                )
                        )
                )
                .append(
                    $('<td>')
                        .append(
                            $('<span>')
                                .addClass('item-code')
                                .text(movement.item.code || 'No Code')
                        )
                )
                .append(
                    $('<td>')
                        .addClass('text-center')
                        .append(
                            $('<span>')
                                .addClass(`font-weight-bold text-${quantityClass}`)
                                .text(`${totalQuantity > 0 ? '+' : ''}${totalQuantity}`)
                        )
                )
                .append(
                    $('<td>')
                        .append(
                            $('<span>')
                                .addClass('text-muted')
                                .text(movement.item.unit || 'N/A')
                        )
                )
                .append(
                    $('<td>')
                        .append(
                            $('<span>')
                                .addClass('reference-badge')
                                .append($('<i>').addClass(this.getReferenceIcon(movement.reference_type)))
                                .append(movement.reference_type ? 
                                    `${movement.reference_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${movement.reference_id ? `#${movement.reference_id}` : ''}` : 
                                    'No Reference')
                        )
                )
                .appendTo($tbody);
        }

        container.append($detailContent);
    }

    formatMovementType(type) {
        const typeIcons = {
            'in': 'fas fa-arrow-down',
            'out': 'fas fa-arrow-up',
            'adjustment': 'fas fa-exchange-alt'
        };
        const typeColors = {
            'in': 'success',
            'out': 'danger',
            'adjustment': 'warning'
        };
        const icon = typeIcons[type] || 'fas fa-question';
        const color = typeColors[type] || 'secondary';
        return `<div class="movement-type ${type}"><i class="${icon} mr-1"></i>${type.charAt(0).toUpperCase() + type.slice(1)}</div>`;
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.stockMovementPageInstance) {
    window.stockMovementPageInstance = new window.StockMovementPage();
} 