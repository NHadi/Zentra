import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define StockOpnamePage
window.StockOpnamePage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.showInProgress = false;
        this.stockOpnames = [];
        this.currentOpname = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Opname Status Badges */
            .opname-status {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .opname-status.completed {
                background-color: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .opname-status.in_progress {
                background-color: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }

            .opname-status.cancelled {
                background-color: rgba(245, 54, 92, 0.1);
                color: #f5365c;
            }

            /* Opname Number Badge */
            .opname-number {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background-color: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            .opname-number i {
                margin-right: 0.5rem;
            }

            /* Date Display */
            .date-display {
                font-size: 0.875rem;
                color: #8898aa;
            }

            /* Notes Display */
            .notes-display {
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 0.875rem;
                color: #8898aa;
            }

            /* Timeline Styles */
            .opname-timeline {
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

            /* Items List */
            .items-list {
                background: white;
                border-radius: 0.375rem;
                padding: 1rem;
            }

            .item-row {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .item-row:last-child {
                border-bottom: none;
            }

            .item-icon {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                background: #f6f9fc;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
            }

            .item-details {
                flex: 1;
            }

            .item-quantity {
                font-weight: 600;
                color: #2dce89;
            }

            .item-quantity.negative {
                color: #f5365c;
            }

            /* Summary Styles */
            .opname-summary {
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

            /* Item Detail Row Styles */
            .item-detail-row {
                padding: 1rem;
                transition: background-color 0.2s ease;
            }

            .item-detail-row:hover {
                background-color: rgba(94, 114, 228, 0.05);
            }

            .item-icon-wrapper {
                flex-shrink: 0;
            }

            .item-icon-wrapper .icon-shape {
                width: 2.5rem;
                height: 2.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Quantity Display Styles */
            .quantity-display {
                display: flex;
                align-items: center;
                font-family: "Monaco", "Courier New", monospace;
            }

            .quantity-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                background: rgba(0, 0, 0, 0.05);
            }

            .quantity-badge.system {
                color: #8898aa;
            }

            .quantity-badge.actual {
                color: #5e72e4;
            }

            .quantity-badge.difference.positive {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .quantity-badge.difference.negative {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            .quantity-badge.difference.neutral {
                color: #8898aa;
            }

            .quantity-label {
                opacity: 0.8;
            }

            .quantity-value {
                font-weight: 600;
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

            /* Discrepancy Badge Styles */
            .discrepancy-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
            }

            .discrepancy-badge.match {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .discrepancy-badge.minor {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .discrepancy-badge.major {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            /* Items List Container */
            .items-list {
                max-height: 500px;
                overflow-y: auto;
                padding: 0.5rem;
            }

            .items-list::-webkit-scrollbar {
                width: 6px;
            }

            .items-list::-webkit-scrollbar-track {
                background: #f8f9fe;
            }

            .items-list::-webkit-scrollbar-thumb {
                background: #e9ecef;
                border-radius: 3px;
            }

            .items-list::-webkit-scrollbar-thumb:hover {
                background: #dee2e6;
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
        $('#btnShowInProgress').off('click');
        $('#btnGroupByStatus').off('click');
        $('#stockOpnameDetailsModal').off('show.bs.modal');
        $('#stockOpnameDetailsModal').off('hide.bs.modal');
        $('#printReport').off('click');
        $('#updateStatus').off('click');
        $('#cancelOpname').off('click');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        $('#btnShowInProgress').on('click', () => {
            this.showInProgress = !this.showInProgress;
            this.updateGridData();
            $('#btnShowInProgress i').toggleClass('fa-clock fa-history');
        });

        $('#btnGroupByStatus').on('click', () => {
            const groupPanel = this.grid.option('groupPanel');
            if (groupPanel.visible) {
                this.grid.clearGrouping();
            }
            this.grid.option('groupPanel.visible', !groupPanel.visible);
        });

        // Modal events
        $('#stockOpnameDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const opnameId = button.data('opname-id');
            if (opnameId) {
                this.loadOpnameDetails(opnameId);
            }
        });

        $('#stockOpnameDetailsModal').on('hide.bs.modal', () => {
            this.currentOpname = null;
            this.clearOpnameDetails();
        });

        // Action buttons
        $('#printReport').on('click', () => {
            if (this.currentOpname) {
                this.printReport(this.currentOpname);
            }
        });

        $('#updateStatus').on('click', () => {
            if (this.currentOpname) {
                this.updateOpnameStatus(this.currentOpname);
            }
        });

        $('#cancelOpname').on('click', () => {
            if (this.currentOpname) {
                this.cancelOpname(this.currentOpname);
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
        const gridElement = $('#stockOpnameGrid');
        if (!gridElement.length) {
            console.error('Stock opname grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#stockOpnameGrid').dxDataGrid({
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
                    dataField: 'opname_number',
                    caption: 'Opname Info',
                    cellTemplate: (container, options) => {
                        const opname = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('opname-number')
                                    .append($('<i>').addClass('ni ni-tag'))
                                    .append(opname.opname_number)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .text(new Date(opname.opname_date).toLocaleDateString())
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        const statusIcons = {
                            'completed': 'fas fa-check',
                            'in_progress': 'fas fa-clock',
                            'cancelled': 'fas fa-times'
                        };
                        
                        $('<div>')
                            .addClass(`opname-status ${options.value}`)
                            .append($('<i>').addClass(statusIcons[options.value] + ' mr-1'))
                            .append(options.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'details',
                    caption: 'Items',
                    cellTemplate: (container, options) => {
                        const itemCount = options.value.length;
                        const discrepancies = options.value.filter(d => d.difference_qty !== 0).length;
                        
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(`${itemCount} items`)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .text(`${discrepancies} discrepancies`)
                            )
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
                            this.showOpnameDetails(e.row.data);
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
                    this.renderOpnameDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Stock_Opname_List');
                    this.exportButtonsAdded = true;
                }
                this.updateStats();
            }
        }).dxDataGrid('instance');
    }

    renderOpnameDetails(container, opname) {
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

        // Header with status badge
        $('<div>')
            .addClass('card-header bg-gradient-primary text-white py-3')
            .append(
                $('<div>')
                    .addClass('d-flex align-items-center')
                    .append($('<i>').addClass('ni ni-clipboard-list mr-2'))
                    .append($('<h3>').addClass('mb-0').text(opname.opname_number))
            )
            .appendTo($mainInfo);

        // Status Badge
        $('<div>')
            .addClass('card-body border-bottom')
            .append(
                $('<div>')
                    .addClass('d-flex align-items-center justify-content-between')
                    .append($('<h6>').addClass('mb-0').text('Status'))
                    .append($(this.formatStatus(opname.status)))
            )
            .appendTo($mainInfo);

        // Basic Info
        $('<div>')
            .addClass('card-body')
            .append(
                $('<div>').addClass('info-group mb-3')
                    .append($('<h6>').addClass('text-muted mb-1').text('Opname Date'))
                    .append($('<p>').addClass('mb-0 font-weight-bold')
                        .append($('<i>').addClass('ni ni-calendar-grid-58 mr-2 text-primary'))
                        .append(new Date(opname.opname_date).toLocaleString())
                    )
            )
            .append(
                $('<div>').addClass('info-group mb-3')
                    .append($('<h6>').addClass('text-muted mb-1').text('Created By'))
                    .append($('<p>').addClass('mb-0 font-weight-bold')
                        .append($('<i>').addClass('ni ni-single-02 mr-2 text-primary'))
                        .append(opname.created_by)
                    )
            )
            .append(
                $('<div>').addClass('info-group')
                    .append($('<h6>').addClass('text-muted mb-1').text('Notes'))
                    .append($('<p>').addClass('mb-0 text-sm').text(opname.notes || 'No notes available'))
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
        const totalItems = opname.details.length;
        const matchingItems = opname.details.filter(d => d.difference_qty === 0).length;
        const discrepancies = opname.details.filter(d => d.difference_qty !== 0).length;

        // Summary Stats
        const $summaryBody = $('<div>').addClass('card-body p-0').appendTo($summary);
        
        // Summary Items
        [
            {
                icon: 'ni ni-box-2',
                label: 'Total Items',
                value: totalItems,
                color: 'primary'
            },
            {
                icon: 'ni ni-check-bold',
                label: 'Matching Items',
                value: matchingItems,
                color: 'success'
            },
            {
                icon: 'ni ni-fat-remove',
                label: 'Discrepancies',
                value: discrepancies,
                color: 'danger'
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
            .append($('<h5>').addClass('mb-0').text('Item Details'))
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
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold text-center').text('System Qty'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold text-center').text('Actual Qty'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold text-center').text('Difference'))
                    .append($('<th>').addClass('text-uppercase text-muted text-xxs font-weight-bold').text('Status'))
            )
            .appendTo($table);

        // Table Body
        const $tbody = $('<tbody>').appendTo($table);

        // Add items to table
        opname.details.forEach(detail => {
            const difference = detail.actual_qty - detail.system_qty;
            const status = difference === 0 ? 'match' : Math.abs(difference) <= 5 ? 'minor' : 'major';
            
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
                                        .text(detail.item.name)
                                )
                        )
                )
                .append(
                    $('<td>')
                        .append(
                            $('<span>')
                                .addClass('item-code')
                                .text(detail.item.code)
                        )
                )
                .append(
                    $('<td>')
                        .addClass('text-center')
                        .append(
                            $('<span>')
                                .addClass('font-weight-bold')
                                .text(detail.system_qty)
                        )
                )
                .append(
                    $('<td>')
                        .addClass('text-center')
                        .append(
                            $('<span>')
                                .addClass('font-weight-bold')
                                .text(detail.actual_qty)
                        )
                )
                .append(
                    $('<td>')
                        .addClass('text-center')
                        .append(
                            $('<span>')
                                .addClass(`font-weight-bold ${difference < 0 ? 'text-danger' : difference > 0 ? 'text-success' : ''}`)
                                .text(difference > 0 ? `+${difference}` : difference)
                        )
                )
                .append(
                    $('<td>')
                        .append(
                            $('<span>')
                                .addClass(`badge-item-status ${status}`)
                                .append($('<i>').addClass(this.getStatusIcon(status)))
                                .append(status.charAt(0).toUpperCase() + status.slice(1))
                        )
                )
                .appendTo($tbody);
        });

        container.append($detailContent);
    }

    getStatusIcon(status) {
        const icons = {
            'match': 'fas fa-check mr-1',
            'minor': 'fas fa-exclamation mr-1',
            'major': 'fas fa-exclamation-triangle mr-1'
        };
        return icons[status] || 'fas fa-question mr-1';
    }

    formatStatus(status) {
        const statusIcons = {
            'completed': 'fas fa-check',
            'in_progress': 'fas fa-clock',
            'cancelled': 'fas fa-times'
        };
        const icon = statusIcons[status] || 'fas fa-question';
        return `<div class="opname-status ${status}"><i class="${icon} mr-1"></i>${status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>`;
    }

    updateStats() {
        const opnames = this.grid.getDataSource().items();
        const totalOpnames = opnames.length;
        const completedOpnames = opnames.filter(o => o.status === 'completed').length;
        const inProgressOpnames = opnames.filter(o => o.status === 'in_progress').length;
        const totalItems = opnames.reduce((sum, o) => sum + o.details.length, 0);

        $('#totalOpnames').text(totalOpnames);
        $('#completedOpnames').text(completedOpnames);
        $('#inProgressOpnames').text(inProgressOpnames);
        $('#totalItems').text(totalItems);
    }

    updateGridData() {
        const filteredData = this.showInProgress ? 
            this.stockOpnames.filter(opname => opname.status === 'in_progress') : 
            this.stockOpnames;
        this.grid.option('dataSource', filteredData);
    }

    async loadData() {
        try {
            this.stockOpnames = await zentra.getStockOpnames();
            this.updateGridData();
        } catch (error) {
            console.error('Error loading stock opnames:', error);
            DevExpress.ui.notify('Failed to load stock opnames', 'error', 3000);
        }
    }

    showOpnameDetails(opname) {
        this.currentOpname = opname;
        $('#stockOpnameDetailsModal').modal('show');
        this.updateOpnameDetails(opname);
    }

    updateOpnameDetails(opname) {
        // Update opname info
        $('#opnameNumber').text(opname.opname_number);
        $('#opnameDate').text(new Date(opname.opname_date).toLocaleString());
        $('#createdBy').text(opname.created_by);
        $('#opnameNotes').text(opname.notes || 'No notes available');
        
        // Update status badge
        const statusBadge = $('#opnameStatus');
        statusBadge.find('.status').text(opname.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        statusBadge.find('i').removeClass().addClass(`bg-${this.getStatusColor(opname.status)}`);

        // Update items list
        this.updateItemsList(opname.details);

        // Update timeline
        this.updateTimeline(opname);

        // Update summary
        this.updateSummary(opname);
    }

    updateItemsList(details) {
        const $itemsList = $('.items-list');
        $itemsList.empty();

        details.forEach(detail => {
            const difference = detail.actual_qty - detail.system_qty;
            const status = difference === 0 ? 'match' : Math.abs(difference) <= 5 ? 'minor' : 'major';
            
            // Create item row with modern design
            const $itemRow = $('<div>')
                .addClass('item-detail-row d-flex align-items-center py-3 border-bottom')
                .append(
                    // Item icon
                    $('<div>')
                        .addClass('item-icon-wrapper mr-3')
                        .append(
                            $('<div>')
                                .addClass('icon-shape icon-sm rounded-circle bg-light')
                                .append($('<i>').addClass('ni ni-box-2 text-primary'))
                        )
                )
                .append(
                    // Item info
                    $('<div>')
                        .addClass('item-info flex-grow-1')
                        .append(
                            $('<div>')
                                .addClass('d-flex justify-content-between align-items-center mb-1')
                                .append(
                                    $('<h6>')
                                        .addClass('mb-0 font-weight-bold')
                                        .text(detail.item.name)
                                )
                                .append(
                                    this.createQuantityBadge(detail.actual_qty, detail.system_qty, difference)
                                )
                        )
                        .append(
                            $('<div>')
                                .addClass('d-flex align-items-center')
                                .append(
                                    $('<span>')
                                        .addClass('item-code mr-3')
                                        .append($('<i>').addClass('ni ni-tag mr-1'))
                                        .append(detail.item.code)
                                )
                                .append(
                                    this.createDiscrepancyBadge(difference)
                                )
                        )
                );

            $itemsList.append($itemRow);
        });
    }

    createQuantityBadge(actual, system, difference) {
        const $quantityWrapper = $('<div>').addClass('quantity-display');
        
        // System quantity
        $quantityWrapper.append(
            $('<span>')
                .addClass('quantity-badge system mr-2')
                .append(
                    $('<span>').addClass('quantity-label mr-1').text('System:')
                )
                .append(
                    $('<span>').addClass('quantity-value').text(system)
                )
        );

        // Actual quantity
        $quantityWrapper.append(
            $('<span>')
                .addClass('quantity-badge actual mr-2')
                .append(
                    $('<span>').addClass('quantity-label mr-1').text('Actual:')
                )
                .append(
                    $('<span>').addClass('quantity-value').text(actual)
                )
        );

        // Difference
        const diffClass = difference < 0 ? 'negative' : difference > 0 ? 'positive' : 'neutral';
        $quantityWrapper.append(
            $('<span>')
                .addClass(`quantity-badge difference ${diffClass}`)
                .append(
                    $('<span>').addClass('quantity-label mr-1').text('Diff:')
                )
                .append(
                    $('<span>')
                        .addClass('quantity-value')
                        .text(difference > 0 ? `+${difference}` : difference)
                )
        );

        return $quantityWrapper;
    }

    createDiscrepancyBadge(difference) {
        if (difference === 0) {
            return $('<span>')
                .addClass('discrepancy-badge match')
                .append($('<i>').addClass('fas fa-check mr-1'))
                .append('Count matches system');
        }

        const isMinor = Math.abs(difference) <= 5;
        const badgeClass = isMinor ? 'minor' : 'major';
        const message = isMinor ? 'Small difference found' : 'Two spools missing';

        return $('<span>')
            .addClass(`discrepancy-badge ${badgeClass}`)
            .append($('<i>').addClass(isMinor ? 'fas fa-exclamation mr-1' : 'fas fa-exclamation-triangle mr-1'))
            .append(message);
    }

    updateTimeline(opname) {
        const $timeline = $('.opname-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Opname Created',
            `Opname initiated by ${opname.created_by}`,
            opname.created_at
        ));

        // In Progress
        if (opname.status === 'in_progress') {
            $timeline.append(this.createTimelineItem(
                'In Progress',
                'Stock counting in progress',
                opname.updated_at
            ));
        }

        // Completed/Cancelled
        if (opname.status === 'completed') {
            $timeline.append(this.createTimelineItem(
                'Opname Completed',
                'Stock counting completed and verified',
                opname.updated_at
            ));
        } else if (opname.status === 'cancelled') {
            $timeline.append(this.createTimelineItem(
                'Opname Cancelled',
                'Stock counting cancelled',
                opname.updated_at
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

    updateSummary(opname) {
        const $summary = $('.opname-summary');
        $summary.empty();

        const totalItems = opname.details.length;
        const discrepancies = opname.details.filter(d => d.difference_qty !== 0).length;
        const totalDifference = opname.details.reduce((sum, d) => sum + d.difference_qty, 0);

        // Total Items
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
                        .append($('<div>').addClass('font-weight-bold').text('Total Items'))
                        .append($('<small>').addClass('text-muted').text('Number of items counted'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-value')
                        .text(totalItems)
                )
        );

        // Discrepancies
        $summary.append(
            $('<div>')
                .addClass('summary-item')
                .append(
                    $('<div>')
                        .addClass('summary-icon')
                        .append($('<i>').addClass('ni ni-bullet-list-67'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-details')
                        .append($('<div>').addClass('font-weight-bold').text('Discrepancies'))
                        .append($('<small>').addClass('text-muted').text('Items with quantity differences'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-value')
                        .addClass(discrepancies > 0 ? 'negative' : '')
                        .text(discrepancies)
                )
        );

        // Total Difference
        $summary.append(
            $('<div>')
                .addClass('summary-item')
                .append(
                    $('<div>')
                        .addClass('summary-icon')
                        .append($('<i>').addClass('ni ni-chart-bar-32'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-details')
                        .append($('<div>').addClass('font-weight-bold').text('Total Difference'))
                        .append($('<small>').addClass('text-muted').text('Sum of all quantity differences'))
                )
                .append(
                    $('<div>')
                        .addClass('summary-value')
                        .addClass(totalDifference < 0 ? 'negative' : '')
                        .text(totalDifference)
                )
        );
    }

    getStatusColor(status) {
        const colors = {
            'completed': 'success',
            'in_progress': 'warning',
            'cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }

    clearOpnameDetails() {
        // Clear all dynamic content
        $('#opnameNumber').text('');
        $('#opnameDate').text('');
        $('#createdBy').text('');
        $('#opnameNotes').text('');
        $('.items-list').empty();
        $('.opname-timeline').empty();
        $('.opname-summary').empty();
    }

    switchTab(tab) {
        $('.nav-tabs .nav-link').removeClass('active');
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $('.tab-pane').removeClass('show active');
        $(`#${tab}`).addClass('show active');
    }

    async updateOpnameStatus(opname) {
        // Implement status update functionality
        console.log('Update status for opname:', opname);
    }

    async cancelOpname(opname) {
        // Implement cancel opname functionality
        console.log('Cancel opname:', opname);
    }

    printReport(opname) {
        // Implement report printing functionality
        console.log('Print report for opname:', opname);
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.stockOpnamePageInstance) {
    window.stockOpnamePageInstance = new window.StockOpnamePage();
} 