import { orderAPI } from '../api/modules/orders.js';
import { gridUtils } from '../utils/gridUtils.js';
import { getBaseUrl } from '../api/config.js';
import { officeAPI } from '../api/modules/offices.js';
import { productAPI } from '../api/modules/products.js';

window.OrderPage = class {
    constructor() {
        this.grid = null;
        this.orderItemsGrid = null;
        this.currentOrder = null;
        this.orderItems = [];
        
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

        // Create order button
        $('#createOrderBtn').on('click', () => {
            this.showCreateOrderModal();
        });
        
        // Create order form submission
        $('#saveOrder').on('click', () => {
            this.createOrder();
        });
        
        // Edit order button in details modal
        $('#editOrder').on('click', () => {
            this.showEditOrderModal();
        });
        
        // Update order form submission
        $('#updateOrder').on('click', () => {
            this.updateOrder();
        });
        
        // Cancel order button
        $('#cancelOrder').on('click', () => {
            this.confirmCancelOrder();
        });
        
        // Update order status button
        $('#updateStatus').on('click', () => {
            this.updateOrderStatus();
        });
        
        // Calculate total amount from subtotal and discount in create form
        $('#input-subtotal, #input-discount').on('input', this.calculateTotal);
        
        // Calculate total amount from subtotal and discount in edit form
        $('#edit-subtotal, #edit-discount').on('input', this.calculateTotal);

        // Add item button handler
        $('#addItemBtn').on('click', () => {
            const item = {
                ProductID: Number($('#productSelect').val()),
                Quantity: Number($('#itemQuantity').val()),
                Size: $('#itemSize').val(),
                Color: $('#itemColor').val()
            };
            this.orderItems.push(item);
            this.renderOrderItemsTable();
        });
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
            if (!this.grid) {
                console.warn('Grid instance is not available');
                return;
            }

            // Show loading panel
            this.grid.beginCustomLoading('Loading orders...');
            
            const orders = await orderAPI.getOrders();
            if (Array.isArray(orders)) {
                this.grid.option('dataSource', orders);
                this.updateStats(orders);
            } else {
                console.warn('Invalid data format received:', orders);
                this.grid.option('dataSource', []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            if (gridUtils && gridUtils.handleGridError) {
                gridUtils.handleGridError(error, 'loading orders');
            } else {
                alert('Failed to load orders. Please try again.');
            }
        } finally {
            // Always hide loading panel if grid exists
            if (this.grid) {
                this.grid.endCustomLoading();
            }
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
        // Clear previous content
        this.clearOrderDetails();
        
        // Update the appropriate tab based on tabId
        switch (tabId) {
            case 'orderInfo':
                this.updateOrderInfoTab(order);
                break;
            case 'itemsInfo':
                this.updateItemsTab(order);
                break;
            case 'productionStatus':
                this.updateProductionTab(order);
                break;
            case 'paymentInfo':
                this.updatePaymentTab(order);
                break;
            default:
                // Default to orderInfo tab
                this.updateOrderInfoTab(order);
        }
        
        // Activate the tab
        $(`a[data-tab="${tabId}"]`).tab('show');
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
        // Store the current order for reference in other methods
        this.currentOrder = order;
        
        // Update the modal title
        $('#orderTitle').text(`Order Details: ${order.orderNumber}`);
        
        // Update tab content
        this.updateTabContent('orderInfo', order);
        
        // Show the modal
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
        try {
            const order = this.currentOrder;
            if (!order) return;
            
            // Prompt for new status
            const newStatus = prompt("Enter new status (pending, confirmed, in_production, quality_check, ready_for_delivery, delivered, cancelled):", order.status);
            if (newStatus === null) return; // User cancelled
            
            const additionalMessage = prompt("Enter additional message (optional):", "");
            const sendNotification = confirm("Send notification to customer?");
            
            const statusData = {
                status: newStatus,
                send_notification: sendNotification,
                additional_message: additionalMessage || ""
            };
            
            // Update order status
            await orderAPI.updateOrderStatus(order.id, statusData);
            
            // Refresh data
            await this.loadData();
            
            // Show success message
            console.log('Order status updated successfully!');
            alert('Order status updated successfully!');
            
        } catch (error) {
            console.error('Update status error:', error);
            alert(error.message || 'Failed to update order status. Please try again.');
        }
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

    // Calculate total amount from subtotal and discount
    calculateTotal(e) {
        const formPrefix = $(e.target).attr('id').startsWith('edit-') ? 'edit-' : 'input-';
        const subtotal = parseFloat($(`#${formPrefix}subtotal`).val()) || 0;
        const discount = parseFloat($(`#${formPrefix}discount`).val()) || 0;
        const total = Math.max(0, subtotal - discount).toFixed(2);
        $(`#${formPrefix}total`).val(total);
    }

    // Show create order modal
    async showCreateOrderModal() {
        // Reset form
        $('#createOrderForm')[0].reset();
        
        // Load offices for dropdown
        await this.loadOffices('#input-office');
        
        // Load products for dropdown
        await this.loadProducts();
        
        // Show modal
        $('#createOrderModal').modal('show');
        
        // Reset items
        this.orderItems = [];
        this.renderOrderItemsTable();
    }

    // Load offices for dropdown
    async loadOffices(targetSelector) {
        try {
            const offices = await officeAPI.getOffices();
            const $select = $(targetSelector);
            $select.empty();
            $select.append('<option value="">Select Office</option>');
            offices.forEach(office => {
                $select.append(`<option value="${office.id}">${office.name}</option>`);
            });
        } catch (error) {
            console.error('Failed to load offices:', error);
            gridUtils.handleGridError(error, 'loading offices');
        }
    }

    // Load products for dropdown
    async loadProducts() {
        try {
            const products = await productAPI.getProducts();
            const $select = $('#productSelect');
            $select.empty();
            products.forEach(p => $select.append(`<option value="${p.id}">${p.name}</option>`));
        } catch (error) {
            console.error('Failed to load products:', error);
            gridUtils.handleGridError(error, 'loading products');
        }
    }

    // Render order items table
    renderOrderItemsTable() {
        const $tbody = $('#orderItemsTable tbody');
        $tbody.empty();
        this.orderItems.forEach((item, idx) => {
            $tbody.append(`
                <tr>
                    <td>${$('#productSelect option[value="'+item.ProductID+'"]').text()}</td>
                    <td>${item.Quantity}</td>
                    <td>${item.Size}</td>
                    <td>${item.Color}</td>
                    <td><button type="button" class="btn btn-danger btn-sm" data-idx="${idx}">Remove</button></td>
                </tr>
            `);
        });
        // Remove item handler
        $tbody.find('button').on('click', (e) => {
            const idx = $(e.target).data('idx');
            this.orderItems.splice(idx, 1);
            this.renderOrderItemsTable();
        });
    }

    // Create a new order
    async createOrder() {
        try {
            // Validate form
            const form = $('#createOrderForm')[0];
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            // Map to PascalCase keys for backend compatibility
            const orderData = {
                OrderNumber: formData.get('orderNumber'),
                CustomerName: formData.get('customerName'),
                CustomerEmail: formData.get('customerEmail'),
                CustomerPhone: formData.get('customerPhone'),
                DeliveryAddress: formData.get('deliveryAddress'),
                OfficeID: Number(formData.get('officeId')),
                ExpectedDeliveryDate: formData.get('expectedDeliveryDate'),
                Subtotal: Number(formData.get('subtotal')),
                DiscountAmount: Number(formData.get('discountAmount')),
                TotalAmount: Number(formData.get('totalAmount')),
                Status: formData.get('status'),
                PaymentStatus: formData.get('paymentStatus'),
                Notes: formData.get('notes'),
                OrderItems: this.orderItems
            };
            
            // Send API request
            const response = await orderAPI.createOrder(orderData);
            
            // Close modal and refresh data
            $('#createOrderModal').modal('hide');
            await this.loadData();
            
            // Show success message
            gridUtils.showSuccess('Order created successfully!');
        } catch (error) {
            console.error('Create order error:', error);
            gridUtils.handleGridError(error, 'creating order');
        }
    }

    // Show edit order modal with pre-populated data
    showEditOrderModal() {
        // Get current order
        const currentOrder = this.currentOrder;
        if (!currentOrder) return;
        
        // Populate form with current order data
        $('#edit-order-id').val(currentOrder.id);
        $('#edit-order-number').val(currentOrder.orderNumber);
        $('#edit-customer-name').val(currentOrder.customerName);
        $('#edit-customer-email').val(currentOrder.customerEmail);
        $('#edit-customer-phone').val(currentOrder.customerPhone);
        $('#edit-delivery-address').val(currentOrder.deliveryAddress);
        $('#edit-subtotal').val(currentOrder.subtotal);
        $('#edit-discount').val(currentOrder.discountAmount);
        $('#edit-total').val(currentOrder.totalAmount);
        $('#edit-status').val(currentOrder.status);
        $('#edit-payment-status').val(currentOrder.paymentStatus);
        $('#edit-expected-delivery').val(currentOrder.expectedDeliveryDate?.split('T')[0]);
        $('#edit-notes').val(currentOrder.notes);
        
        // Load offices for dropdown
        this.loadOffices('#edit-office').then(() => {
            $('#edit-office').val(currentOrder.officeId);
        });
        
        // Hide details modal and show edit modal
        $('#orderDetailsModal').modal('hide');
        $('#editOrderModal').modal('show');
    }

    // Update existing order
    async updateOrder() {
        try {
            // Validate form
            const form = $('#editOrderForm')[0];
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            // Get form data
            const formData = new FormData(form);
            // Map to PascalCase keys for backend compatibility
            const orderData = {
                CustomerName: formData.get('customerName'),
                CustomerEmail: formData.get('customerEmail'),
                CustomerPhone: formData.get('customerPhone'),
                DeliveryAddress: formData.get('deliveryAddress'),
                OfficeID: Number(formData.get('officeId')),
                ExpectedDeliveryDate: formData.get('expectedDeliveryDate'),
                Subtotal: Number(formData.get('subtotal')),
                DiscountAmount: Number(formData.get('discountAmount')),
                TotalAmount: Number(formData.get('totalAmount')),
                Status: formData.get('status'),
                PaymentStatus: formData.get('paymentStatus'),
                Notes: formData.get('notes'),
                OrderItems: this.orderItems
            };
            
            const orderId = $('#edit-order-id').val();
            
            // Send API request
            const response = await orderAPI.updateOrder(orderId, orderData);
            
            // Close modal and refresh data
            $('#editOrderModal').modal('hide');
            await this.loadData();
            
            // Show success message
            gridUtils.showSuccess('Order updated successfully!');
        } catch (error) {
            console.error('Update order error:', error);
            gridUtils.handleGridError(error, 'updating order');
        }
    }

    // Confirm order cancellation
    confirmCancelOrder() {
        const order = this.currentOrder;
        if (!order) return;
        
        if (confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)) {
            this.cancelOrder();
        }
    }

    // Cancel order
    async cancelOrder() {
        try {
            const order = this.currentOrder;
            if (!order) return;
            
            // Update order status to cancelled
            const statusData = {
                status: 'cancelled',
                send_notification: true,
                additional_message: 'Your order has been cancelled.'
            };
            
            await orderAPI.updateOrderStatus(order.id, statusData);
            
            // Close modal and refresh data
            $('#orderDetailsModal').modal('hide');
            await this.loadData();
            
            // Show success message
            gridUtils.showSuccess('Order cancelled successfully!');
        } catch (error) {
            console.error('Cancel order error:', error);
            gridUtils.handleGridError(error, 'cancelling order');
        }
    }

    // Update order status
    async updateOrderStatus() {
        try {
            const order = this.currentOrder;
            if (!order) return;
            
            // Prompt for new status
            const newStatus = prompt("Enter new status (pending, confirmed, in_production, quality_check, ready_for_delivery, delivered, cancelled):", order.status);
            if (newStatus === null) return; // User cancelled
            
            const additionalMessage = prompt("Enter additional message (optional):", "");
            const sendNotification = confirm("Send notification to customer?");
            
            const statusData = {
                status: newStatus,
                send_notification: sendNotification,
                additional_message: additionalMessage || ""
            };
            
            // Update order status
            await orderAPI.updateOrderStatus(order.id, statusData);
            
            // Refresh data
            await this.loadData();
            
            // Show success message
            console.log('Order status updated successfully!');
            alert('Order status updated successfully!');
            
        } catch (error) {
            console.error('Update status error:', error);
            alert(error.message || 'Failed to update order status. Please try again.');
        }
    }
};

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.orderPageInstance) {
    window.orderPageInstance = new window.OrderPage();
} 