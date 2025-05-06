import { orderAPI } from '../../../api/modules/orders.js';
import { gridUtils } from '../../../utils/gridUtils.js';
import { getBaseUrl } from '../../../api/config.js';

export class OrderGrid {
    constructor(page) {
        this.page = page;
        this.grid = null;
    }

    // Helper method to format currency in IDR
    formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Helper methods for status and payment classes
    getStatusClass(status) {
        const statusClasses = {
            pending: 'pending',
            confirmed: 'in-production',
            in_production: 'in-production',
            quality_check: 'in-production',
            ready_for_delivery: 'completed',
            delivered: 'completed',
            cancelled: 'cancelled'
        };
        return statusClasses[status] || 'pending';
    }

    getStatusIcon(status) {
        const statusIcons = {
            pending: 'fa-clock',
            confirmed: 'fa-check',
            in_production: 'fa-cogs',
            quality_check: 'fa-clipboard-check',
            ready_for_delivery: 'fa-box',
            delivered: 'fa-truck',
            cancelled: 'fa-times'
        };
        return statusIcons[status] || 'fa-clock';
    }

    getPaymentClass(status) {
        const paymentClasses = {
            paid: 'paid',
            partial: 'partial',
            unpaid: 'unpaid'
        };
        return paymentClasses[status] || 'unpaid';
    }

    getPaymentIcon(status) {
        const paymentIcons = {
            paid: 'fa-check-circle',
            partial: 'fa-clock',
            unpaid: 'fa-times-circle'
        };
        return paymentIcons[status] || 'fa-times-circle';
    }

