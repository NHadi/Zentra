import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';
import { getBaseUrl } from '../api/config.js';

window.OrderPage = class {
    constructor() {
        this.grid = null;
        this.orderItemsGrid = null;
        this.currentOrder = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

                // Add styles
                $('<style>')
                .text(`
                    
    
                  
                `)
                .appendTo('head');
    }

    dispose() {
        // Clean up event listeners
        $('#orderDetailsModal').off('show.bs.modal');
        $('#orderDetailsModal').off('hide.bs.modal');
        
        // Dispose of grids
        if (this.grid) {
            this.grid.dispose();
            this.grid = null;
        }
        if (this.orderItemsGrid) {
            this.orderItemsGrid.dispose();
            this.orderItemsGrid = null;
        }
    }

    

    bindEvents() {
        // Modal show event
        $('#orderDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const orderId = button.data('order-id');
            if (orderId) {
                this.loadOrderDetails(orderId);
            }
        });

        // Modal hide event
        $('#orderDetailsModal').on('hide.bs.modal', () => {
            this.currentOrder = null;
            this.clearOrderDetails();
        });

        // Tab change events
        $('.nav-tabs a').on('click', (event) => {
            event.preventDefault();
            const $this = $(event.currentTarget);
            const tabId = $this.data('tab');
            
            // Update active states
            $('.nav-tabs a').removeClass('active');
            $this.addClass('active');
            
            // Show corresponding tab content
            $('.tab-pane').removeClass('show active');
            $(`#${tabId}`).addClass('show active');
            
            // Update content if needed
            if (this.currentOrder) {
                this.updateTabContent(`#${tabId}`, this.currentOrder);
            }
        });

        // Action buttons
        $('#editOrder').on('click', () => this.editOrder());
        $('#updateStatus').on('click', () => this.updateOrderStatus());
        $('#printOrder').on('click', () => this.printOrder());
        $('#cancelOrder').on('click', () => this.cancelOrder());
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStats();
    }

    initializeGrid() {
        const gridElement = $('#orderGrid');
        if (!gridElement.length) {
            console.error('Order grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Store reference to this for use in callbacks
        const self = this;

        this.grid = $('#orderGrid').dxDataGrid({
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
                                    .text(new Date(order.created_at).toLocaleDateString())
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'customer_name',
                    caption: 'Customer',
                    cellTemplate: (container, options) => {
                        const order = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(order.customer_name)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .append($('<i>').addClass('fas fa-envelope mr-1'))
                                    .append(order.customer_email)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .append($('<i>').addClass('fas fa-phone mr-1'))
                                    .append(order.customer_phone)
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
                                    .text(`$${options.data.total_amount.toFixed(2)}`)
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
                            this.showOrderDetails(e.row.data);
                        }
                    }, {
                        hint: 'Print Order',
                        icon: 'fas fa-print',
                        onClick: (e) => {
                            this.printInvoice(e.row.data);
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
                template: function(container, options) {
                    // Create a container for the details
                    const $detailContent = $('<div>').addClass('order-detail-container p-4');
                    
                    // Customer Information Section
                    const $customerInfo = $('<div>')
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
                                                    $('<small>').addClass('text-muted').text('Name')
                                                )
                                                .append(
                                                    $('<span>')
                                                        .addClass('font-weight-bold')
                                                        .text(options.data.customer_name)
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
                                                    $('<small>').addClass('text-muted').text('Email')
                                                )
                                                .append(
                                                    $('<span>')
                                                        .addClass('font-weight-bold')
                                                        .text(options.data.customer_email)
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
                                                        .text(options.data.customer_phone)
                                                )
                                        )
                                )
                        );

                    // Order Items Section
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
                        dataSource: options.data.order_items,
                        showBorders: true,
                        columns: [
                            {
                                dataField: 'customization',
                                caption: 'Jersey Details',
                                cellTemplate: function(container, itemOptions) {
                                    const item = itemOptions.data;
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
                                                        .attr('alt', options.data.name)
                                                        .addClass('img-fluid rounded')
                                                    )
                                                )
                                        .append(
                                            $('<div>')
                                                .addClass('item-details')
                                                .append(
                                                    $('<div>')
                                                        .addClass('font-weight-bold mb-1')
                                                        .text(`${productDetail.name}`)
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
                                                        .append(
                                                            customization.patches ? 
                                                                customization.patches.map(patch => 
                                                                    $('<span>')
                                                                        .addClass('customization-badge')
                                                                        .append($('<i>').addClass('fas fa-shield-alt mr-1'))
                                                                        .append(patch.replace(/_/g, ' ').toUpperCase())
                                                                ) : 
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
                                cellTemplate: function(container, itemOptions) {
                                    $('<div>')
                                        .text(`$${itemOptions.value.toFixed(2)}`)
                                        .appendTo(container);
                                }
                            },
                            {
                                dataField: 'final_subtotal',
                                caption: 'Total',
                                width: 120,
                                cellTemplate: function(container, itemOptions) {
                                    $('<div>')
                                        .addClass('font-weight-bold text-primary')
                                        .text(`$${itemOptions.value.toFixed(2)}`)
                                        .appendTo(container);
                                }
                            },
                            {
                                dataField: 'production_status',
                                caption: 'Status',
                                cellTemplate: function(container, itemOptions) {
                                    const status = itemOptions.value;
                                    const statusClass = self.getStatusClass(status);
                                    const statusIcon = self.getStatusIcon(status);
                                    
                                    $('<div>')
                                        .addClass(`order-status ${statusClass}`)
                                        .append($('<i>').addClass(`fas ${statusIcon}`))
                                        .append(status.replace(/_/g, ' ').toUpperCase())
                                        .appendTo(container);
                                }
                            }
                        ]
                    });

                    // Production Timeline Section
                    const $timelineSection = $('<div>')
                        .addClass('mt-4')
                        .append(
                            $('<h6>')
                                .addClass('heading-small text-muted mb-3')
                                .text('Production Timeline')
                        );

                    const $timeline = $('<div>').addClass('production-timeline');
                    self.renderProductionTimeline($timeline, options.data);
                    $timelineSection.append($timeline);

                    // Append all sections to the container
                    $detailContent
                        .append($customerInfo)
                        .append($itemsSection)
                        .append($timelineSection);

                    // Append the detail content to the container
                    container.append($detailContent);
                }
            }
        }).dxDataGrid('instance');

        // Add export buttons
        gridUtils.addExportButtons(this.grid, 'orders');
    }

    async loadData() {
        try {
            const data = await zentra.getOrders();
            this.grid.option('dataSource', data);
            this.updateStats(data);
        } catch (error) {
            console.error('Error loading orders:', error);
            DevExpress.ui.notify('Failed to load orders', 'error', 3000);
        }
    }

    updateStats(data = []) {
        // Calculate statistics
        const totalOrders = data.length;
        const inProduction = data.filter(order => order.status === 'in_production').length;
        const pendingOrders = data.filter(order => order.status === 'pending').length;
        const totalRevenue = data.reduce((sum, order) => sum + order.total_amount, 0);

        // Update UI
        $('#totalOrders').text(totalOrders);
        $('#inProduction').text(inProduction);
        $('#pendingOrders').text(pendingOrders);
        $('#totalRevenue').text(`$${totalRevenue.toFixed(2)}`);
    }

    updateTabContent(tabId, order) {
        switch (tabId) {
            case '#orderInfo':
                this.updateOrderInfoTab(order);
                break;
            case '#itemsInfo':
                this.updateItemsTab(order);
                break;
            case '#productionStatus':
                this.updateProductionTab(order);
                break;
            case '#paymentInfo':
                this.updatePaymentTab(order);
                break;
        }
    }

    updateOrderInfoTab(order) {
        if (!order) return;
        // Update customer information
        $('#customerName').text(order.customer_name || 'N/A');
        $('#customerEmail').text(order.customer_email || 'N/A');
        $('#customerPhone').text(order.customer_phone || 'N/A');
        $('#officeId').text(order.office_id || 'N/A');
        $('#deliveryAddress').text(order.delivery_address || 'N/A');
        $('#expectedDelivery').text(order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A');

        // Update order information
        $('#orderNumber').text(order.order_number || 'N/A');
        $('#createdDate').text(order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A');
        $('#updatedDate').text(order.updated_at ? new Date(order.updated_at).toLocaleDateString() : 'N/A');

        // Update payment information
        $('#subtotal').text(`$${(order.subtotal || 0).toFixed(2)}`);
        $('#discount').text(`-$${(order.discount_amount || 0).toFixed(2)}`);
        $('#totalAmount').text(`$${(order.total_amount || 0).toFixed(2)}`);

        // Update status badges
        this.updateStatusBadge('orderStatus', order.status || 'N/A');
        this.updateStatusBadge('paymentStatus', order.payment_status || 'N/A');
    }

    updateItemsTab(order) {
        if (!order || !order.order_items) return;
        if (!this.orderItemsGrid) {
            this.initializeOrderItemsGrid(order.order_items);
        } else {
            this.orderItemsGrid.option('dataSource', order.order_items);
        }
    }

    updateProductionTab(order) {
        if (!order) return;
        const $timeline = $('.production-timeline');
        $timeline.empty();
        this.renderProductionTimeline($timeline, order);
    }

    updatePaymentTab(order) {
        if (!order) return;
        const $paymentHistory = $('.payment-history');
        $paymentHistory.empty();

        // Create payment history container
        const $container = $('<div>').addClass('payment-history-container');

        // Add payment summary
        const $summary = $('<div>').addClass('payment-summary card mb-4');
        $summary.append(
            $('<div>').addClass('card-body')
                .append($('<h5>').addClass('card-title').text('Payment Summary'))
                .append(
                    $('<div>').addClass('row')
                        .append(
                            $('<div>').addClass('col-md-4')
                                .append($('<p>').addClass('mb-1 text-muted').text('Total Amount'))
                                .append($('<h3>').addClass('text-primary').text(`$${(order.total_amount || 0).toFixed(2)}`))
                        )
                        .append(
                            $('<div>').addClass('col-md-4')
                                .append($('<p>').addClass('mb-1 text-muted').text('Amount Paid'))
                                .append($('<h3>').addClass('text-success').text(`$${((order.total_amount || 0) - (order.balance || 0)).toFixed(2)}`))
                        )
                        .append(
                            $('<div>').addClass('col-md-4')
                                .append($('<p>').addClass('mb-1 text-muted').text('Balance'))
                                .append($('<h3>').addClass('text-danger').text(`$${(order.balance || 0).toFixed(2)}`))
                        )
                )
        );

        // Add payment transactions
        const $transactions = $('<div>').addClass('payment-transactions card');
        const $transactionsBody = $('<div>').addClass('card-body')
            .append($('<h5>').addClass('card-title').text('Payment Transactions'));
        
        // Add transaction list
        if (order.payments && order.payments.length > 0) {
            const $list = $('<div>').addClass('transaction-list');
            order.payments.forEach(payment => {
                const $paymentItem = $('<div>').addClass('payment-item');
                $paymentItem
                    .append(
                        $('<div>').addClass('payment-icon')
                            .append($('<i>').addClass('fas fa-credit-card'))
                    )
                    .append(
                        $('<div>').addClass('payment-details')
                            .append($('<div>').addClass('font-weight-bold').text(payment.payment_method || 'N/A'))
                            .append($('<small>').addClass('text-muted').text(payment.payment_date ? new Date(payment.payment_date).toLocaleString() : 'N/A'))
                    )
                    .append(
                        $('<div>').addClass('payment-amount')
                            .text(`$${(payment.amount || 0).toFixed(2)}`)
                    );
                $list.append($paymentItem);
            });
            $transactionsBody.append($list);
        } else {
            $transactionsBody.append(
                $('<div>').addClass('text-center text-muted py-4')
                    .append($('<i>').addClass('fas fa-receipt fa-3x mb-3'))
                    .append($('<p>').text('No payment transactions found'))
            );
        }

        $transactions.append($transactionsBody);

        // Append all elements to the payment history container
        $container.append($summary).append($transactions);
        $paymentHistory.append($container);
    }

    showOrderDetails(order) {
        this.currentOrder = order;
        
        // Update modal title
        $('#orderTitle').text(`Order ${order.order_number}`);
        
        // Initialize all tabs
        this.updateOrderInfoTab(order);
        this.updateItemsTab(order);
        this.updateProductionTab(order);
        this.updatePaymentTab(order);
        
        // Show modal
        $('#orderDetailsModal').modal('show');
    }

    initializeOrderItemsGrid(items) {
        if (this.orderItemsGrid) {
            this.orderItemsGrid.dispose();
        }

        this.orderItemsGrid = $('#orderItemsGrid').dxDataGrid({
            dataSource: items,
            showBorders: true,
            columns: [
                {
                    dataField: 'customization',
                    caption: 'Jersey Details',
                    cellTemplate: function(container, options) {
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
                                            .attr('alt', options.data.name)
                                            .addClass('img-fluid rounded')
                                        )
                                    )
                            .append(
                                $('<div>')
                                    .addClass('item-details')
                                    .append(
                                        $('<div>')
                                            .addClass('font-weight-bold mb-1')
                                            .text(`${productDetail.name}`)
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
                                            .append(
                                                customization.patches ? 
                                                    customization.patches.map(patch => 
                                                        $('<span>')
                                                            .addClass('customization-badge')
                                                            .append($('<i>').addClass('fas fa-shield-alt mr-1'))
                                                            .append(patch.replace(/_/g, ' ').toUpperCase())
                                                    ) : 
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
                    width: 100,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('font-weight-bold')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'unit_price',
                    caption: 'Unit Price',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('font-weight-bold')
                            .text(`$${options.value.toFixed(2)}`)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'discount_amount',
                    caption: 'Discount',
                    width: 120,
                    cellTemplate: (container, options) => {
                        if (options.value > 0) {
                            $('<div>')
                                .addClass('text-success font-weight-bold')
                                .text(`-$${options.value.toFixed(2)}`)
                                .appendTo(container);
                        } else {
                            $('<div>')
                                .addClass('text-muted')
                                .text('-')
                                .appendTo(container);
                        }
                    }
                },
                {
                    dataField: 'final_subtotal',
                    caption: 'Total',
                    width: 120,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('font-weight-bold text-primary')
                            .text(`$${options.value.toFixed(2)}`)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'production_status',
                    caption: 'Status',
                    width: 150,
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
                }
            ],
            summary: {
                totalItems: [{
                    column: 'final_subtotal',
                    summaryType: 'sum',
                    valueFormat: {
                        type: 'currency',
                        precision: 2
                    },
                    customizeText: (data) => {
                        return `Total: $${data.value.toFixed(2)}`;
                    }
                }]
            }
        }).dxDataGrid('instance');
    }

    renderProductionTimeline($container, order) {
        $container.empty();

        // Add timeline styles
        const timelineStyles = document.createElement('style');
        timelineStyles.setAttribute('data-timeline-styles', '');
        timelineStyles.textContent = `
            .production-timeline {
                padding: 2rem;
                background: #f8f9fc;
                border-radius: 1rem;
                box-shadow: 0 0 20px rgba(0,0,0,0.03);
            }

            .timeline-header {
                display: flex;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .timeline-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #32325d;
                margin: 0;
            }

            .timeline-meta {
                margin-left: auto;
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .timeline-meta-item {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #8898aa;
            }

            .timeline-meta-item i {
                margin-right: 0.5rem;
                color: #5e72e4;
            }

            .timeline-stage {
                position: relative;
                padding: 2rem;
                background: white;
                border-radius: 1rem;
                margin-bottom: 2rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .timeline-stage:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.05);
            }

            .timeline-stage:last-child {
                margin-bottom: 0;
            }

            .timeline-stage.completed {
                border-left: 4px solid #2dce89;
            }

            .timeline-stage.current {
                border-left: 4px solid #5e72e4;
            }

            .timeline-stage.pending {
                border-left: 4px solid #e9ecef;
            }

            .timeline-stage-header {
                display: flex;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .timeline-stage-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: #5e72e4;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
                font-size: 1.25rem;
                box-shadow: 0 4px 6px rgba(94, 114, 228, 0.1);
            }

            .timeline-stage-info {
                flex: 1;
            }

            .timeline-stage-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: #32325d;
                margin-bottom: 0.25rem;
            }

            .timeline-stage-subtitle {
                font-size: 0.875rem;
                color: #8898aa;
            }

            .timeline-stage-date {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #8898aa;
            }

            .timeline-tasks {
                margin-top: 1.5rem;
                margin-left: 4rem;
            }

            .timeline-task-item {
                position: relative;
                padding: 1.5rem;
                background: #f8f9fc;
                border-radius: 0.75rem;
                margin-bottom: 1rem;
                transition: transform 0.2s ease;
            }

            .timeline-task-item:hover {
                transform: translateX(4px);
            }

            .timeline-task-item:last-child {
                margin-bottom: 0;
            }

            .task-status-badge {
                position: absolute;
                top: 1rem;
                right: 1rem;
                padding: 0.375rem 1rem;
                border-radius: 2rem;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .task-status-completed {
                background: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .task-status-in-progress {
                background: rgba(251, 99, 64, 0.1);
                color: #fb6340;
                animation: pulse 2s infinite;
            }

            .task-status-pending {
                background: rgba(136, 152, 170, 0.1);
                color: #8898aa;
            }

            .task-info {
                margin-right: 7rem;
            }

            .task-name {
                font-size: 1rem;
                font-weight: 600;
                color: #32325d;
                margin-bottom: 0.5rem;
            }

            .task-details {
                font-size: 0.875rem;
                color: #8898aa;
                margin-bottom: 1rem;
            }

            .task-progress {
                margin-bottom: 1rem;
            }

            .progress {
                height: 6px;
                border-radius: 3px;
                background: #e9ecef;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(45deg, #5e72e4, #825ee4);
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            .task-meta {
                display: flex;
                align-items: center;
                gap: 2rem;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(0,0,0,0.05);
            }

            .task-employee {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #525f7f;
            }

            .task-employee i {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 0.75rem;
            }

            .task-time {
                display: flex;
                align-items: center;
                font-size: 0.875rem;
                color: #8898aa;
            }

            .task-time i {
                margin-right: 0.5rem;
                color: #5e72e4;
            }

            .task-notes {
                margin-top: 1rem;
                padding: 1rem;
                background: white;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                color: #525f7f;
                font-style: italic;
                border-left: 3px solid #5e72e4;
            }

            .task-notes i {
                color: #5e72e4;
                margin-right: 0.5rem;
            }

            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(251, 99, 64, 0.2); }
                70% { box-shadow: 0 0 0 10px rgba(251, 99, 64, 0); }
                100% { box-shadow: 0 0 0 0 rgba(251, 99, 64, 0); }
            }

            .timeline-connector {
                position: absolute;
                left: -2px;
                top: 0;
                bottom: -2rem;
                width: 4px;
                background: #e9ecef;
                z-index: 0;
            }

            .timeline-stage:last-child .timeline-connector {
                display: none;
            }

            .timeline-stage.completed .timeline-connector {
                background: #2dce89;
            }

            .timeline-stage.current .timeline-connector {
                background: linear-gradient(to bottom, #5e72e4 50%, #e9ecef 50%);
            }

            .timeline-summary {
                margin-top: 2rem;
                padding: 1.5rem;
                background: white;
                border-radius: 0.75rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            }

            .timeline-summary-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #8898aa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 1rem;
            }

            .timeline-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .timeline-stat-item {
                padding: 1rem;
                background: #f8f9fc;
                border-radius: 0.5rem;
                text-align: center;
            }

            .timeline-stat-value {
                font-size: 1.5rem;
                font-weight: 600;
                color: #5e72e4;
                margin-bottom: 0.25rem;
            }

            .timeline-stat-label {
                font-size: 0.875rem;
                color: #8898aa;
            }
        `;

        if (!document.querySelector('style[data-timeline-styles]')) {
            document.head.appendChild(timelineStyles);
        }

        const $timelineContainer = $('<div>').addClass('production-timeline');

        // Add timeline header
        $timelineContainer.append(
            $('<div>').addClass('timeline-header')
                .append($('<h3>').addClass('timeline-title').text('Production Timeline'))
                .append(
                    $('<div>').addClass('timeline-meta')
                        .append(
                            $('<div>').addClass('timeline-meta-item')
                                .append($('<i>').addClass('far fa-calendar-alt'))
                                .append(new Date(order.created_at).toLocaleDateString())
                        )
                        .append(
                            $('<div>').addClass('timeline-meta-item')
                                .append($('<i>').addClass('far fa-clock'))
                                .append(new Date(order.created_at).toLocaleTimeString())
                        )
                )
        );

        // Get production details
        const { taskProgress, tasksByType } = this.getProductionDetails(order);

        // Add stages
        this.renderStages($timelineContainer, order, taskProgress, tasksByType);

        // Add summary section
        this.renderSummary($timelineContainer, taskProgress);

        $container.append($timelineContainer);
    }

    getProductionDetails(order) {
        const allTasks = order.order_items.flatMap(item => item.tasks || []);
        const tasksByType = {};
        
        allTasks.forEach(task => {
            if (!tasksByType[task.task_type]) {
                tasksByType[task.task_type] = [];
            }
            tasksByType[task.task_type].push(task);
        });

        // Calculate progress for each task type
        const taskProgress = {};
        Object.entries(tasksByType).forEach(([type, tasks]) => {
            const total = tasks.length;
            const completed = tasks.filter(t => t.status === 'completed').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            taskProgress[type] = {
                total,
                completed,
                inProgress,
                percentage: Math.round((completed / total) * 100)
            };
        });

        return { taskProgress, tasksByType };
    }

    renderStages($container, order, taskProgress, tasksByType) {
        // Order Received Stage
        const $receivedStage = this.createTimelineStage({
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
        $container.append($receivedStage);

        // Order Confirmed Stage
        if (order.status !== 'pending') {
            const $confirmedStage = this.createTimelineStage({
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
            $container.append($confirmedStage);
        }

        // Production Stage
        if (order.status === 'in_production') {
            const $productionStage = this.createTimelineStage({
                icon: 'cogs',
                title: 'Production in Progress',
                subtitle: 'Manufacturing and customization',
                date: new Date(order.updated_at),
                status: 'current',
                tasks: Object.entries(tasksByType).map(([type, tasks]) => {
                    const progress = taskProgress[type];
                    return {
                        status: progress.completed === progress.total ? 'completed' : 
                               progress.inProgress > 0 ? 'in-progress' : 'pending',
                        name: type.replace(/_/g, ' ').toUpperCase(),
                        details: `${progress.completed} of ${progress.total} items completed`,
                        progress: progress.percentage,
                        tasks: tasks.map(task => ({
                            status: task.status,
                            employee_name: task.employee_name,
                            started_at: task.started_at,
                            completed_at: task.completed_at,
                            notes: task.notes
                        }))
                    };
                })
            });
            $container.append($productionStage);
        }
    }

    renderSummary($container, taskProgress) {
        const totalTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.total, 0);
        const completedTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.completed, 0);
        const inProgressTasks = Object.values(taskProgress).reduce((sum, progress) => sum + progress.inProgress, 0);
        const overallProgress = Math.round((completedTasks / totalTasks) * 100);

        const $summary = $('<div>').addClass('timeline-summary')
            .append($('<h4>').addClass('timeline-summary-title').text('Production Summary'))
            .append(
                $('<div>').addClass('timeline-stats')
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(`${overallProgress}%`))
                            .append($('<div>').addClass('timeline-stat-label').text('Overall Progress'))
                    )
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(completedTasks))
                            .append($('<div>').addClass('timeline-stat-label').text('Tasks Completed'))
                    )
                    .append(
                        $('<div>').addClass('timeline-stat-item')
                            .append($('<div>').addClass('timeline-stat-value').text(inProgressTasks))
                            .append($('<div>').addClass('timeline-stat-label').text('Tasks In Progress'))
                    )
            );

        $container.append($summary);
    }

    createTimelineStage({ icon, title, subtitle, date, status, tasks }) {
        const $stage = $('<div>').addClass(`timeline-stage ${status}`);
        
        // Add connector line
        $stage.append($('<div>').addClass('timeline-connector'));
        
        // Stage header
        $stage.append(
            $('<div>').addClass('timeline-stage-header')
                .append(
                    $('<div>').addClass('timeline-stage-icon')
                        .append($('<i>').addClass(`fas fa-${icon}`))
                )
                .append(
                    $('<div>').addClass('timeline-stage-info')
                        .append($('<div>').addClass('timeline-stage-title').text(title))
                        .append($('<div>').addClass('timeline-stage-subtitle').text(subtitle))
                )
                .append(
                    $('<div>').addClass('timeline-stage-date')
                        .append($('<i>').addClass('far fa-calendar-alt'))
                        .append(date.toLocaleDateString())
                        .append($('<i>').addClass('far fa-clock ml-2'))
                        .append(date.toLocaleTimeString())
                )
        );

        // Tasks container
        const $tasks = $('<div>').addClass('timeline-tasks');
        
        tasks.forEach(task => {
            const $taskItem = $('<div>').addClass('timeline-task-item');
            
            // Status badge
            $taskItem.append(
                $('<div>')
                    .addClass(`task-status-badge task-status-${task.status}`)
                    .text(task.status.replace(/_/g, ' ').toUpperCase())
            );

            // Task info
            const $taskInfo = $('<div>').addClass('task-info');
            $taskInfo.append($('<div>').addClass('task-name').text(task.name));
            $taskInfo.append($('<div>').addClass('task-details').text(task.details));

            // Add progress bar if available
            if (task.progress !== undefined) {
                $taskInfo.append(
                    $('<div>').addClass('task-progress')
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

            // Add task meta information
            const $taskMeta = $('<div>').addClass('task-meta');

            // Add subtasks if available
            if (task.tasks) {
                task.tasks.forEach(subtask => {
                    const $subtaskInfo = $('<div>').addClass('task-employee');
                    $subtaskInfo.append($('<i>').addClass('fas fa-user'));
                    
                    let subtaskText = `${subtask.employee_name}`;
                    if (subtask.started_at) {
                        $taskMeta.append(
                            $('<div>').addClass('task-time')
                                .append($('<i>').addClass('far fa-play-circle'))
                                .append(new Date(subtask.started_at).toLocaleString())
                        );
                    }
                    if (subtask.completed_at) {
                        $taskMeta.append(
                            $('<div>').addClass('task-time')
                                .append($('<i>').addClass('far fa-check-circle'))
                                .append(new Date(subtask.completed_at).toLocaleString())
                        );
                    }
                    
                    $subtaskInfo.append(subtaskText);
                    $taskMeta.prepend($subtaskInfo);
                    
                    if (subtask.notes) {
                        $taskInfo.append(
                            $('<div>').addClass('task-notes')
                                .append($('<i>').addClass('fas fa-sticky-note'))
                                .append(subtask.notes)
                        );
                    }
                });
            }

            $taskInfo.append($taskMeta);
            $taskItem.append($taskInfo);

            // Add task time if available
            if (task.time) {
                $taskMeta.append(
                    $('<div>').addClass('task-time')
                        .append($('<i>').addClass('far fa-clock'))
                        .append(task.time.toLocaleString())
                );
            }

            $tasks.append($taskItem);
        });

        $stage.append($tasks);
        return $stage;
    }

    updateStatusBadge(elementId, status) {
        const $badge = $(`#${elementId}`);
        const statusClass = this.getStatusClass(status);
        const statusIcon = this.getStatusIcon(status);
        
        $badge
            .removeClass()
            .addClass(`badge badge-dot mr-4 ${statusClass}`)
            .find('.status')
            .html(`<i class="fas ${statusIcon} mr-1"></i>${status.replace(/_/g, ' ').toUpperCase()}`);
    }

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

    clearOrderDetails() {
        // Clear all dynamic content
        $('#orderItemsGrid').empty();
        $('.production-timeline').empty();
        $('.payment-history').empty();
        
        // Reset grids
        if (this.orderItemsGrid) {
            this.orderItemsGrid.dispose();
            this.orderItemsGrid = null;
        }
    }

    editOrder() {
        if (this.currentOrder) {
            // Implement edit functionality
            console.log('Edit order:', this.currentOrder);
        }
    }

    async updateOrderStatus() {
        if (this.currentOrder) {
            // Create status update modal
            const statusModal = `
                <div class="modal fade" id="statusUpdateModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Update Order Status</h5>
                                <button type="button" class="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="form-group">
                                    <label>New Status</label>
                                    <select class="form-control" id="newStatus">
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="in_production">In Production</option>
                                        <option value="quality_check">Quality Check</option>
                                        <option value="ready_for_delivery">Ready for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Send WhatsApp Notification</label>
                                    <div class="custom-control custom-checkbox">
                                        <input type="checkbox" class="custom-control-input" id="sendWhatsApp" checked>
                                        <label class="custom-control-label" for="sendWhatsApp">Send notification to customer</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Additional Message (Optional)</label>
                                    <textarea class="form-control" id="additionalMessage" rows="3" placeholder="Add any additional information for the customer..."></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="confirmStatusUpdate">Update Status</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to body if not exists
            if (!$('#statusUpdateModal').length) {
                $('body').append(statusModal);
            }

            // Show modal
            $('#statusUpdateModal').modal('show');

            // Handle status update confirmation
            $('#confirmStatusUpdate').off('click').on('click', async () => {
                const newStatus = $('#newStatus').val();
                const sendWhatsApp = $('#sendWhatsApp').is(':checked');
                const additionalMessage = $('#additionalMessage').val();

                try {
                    // Update order status
                    await zentra.updateOrderStatus(this.currentOrder.id, newStatus);

                    // Send WhatsApp notification if enabled
                    if (sendWhatsApp) {
                        await this.sendWhatsAppNotification(this.currentOrder, newStatus, additionalMessage);
                    }

                    // Show success message
                    DevExpress.ui.notify('Order status updated successfully', 'success', 3000);

                    // Refresh order details
                    this.loadOrderDetails(this.currentOrder.id);

                    // Close modal
                    $('#statusUpdateModal').modal('hide');
                } catch (error) {
                    console.error('Error updating order status:', error);
                    DevExpress.ui.notify('Failed to update order status', 'error', 3000);
                }
            });
        }
    }

    async sendWhatsAppNotification(order, newStatus, additionalMessage = '') {
        try {
            // Get status message template
            const statusMessage = this.getStatusMessage(order, newStatus, additionalMessage);

            // Send WhatsApp message
            await zentra.sendWhatsAppMessage({
                to: order.customer_phone,
                message: statusMessage
            });

            DevExpress.ui.notify('WhatsApp notification sent successfully', 'success', 3000);
        } catch (error) {
            console.error('Error sending WhatsApp notification:', error);
            DevExpress.ui.notify('Failed to send WhatsApp notification', 'error', 3000);
        }
    }

    getStatusMessage(order, newStatus, additionalMessage = '') {
        const statusMessages = {
            pending: `Dear ${order.customer_name},\n\nYour order #${order.order_number} has been received and is pending confirmation. We will process it shortly.\n\nThank you for choosing us!`,
            confirmed: `Dear ${order.customer_name},\n\nYour order #${order.order_number} has been confirmed. We will start processing your order soon.\n\nThank you for your patience!`,
            in_production: `Dear ${order.customer_name},\n\nYour order #${order.order_number} is now in production. We will keep you updated on the progress.\n\nThank you for your patience!`,
            quality_check: `Dear ${order.customer_name},\n\nYour order #${order.order_number} is undergoing quality check. We will notify you once it passes inspection.\n\nThank you for your patience!`,
            ready_for_delivery: `Dear ${order.customer_name},\n\nYour order #${order.order_number} is ready for delivery. We will arrange the delivery soon.\n\nThank you for choosing us!`,
            delivered: `Dear ${order.customer_name},\n\nYour order #${order.order_number} has been delivered. We hope you are satisfied with our service!\n\nThank you for choosing us!`,
            cancelled: `Dear ${order.customer_name},\n\nWe regret to inform you that your order #${order.order_number} has been cancelled. Please contact us for more information.\n\nWe apologize for any inconvenience caused.`
        };

        let message = statusMessages[newStatus] || statusMessages.pending;

        // Add additional message if provided
        if (additionalMessage) {
            message += `\n\nAdditional Information:\n${additionalMessage}`;
        }

        return message;
    }

    printOrder() {
        if (this.currentOrder) {
            this.printInvoice(this.currentOrder);
        }
    }

    printInvoice(order) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Create the invoice HTML
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - Order #${order.order_number}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .invoice-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 20px;
                    }
                    .invoice-title {
                        font-size: 24px;
                        color: #5e72e4;
                        margin: 0;
                    }
                    .invoice-subtitle {
                        color: #666;
                        margin: 5px 0;
                    }
                    .invoice-details {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .company-info, .customer-info {
                        flex: 1;
                    }
                    .info-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .items-table th, .items-table td {
                        border: 1px solid #ddd;
                        padding: 10px;
                        text-align: left;
                    }
                    .items-table th {
                        background-color: #f8f9fc;
                    }
                    .total-section {
                        text-align: right;
                        margin-top: 20px;
                    }
                    .total-row {
                        margin: 5px 0;
                    }
                    .total-label {
                        display: inline-block;
                        width: 150px;
                        font-weight: bold;
                    }
                    .total-value {
                        display: inline-block;
                        width: 100px;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="invoice-header">
                    <h1 class="invoice-title">INVOICE</h1>
                    <p class="invoice-subtitle">Order #${order.order_number}</p>
                    <p class="invoice-subtitle">Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                </div>

                <div class="invoice-details">
                    <div class="company-info">
                        <div class="info-title">From:</div>
                        <div>zentra</div>
                        <div>123 Business Street</div>
                        <div>City, State, ZIP</div>
                        <div>Phone: (123) 456-7890</div>
                        <div>Email: info@zentra.com</div>
                    </div>
                    <div class="customer-info">
                        <div class="info-title">To:</div>
                        <div>${order.customer_name}</div>
                        <div>${order.customer_email}</div>
                        <div>${order.customer_phone}</div>
                        <div>${order.delivery_address}</div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Size</th>
                            <th>Color</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.order_items.map(item => `
                            <tr>
                                <td>${item.product_detail?.name || 'Custom Item'}</td>
                                <td>${item.size}</td>
                                <td>${item.color}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.unit_price.toFixed(2)}</td>
                                <td>$${(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-value">$${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Discount:</span>
                        <span class="total-value">-$${order.discount_amount.toFixed(2)}</span>
                    </div>
                    <div class="total-row" style="font-size: 18px; font-weight: bold;">
                        <span class="total-label">Total Amount:</span>
                        <span class="total-value">$${order.total_amount.toFixed(2)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>This is a computer-generated invoice. No signature is required.</p>
                </div>

                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #5e72e4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print Invoice
                    </button>
                </div>
            </body>
            </html>
        `;

        // Write the HTML to the new window
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    }

    cancelOrder() {
        if (this.currentOrder) {
            DevExpress.ui.dialog.confirm(
                'Are you sure you want to cancel this order?',
                'Confirm Cancellation'
            ).then((result) => {
                if (result) {
                    // Implement cancel functionality
                    console.log('Cancel order:', this.currentOrder);
                }
            });
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.orderPageInstance) {
    window.orderPageInstance = new window.OrderPage();
} 