    initialize() {
        const gridElement = $('#orderGrid');
        if (!gridElement.length) {
            console.error('Order grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#orderGrid').dxDataGrid({
            dataSource: [],
            columns: [
                {
                    dataField: 'order_number',
                    caption: 'Order Info',
                    cellTemplate: (container, options) => {
                        const order = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(order.order_number)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .text(new Date(order.created_at).toLocaleDateString('id-ID'))
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'customer',
                    caption: 'Customer',
                    cellTemplate: (container, options) => {
                        const order = options.data;
                        const customer = order.customer || {};
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(customer.name)
                            )
                            .append(
                                $('<div>')
                                    .addClass('d-flex align-items-center text-muted mb-1')
                                    .append($('<i>').addClass('fas fa-hashtag mr-1'))
                                    .append(customer.customer_number)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted d-flex align-items-center')
                                    .append($('<i>').addClass('fas fa-envelope mr-1'))
                                    .append(customer.email)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted d-flex align-items-center')
                                    .append($('<i>').addClass('fas fa-phone mr-1'))
                                    .append(customer.phone || 'N/A')
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'order_items',
                    caption: 'Items',
                    allowFiltering: false,
                    cellTemplate: (container, options) => {
                        const items = options.data.order_items || [];
                        const $container = $('<div>').addClass('d-flex flex-column');
                        
                        items.forEach(item => {
                            $('<div>')
                                .addClass('mb-2')
                                .append(
                                    $('<div>')
                                        .addClass('d-flex align-items-center')
                                        .append(
                                            $('<span>')
                                                .addClass('badge badge-soft-primary mr-2')
                                                .text(`${item.quantity}x`)
                                        )
                                        .append(
                                            $('<div>')
                                                .addClass('d-flex flex-column')
                                                .append(
                                                    $('<div>')
                                                        .addClass('font-weight-bold')
                                                        .text(`${item.size} - ${item.color}`)
                                                )
                                                .append(
                                                    $('<small>')
                                                        .addClass('text-muted')
                                                        .text(item.customization?.name ? 
                                                            `${item.customization.name} #${item.customization.number}` : 
                                                            'No customization')
                                                )
                                        )
                                )
                                .appendTo($container);
                        });
                        
                        container.append($container);
                    }
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        const status = options.value;
                        const statusClass = this.getStatusClass(status);
                        const statusIcon = this.getStatusIcon(status);
                        
                        $('<div>')
                            .addClass(`order-status ${statusClass}`)
                            .append($('<i>').addClass(`fas ${statusIcon}`))
                            .append(status.replace(/_/g, ' ').toUpperCase())
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'payment_status',
                    caption: 'Payment',
                    cellTemplate: (container, options) => {
                        const status = options.value;
                        const paymentClass = this.getPaymentClass(status);
                        const paymentIcon = this.getPaymentIcon(status);
                        
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass(`payment-badge ${paymentClass}`)
                                    .append($('<i>').addClass(`fas ${paymentIcon} mr-1`))
                                    .append(status.replace(/_/g, ' ').toUpperCase())
                            )
                            .append(
                                $('<div>')
                                    .addClass('mt-1 font-weight-bold')
                                    .text(this.formatIDR(options.data.total_amount))
                            )
                            .appendTo(container);
                    }
                },
                {
                    type: 'buttons',
                    width: 110,
                    buttons: [{
                        hint: 'View Details',
                        icon: 'fas fa-eye',
                        onClick: (e) => {
                            this.page.showOrderDetails(e.row.data);
                        }
                    }, {
                        hint: 'Print Order',
                        icon: 'fas fa-print',
                        onClick: (e) => {
                            this.page.printInvoice(e.row.data);
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
                    this.renderDetailTemplate(container, options);
                }
            }
        }).dxDataGrid('instance');

        // Add export buttons
        gridUtils.addExportButtons(this.grid, 'orders');
    }

    renderDetailTemplate(container, options) {
        const $detailContent = $('<div>').addClass('order-detail-container');

        // Create the exact tab structure from screenshot
        const $tabs = $(`
            <div class="tab-container">
                <a href="#" class="tab-item active" data-tab="orderInfo">
                    <i class="fas fa-info-circle"></i> Order Info
                </a>
                <a href="#" class="tab-item" data-tab="items">
                    <i class="fas fa-box"></i> Items
                </a>
                <a href="#" class="tab-item" data-tab="production">
                    <i class="fas fa-cogs"></i> Production Status
                </a>
                <a href="#" class="tab-item" data-tab="payment">
                    <i class="fas fa-credit-card"></i> Payment
                </a>
            </div>
        `);

        // Create content sections
        const $orderInfo = $('<div>').attr('id', 'orderInfo').addClass('content active')
            .append(this.renderCustomerInfo(options.data));

        const $items = $('<div>').attr('id', 'items').addClass('content')
            .append(this.renderItemsSection(options.data));

        const $production = $('<div>').attr('id', 'production').addClass('content')
            .append(this.renderTimelineSection(options.data));

        const $payment = $('<div>').attr('id', 'payment').addClass('content')
            .append(this.renderPaymentSection(options.data));

        // Add tab click handlers
        $tabs.find('.tab-item').on('click', function(e) {
            e.preventDefault();
            const tabId = $(this).data('tab');
            
            // Update active tab
            $tabs.find('.tab-item').removeClass('active');
            $(this).addClass('active');
            
            // Update content
            $detailContent.find('.content').removeClass('active');
            $detailContent.find(`#${tabId}`).addClass('active');
        });

        // Add styles
        const styles = `
            .tab-container {
                display: flex;
                border-bottom: 1px solid #e9ecef;
                margin-bottom: 20px;
            }
            
            .tab-item {
                padding: 15px 20px;
                color: #8898aa;
                text-decoration: none;
                position: relative;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .tab-item:hover {
                color: #5e72e4;
                text-decoration: none;
            }
            
            .tab-item.active {
                color: #5e72e4;
                border-bottom: 2px solid #5e72e4;
                margin-bottom: -1px;
            }
            
            .content {
                display: none;
                padding: 20px;
            }
            
            .content.active {
                display: block;
            }
        `;

        // Add styles if not already present
        if (!document.getElementById('order-detail-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'order-detail-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        // Assemble the content
        $detailContent
            .append($tabs)
            .append($orderInfo)
            .append($items)
            .append($production)
            .append($payment);

        container.append($detailContent);
    }

    renderCustomerInfo(order) {
        const customer = order.customer || {};
        return $('<div>')
            .addClass('mb-4')
            .append(
                $('<h6>')
                    .addClass('heading-small text-muted mb-3')
                    .text('Customer Information')
            )
            .append(
                $('<div>')
                    .addClass('row')
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Customer Number')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.customer_number)
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Name')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.name)
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Status')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('badge badge-' + (customer.status === 'active' ? 'success' : 'danger'))
                                            .text(customer.status?.toUpperCase() || 'N/A')
                                    )
                            )
                    )
            )
            .append(
                $('<div>')
                    .addClass('row mt-3')
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Email')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.email)
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Phone')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.phone || 'N/A')
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('col-md-4')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('City')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.city || 'N/A')
                                    )
                            )
                    )
            )
            .append(
                $('<div>')
                    .addClass('row mt-3')
                    .append(
                        $('<div>')
                            .addClass('col-md-12')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Address')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold')
                                            .text(customer.address || 'N/A')
                                    )
                            )
                    )
            )
            .append(
                customer.notes ? 
                $('<div>')
                    .addClass('row mt-3')
                    .append(
                        $('<div>')
                            .addClass('col-md-12')
                            .append(
                                $('<div>')
                                    .addClass('d-flex flex-column')
                                    .append(
                                        $('<small>').addClass('text-muted').text('Notes')
                                    )
                                    .append(
                                        $('<span>')
                                            .addClass('font-weight-bold font-italic')
                                            .text(customer.notes)
                                    )
                            )
                    )
                : null
            );
    }

    renderItemsSection(order) {
        const $itemsSection = $('<div>')
            .addClass('mt-4')
            .append(
                $('<h6>')
                    .addClass('heading-small text-muted mb-3')
                    .text('Order Items')
            );

        // Create items grid
        const $itemsGrid = $('<div>').addClass('order-items-grid');
        $itemsSection.append($itemsGrid);

        // Initialize items grid
        $itemsGrid.dxDataGrid({
            dataSource: order.order_items,
            showBorders: true,
            columns: [
                {
                    dataField: 'customization',
                    caption: 'Jersey Details',
                    cellTemplate: (container, options) => {
                        const item = options.data;
                        const customization = item.customization || {};
                        const productDetail = item.product_detail || {};
                        const imageUrl = item.main_photo;
                        const fullImageUrl = imageUrl.startsWith('http') || imageUrl.startsWith(getBaseUrl())
                            ? imageUrl
                            : `${getBaseUrl()}${imageUrl}`;

                        $('<div>')
                            .addClass('d-flex align-items-center')
                            .append(
                                $('<div>')
                                    .addClass('item-image mr-3')
                                    .append(
                                        $('<img>')
                                            .attr('src', fullImageUrl)
                                            .attr('alt', productDetail.name)
                                            .addClass('img-fluid rounded')
                                    )
                            )
                            .append(
                                $('<div>')
                                    .addClass('item-details')
                                    .append(
                                        $('<div>')
                                            .addClass('font-weight-bold mb-1')
                                            .text(productDetail.name)
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('font-weight-bold mb-1')
                                            .text(`${item.size} - ${item.color}`)
                                    )
                                    .append(
                                        $('<div>')
                                            .addClass('item-customization')
                                            .append(
                                                customization.name ? 
                                                    $('<span>')
                                                        .addClass('customization-badge')
                                                        .append($('<i>').addClass('fas fa-user mr-1'))
                                                        .append(`${customization.name} #${customization.number}`) : 
                                                    null
                                            )
                                    )
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'quantity',
                    caption: 'Quantity',
                    width: 100
                },
                {
                    dataField: 'unit_price',
                    caption: 'Unit Price',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .text(this.formatIDR(options.value))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'final_subtotal',
                    caption: 'Total',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('font-weight-bold text-primary')
                            .text(this.formatIDR(options.value))
                            .appendTo(container);
                    }
                }
            ]
        });

        return $itemsSection;
    }

    renderTimelineSection(order) {
        return $('<div>')
            .addClass('mt-4')
            .append(
                $('<h6>')
                    .addClass('heading-small text-muted mb-3')
                    .text('Production Timeline')
            )
            .append(
                $('<div>')
                    .addClass('production-timeline')
                    .append(this.renderProductionTimeline(order))
            );
    }

    renderProductionTimeline(order) {
        const $timeline = $('<div>').addClass('production-timeline-container');
        
        // Add timeline header with date/time
        $timeline.append(
            $('<div>').addClass('timeline-header')
                .append(
                    $('<div>').addClass('timeline-date')
                        .append($('<i>').addClass('far fa-calendar'))
                        .append(new Date(order.created_at).toLocaleDateString('id-ID'))
                )
                .append(
                    $('<div>').addClass('timeline-time')
                        .append($('<i>').addClass('far fa-clock'))
                        .append(new Date(order.created_at).toLocaleTimeString('id-ID'))
                )
        );

        // Add timeline title
        $timeline.append(
            $('<h4>').addClass('timeline-main-title')
                .text('Production Timeline')
        );

        // Create timeline content
        const $timelineContent = $('<div>').addClass('timeline-content');
        
        // Add timeline stages
        const stages = this.createTimelineStages(order);
        stages.forEach((stage, index) => {
            $timelineContent.append(this.renderTimelineStage(stage, index === stages.length - 1));
        });

        $timeline.append($timelineContent);

        // Add timeline styles
        const styles = `
            .production-timeline-container {
                padding: 20px;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
            }
            
            .timeline-header {
                display: flex;
                gap: 20px;
                margin-bottom: 15px;
                color: #8898aa;
                font-size: 0.875rem;
            }
            
            .timeline-date, .timeline-time {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .timeline-main-title {
                font-size: 1.25rem;
                color: #32325d;
                margin-bottom: 25px;
                font-weight: 600;
            }
            
            .timeline-content {
                position: relative;
                padding-left: 30px;
            }
            
            .timeline-stage {
                position: relative;
                padding-bottom: 30px;
                padding-left: 30px;
            }
            
            .timeline-stage:before {
                content: '';
                position: absolute;
                left: -2px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #e9ecef;
            }
            
            .timeline-stage:last-child {
                padding-bottom: 0;
            }
            
            .timeline-stage:last-child:before {
                display: none;
            }
            
            .timeline-stage-dot {
                position: absolute;
                left: -7px;
                top: 0;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #5e72e4;
                border: 2px solid #fff;
                box-shadow: 0 0 0 2px #5e72e4;
            }
            
            .timeline-stage.completed .timeline-stage-dot {
                background: #2dce89;
                box-shadow: 0 0 0 2px #2dce89;
            }
            
            .timeline-stage.in-progress .timeline-stage-dot {
                background: #fb6340;
                box-shadow: 0 0 0 2px #fb6340;
            }
            
            .timeline-stage-header {
                margin-bottom: 15px;
            }
            
            .timeline-stage-title {
                font-size: 1rem;
                font-weight: 600;
                color: #32325d;
                margin-bottom: 5px;
            }
            
            .timeline-stage-subtitle {
                font-size: 0.875rem;
                color: #8898aa;
            }
            
            .timeline-stage-date {
                font-size: 0.75rem;
                color: #adb5bd;
                margin-bottom: 10px;
            }
            
            .timeline-tasks {
                margin-top: 15px;
            }
            
            .timeline-task {
                background: #f6f9fc;
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 10px;
            }
            
            .timeline-task:last-child {
                margin-bottom: 0;
            }
            
            .task-header {
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                border-radius: 6px;
                transition: background-color 0.2s;
            }
            
            .task-header:hover {
                background-color: #f8f9fa;
            }
            
            .task-header-left {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .task-title-group {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .collapse-icon {
                font-size: 12px;
                color: #8898aa;
                transition: transform 0.2s;
            }
            
            .expanded .collapse-icon {
                transform: rotate(90deg);
            }
            
            .task-progress-text {
                font-size: 0.75rem;
                color: #8898aa;
            }
            
            .task-status-group {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .task-completion {
                font-size: 0.75rem;
                color: #2dce89;
                font-weight: 600;
            }
            
            .task-content {
                padding: 0 15px;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease-out, padding 0.3s ease;
            }
            
            .task-content:not(.collapsed) {
                max-height: 1000px;
                padding: 15px;
                border-top: 1px solid #e9ecef;
            }
            
            .task-items-grid {
                margin-top: 15px;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                overflow: hidden;
            }
            
            .grid-header {
                display: grid;
                grid-template-columns: 2fr 2fr 2fr 1fr;
                background: #f8f9fa;
                font-weight: 600;
                color: #8898aa;
                font-size: 0.75rem;
                text-transform: uppercase;
            }
            
            .grid-row {
                display: grid;
                grid-template-columns: 2fr 2fr 2fr 1fr;
                border-top: 1px solid #e9ecef;
            }
            
            .grid-cell {
                padding: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.875rem;
                color: #525f7f;
            }
            
            .grid-cell i {
                color: #8898aa;
                font-size: 0.875rem;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .status-badge.completed {
                background: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }
            
            .status-badge.in_progress {
                background: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }
            
            .status-badge.pending {
                background: rgba(136, 152, 170, 0.1);
                color: #8898aa;
            }
            
            .timeline-task {
                background: #fff;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                margin-bottom: 10px;
                transition: box-shadow 0.2s;
            }
            
            .timeline-task:hover {
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .timeline-task.expanded {
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
        `;

        // Add styles to document if not already present
        if (!document.querySelector('#timeline-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'timeline-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        return $timeline;
    }

    createTimelineStages(order) {
        const stages = [];

        // Order Received Stage
        stages.push({
            icon: 'shopping-cart',
            title: 'Order Received',
            subtitle: `Order #${order.order_number}`,
            date: new Date(order.created_at),
            status: 'completed',
            tasks: [{
                status: 'completed',
                name: 'Order Placement',
                details: `Order placed by ${order.customer_name}`,
                time: new Date(order.created_at)
            }]
        });

        // Order Confirmed Stage
        if (order.status !== 'pending') {
            stages.push({
                icon: 'check-circle',
                title: 'Order Confirmed',
                subtitle: 'Order verification complete',
                date: new Date(order.updated_at),
                status: 'completed',
                tasks: [{
                    status: 'completed',
                    name: 'Order Verification',
                    details: 'All order details have been verified and confirmed',
                    time: new Date(order.updated_at)
                }]
            });
        }

        // Production Stage
        if (order.status === 'in_production' || order.status === 'quality_check' || 
            order.status === 'ready_for_delivery' || order.status === 'delivered') {
            const productionStage = {
                icon: 'cogs',
                title: 'Production in Progress',
                subtitle: 'Manufacturing and customization',
                date: new Date(order.updated_at),
                status: order.status === 'in_production' ? 'current' : 'completed',
                tasks: []
            };

            // Group tasks by type
            const tasksByType = {};
            order.order_items.forEach(item => {
                if (item.tasks) {
                    item.tasks.forEach(task => {
                        if (!tasksByType[task.task_type]) {
                            tasksByType[task.task_type] = [];
                        }
                        tasksByType[task.task_type].push(task);
                    });
                }
            });

            // Add tasks to production stage
            Object.entries(tasksByType).forEach(([type, tasks]) => {
                const completed = tasks.filter(t => t.status === 'completed').length;
                const total = tasks.length;
                productionStage.tasks.push({
                    status: completed === total ? 'completed' : 'in-progress',
                    name: type.replace(/_/g, ' ').toUpperCase(),
                    details: `${completed} of ${total} items completed`,
                    progress: Math.round((completed / total) * 100),
                    tasks: tasks
                });
            });

            stages.push(productionStage);
        }

        // Quality Check Stage
        if (order.status === 'quality_check' || order.status === 'ready_for_delivery' || 
            order.status === 'delivered') {
            stages.push({
                icon: 'clipboard-check',
                title: 'Quality Check',
                subtitle: 'Final inspection and verification',
                date: new Date(order.updated_at),
                status: order.status === 'quality_check' ? 'current' : 'completed',
                tasks: [{
                    status: order.status === 'quality_check' ? 'in-progress' : 'completed',
                    name: 'Quality Inspection',
                    details: 'Verifying product quality and specifications',
                    time: new Date(order.updated_at)
                }]
            });
        }

        // Ready for Delivery Stage
        if (order.status === 'ready_for_delivery' || order.status === 'delivered') {
            stages.push({
                icon: 'box',
                title: 'Ready for Delivery',
                subtitle: 'Order packaging complete',
                date: new Date(order.updated_at),
                status: order.status === 'ready_for_delivery' ? 'current' : 'completed',
                tasks: [{
                    status: order.status === 'ready_for_delivery' ? 'in-progress' : 'completed',
                    name: 'Order Packaging',
                    details: 'Order has been packaged and is ready for delivery',
                    time: new Date(order.updated_at)
                }]
            });
        }

        // Delivered Stage
        if (order.status === 'delivered') {
            stages.push({
                icon: 'truck',
                title: 'Order Delivered',
                subtitle: 'Successfully delivered to customer',
                date: new Date(order.updated_at),
                status: 'completed',
                tasks: [{
                    status: 'completed',
                    name: 'Delivery Confirmation',
                    details: 'Order has been successfully delivered to the customer',
                    time: new Date(order.updated_at)
                }]
            });
        }

        return stages;
    }

    renderTimelineStage(stage, isLast) {
        const $stage = $('<div>').addClass(`timeline-stage ${stage.status}`);
        
        // Add stage dot
        $stage.append($('<div>').addClass('timeline-stage-dot'));
        
        // Stage header
        const $header = $('<div>').addClass('timeline-stage-header');
        
        $header.append(
            $('<div>').addClass('timeline-stage-title')
                .text(stage.title)
        );
        
        $header.append(
            $('<div>').addClass('timeline-stage-subtitle')
                .text(stage.subtitle)
        );
        
        $header.append(
            $('<div>').addClass('timeline-stage-date')
                .append($('<i>').addClass('far fa-calendar-alt mr-1'))
                .append(stage.date.toLocaleDateString('id-ID'))
                .append(' ')
                .append($('<i>').addClass('far fa-clock mr-1'))
                .append(stage.date.toLocaleTimeString('id-ID'))
        );
        
        $stage.append($header);

        // Tasks container
        if (stage.tasks && stage.tasks.length > 0) {
            const $tasks = $('<div>').addClass('timeline-tasks');
            stage.tasks.forEach(task => {
                $tasks.append(this.renderTimelineTask(task));
            });
            $stage.append($tasks);
        }

        return $stage;
    }

    renderTimelineTask(task) {
        const $task = $('<div>').addClass('timeline-task');
        
        // Task header with collapse functionality
        const $header = $('<div>').addClass('task-header')
            .append(
                $('<div>').addClass('task-header-left')
                    .append(
                        $('<div>').addClass('task-title-group')
                            .append($('<i>').addClass('fas fa-chevron-right collapse-icon'))
                            .append(
                                $('<div>').addClass('task-title')
                                    .text(task.name)
                            )
                    )
                    .append(
                        $('<div>').addClass('task-progress-text')
                            .text(task.details)
                    )
            )
            .append(
                $('<div>').addClass('task-status-group')
                    .append(
                        $('<div>')
                            .addClass(`task-status ${task.status}`)
                            .text(task.status.replace(/-/g, ' ').toUpperCase())
                    )
                    .append(
                        $('<div>').addClass('task-completion')
                            .text(task.progress ? `${task.progress}%` : '')
                    )
            );

        $task.append($header);

        // Collapsible content
        const $content = $('<div>').addClass('task-content collapsed');
        
        // Progress bar
        if (task.progress !== undefined) {
            $content.append(
                $('<div>')
                    .addClass('task-progress')
                    .append(
                        $('<div>')
                            .addClass('progress')
                            .append(
                                $('<div>')
                                    .addClass('progress-bar')
                                    .css('width', `${task.progress}%`)
                            )
                    )
            );
        }

        // Task items grid for subtasks
        if (task.tasks && task.tasks.length > 0) {
            const $itemsGrid = $('<div>').addClass('task-items-grid');
            
            // Grid header
            $itemsGrid.append(
                $('<div>').addClass('grid-header')
                    .append($('<div>').addClass('grid-cell').text('Employee'))
                    .append($('<div>').addClass('grid-cell').text('Start Time'))
                    .append($('<div>').addClass('grid-cell').text('End Time'))
                    .append($('<div>').addClass('grid-cell').text('Status'))
            );

            // Grid rows
            task.tasks.forEach(subtask => {
                const $row = $('<div>').addClass('grid-row');
                
                // Employee cell
                $row.append(
                    $('<div>').addClass('grid-cell')
                        .append($('<i>').addClass('fas fa-user'))
                        .append(subtask.employee_name || 'N/A')
                );
                
                // Start time cell
                $row.append(
                    $('<div>').addClass('grid-cell')
                        .append($('<i>').addClass('far fa-play-circle'))
                        .append(subtask.started_at ? 
                            new Date(subtask.started_at).toLocaleString('id-ID') : 
                            'Not started'
                        )
                );
                
                // End time cell
                $row.append(
                    $('<div>').addClass('grid-cell')
                        .append($('<i>').addClass('far fa-check-circle'))
                        .append(subtask.completed_at ? 
                            new Date(subtask.completed_at).toLocaleString('id-ID') : 
                            'In progress'
                        )
                );
                
                // Status cell
                $row.append(
                    $('<div>').addClass('grid-cell')
                        .append(
                            $('<span>')
                                .addClass(`status-badge ${subtask.status}`)
                                .text(subtask.status.toUpperCase())
                        )
                );
                
                $itemsGrid.append($row);
            });
            
            $content.append($itemsGrid);
        }

        $task.append($content);

        // Add click handler for collapse/expand
        $header.on('click', () => {
            $content.toggleClass('collapsed');
            $header.find('.collapse-icon').toggleClass('fa-chevron-right fa-chevron-down');
            $task.toggleClass('expanded');
        });

        return $task;
    }

    renderPaymentSection(order) {
        const $paymentSection = $('<div>').addClass('payment-section');

        // Payment Summary Card
        const $summaryCard = $('<div>').addClass('card mb-4')
            .append(
                $('<div>').addClass('card-body')
                    .append($('<h5>').addClass('card-title').text('Payment Summary'))
                    .append(
                        $('<div>').addClass('row')
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Subtotal'))
                                    .append($('<h3>').addClass('text-primary').text(this.formatIDR(order.subtotal)))
                            )
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Discount'))
                                    .append($('<h3>').addClass('text-danger').text(`-${this.formatIDR(order.discount_amount)}`))
                            )
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Total Amount'))
                                    .append($('<h3>').addClass('text-success').text(this.formatIDR(order.total_amount)))
                            )
                    )
            );

        // Payment Status Card
        const $statusCard = $('<div>').addClass('card mb-4')
            .append(
                $('<div>').addClass('card-body')
                    .append($('<h5>').addClass('card-title').text('Payment Status'))
                    .append(
                        $('<div>')
                            .addClass(`payment-badge ${this.getPaymentClass(order.payment_status)}`)
                            .append($('<i>').addClass(`fas ${this.getPaymentIcon(order.payment_status)} mr-2`))
                            .append(order.payment_status.replace(/_/g, ' ').toUpperCase())
                    )
            );

        // Add cards to payment section
        $paymentSection
            .append($summaryCard)
            .append($statusCard);

        return $paymentSection;
    }

    showOrderDetails(order) {
        // Store the current order for reference in other methods
        this.currentOrder = order;
        
        // Update the modal title
        $('#orderTitle').text(`Order Details: ${order.order_number}`);

        const customer = order.customer || {};
        // Update customer information
        $('#customerName').text(customer.name || 'N/A');
        $('#customerEmail').text(customer.email || 'N/A');
        $('#customerPhone').text(customer.phone || 'N/A');
        $('#officeId').text(order.office_id || 'N/A');
        $('#expectedDelivery').text(new Date(order.expected_delivery_date).toLocaleDateString());

        // Update order summary
        $('#orderNumber').text(order.order_number);
        $('#createdDate').text(new Date(order.created_at).toLocaleDateString());
        $('#updatedDate').text(new Date(order.updated_at).toLocaleDateString());
        $('#subtotal').text(this.formatIDR(order.subtotal));
        $('#discount').text(`-${this.formatIDR(order.discount_amount)}`);
        $('#totalAmount').text(this.formatIDR(order.total_amount));

        // Update status badges
        const orderStatusClass = this.getStatusClass(order.status);
        $('#orderStatus')
            .removeClass()
            .addClass(`value status-badge ${orderStatusClass}`)
            .html(`<i class="bg-${orderStatusClass}"></i>${order.status.replace(/_/g, ' ').toUpperCase()}`);

        const paymentStatusClass = this.getPaymentClass(order.payment_status);
        $('#paymentStatus')
            .removeClass()
            .addClass(`value status-badge ${paymentStatusClass}`)
            .html(`<i class="bg-${paymentStatusClass}"></i>${order.payment_status.replace(/_/g, ' ').toUpperCase()}`);

        // Clear previous content
        $('#orderItemsGrid').empty();
        $('.production-timeline').empty();
        $('.payment-history').empty();

        // Initialize order items grid
        if (order.order_items && order.order_items.length > 0) {
            const $itemsGrid = $('<div>').addClass('order-items-table');
            const $table = $(`
                <table class="table align-items-center">
                    <thead class="thead-light">
                        <tr>
                            <th>Jersey Details</th>
                            <th class="text-center">Quantity</th>
                            <th class="text-right">Unit Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `);

            order.order_items.forEach(item => {
                const $row = $(`
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                ${item.main_photo ? `
                                    <div class="mr-3">
                                        <img src="${item.main_photo}" alt="Product" class="avatar rounded">
                                    </div>
                                ` : ''}
                                <div>
                                    <h5 class="mb-0">${item.product_detail?.name || 'Custom Jersey'}</h5>
                                    <p class="text-sm mb-0">${item.size} - ${item.color}</p>
                                    ${item.customization ? `
                                        <span class="badge badge-primary">
                                            ${item.customization.name} #${item.customization.number}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        </td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">${this.formatIDR(item.unit_price)}</td>
                        <td class="text-right">${this.formatIDR(item.quantity * item.unit_price)}</td>
                    </tr>
                `);
                $table.find('tbody').append($row);
            });

            $itemsGrid.append($table);
            $('#orderItemsGrid').append($itemsGrid);
        }

        // Show the modal
        $('#orderDetailsModal').modal('show');
    }

    clearOrderDetails() {
        // Clear all content
        $('#customerName, #customerEmail, #customerPhone, #officeId, #expectedDelivery').empty();
        $('#orderNumber, #createdDate, #updatedDate, #subtotal, #discount, #totalAmount').empty();
        $('#orderStatus, #paymentStatus').empty();
        $('#orderItemsGrid, .production-timeline, .payment-history').empty();
    }
} 