import { getBaseUrl } from '../../../api/config.js';

export class OrderDetails {
    constructor(orderPage) {
        this.orderPage = orderPage;
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

    render(container, order) {
        // Create a container for the details
        const $detailContent = $('<div>').addClass('order-detail-container p-4');
        
        // Customer Information Section
        const $customerInfo = this.createCustomerInfoSection(order);

        // Order Items Section
        const $itemsSection = this.createItemsSection(order);

        // Production Timeline Section
        const $timelineSection = this.createTimelineSection(order);

        // Payment Section
        const $paymentSection = this.renderPaymentSection(order);

        // Append all sections to the container
        $detailContent
            .append($customerInfo)
            .append($itemsSection)
            .append($timelineSection)
            .append($paymentSection);

        // Append the detail content to the container
        container.append($detailContent);
    }

    createCustomerInfoSection(order) {
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
                    .append(this.createInfoColumn('Name', order.customer_name))
                    .append(this.createInfoColumn('Email', order.customer_email))
                    .append(this.createInfoColumn('Phone', order.customer_phone))
            );
    }

    createInfoColumn(label, value) {
        return $('<div>')
            .addClass('col-md-4')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<small>').addClass('text-muted').text(label)
                    )
                    .append(
                        $('<span>')
                            .addClass('font-weight-bold')
                            .text(value)
                    )
            );
    }

    createItemsSection(order) {
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
                            .text(`$${options.value.toFixed(2)}`)
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
                            .text(`$${options.value.toFixed(2)}`)
                            .appendTo(container);
                    }
                }
            ]
        });

        return $itemsSection;
    }

    createTimelineSection(order) {
        const $timelineSection = $('<div>')
            .addClass('mt-4')
            .append(
                $('<h6>')
                    .addClass('heading-small text-muted mb-3')
                    .text('Production Timeline')
            );

        const $timeline = $('<div>').addClass('production-timeline');
        this.orderPage.orderTimeline.render($timeline, order);
        $timelineSection.append($timeline);

        return $timelineSection;
    }

    renderPaymentSection(order) {
        const $paymentSection = $('<div>').addClass('payment-section');

        // Calculate total paid amount
        const totalPaid = order.payments?.reduce((sum, payment) => {
            if (payment.status === 'completed') {
                return sum + payment.amount;
            }
            return sum;
        }, 0) || 0;

        // Payment Summary Card
        const $summaryCard = $('<div>').addClass('card mb-4')
            .append(
                $('<div>').addClass('card-body')
                    .append($('<h5>').addClass('card-title').text('Payment Summary'))
                    .append(
                        $('<div>').addClass('row')
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Total Amount'))
                                    .append($('<h3>').addClass('text-primary').text(this.formatIDR(order.total_amount)))
                            )
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Amount Paid'))
                                    .append($('<h3>').addClass('text-success').text(this.formatIDR(totalPaid)))
                            )
                            .append(
                                $('<div>').addClass('col-md-4')
                                    .append($('<p>').addClass('mb-1 text-muted').text('Balance'))
                                    .append($('<h3>').addClass('text-danger').text(this.formatIDR(Math.max(0, order.total_amount - totalPaid))))
                            )
                    )
            );

        // Payment History Card
        const $historyCard = $('<div>').addClass('card mb-4')
            .append(
                $('<div>').addClass('card-body')
                    .append($('<h5>').addClass('card-title').text('Payment History'))
                    .append(
                        order.payments && order.payments.length > 0 ?
                            this.renderPaymentHistory(order.payments) :
                            $('<div>')
                                .addClass('text-center text-muted py-4')
                                .append($('<i>').addClass('fas fa-receipt fa-3x mb-3'))
                                .append($('<p>').text('No payment transactions found'))
                    )
            );

        // Add cards to payment section
        $paymentSection
            .append($summaryCard)
            .append($historyCard);

        return $paymentSection;
    }

    renderPaymentHistory(payments) {
        const $history = $('<div>').addClass('payment-history');

        payments.forEach(payment => {
            const $paymentItem = $('<div>').addClass('payment-item d-flex align-items-center justify-content-between p-3 border-bottom');

            // Payment method and reference
            $paymentItem.append(
                $('<div>').addClass('payment-info')
                    .append(
                        $('<div>').addClass('d-flex align-items-center mb-1')
                            .append(
                                $('<i>').addClass('fas fa-money-bill text-primary mr-2')
                            )
                            .append(
                                $('<span>').addClass('font-weight-bold')
                                    .text(payment.payment_method.replace(/_/g, ' ').toUpperCase())
                            )
                    )
                    .append(
                        $('<small>').addClass('text-muted d-block')
                            .text(`Ref: ${payment.reference_number}`)
                    )
                    .append(
                        $('<small>').addClass('text-muted d-block')
                            .text(new Date(payment.payment_date).toLocaleString())
                    )
            );

            // Payment amount and status
            $paymentItem.append(
                $('<div>').addClass('payment-details text-right')
                    .append(
                        $('<div>').addClass('font-weight-bold text-success mb-1')
                            .text(this.formatIDR(payment.amount))
                    )
                    .append(
                        $('<span>')
                            .addClass(`badge badge-${payment.status === 'completed' ? 'success' : 'warning'}`)
                            .text(payment.status.toUpperCase())
                    )
            );

            // Add notes if exists
            if (payment.notes) {
                $paymentItem.append(
                    $('<div>').addClass('payment-notes mt-2 small text-muted')
                        .append($('<i>').addClass('fas fa-sticky-note mr-1'))
                        .append(payment.notes)
                );
            }

            $history.append($paymentItem);
        });

        return $history;
    }

    updateTabContent(tabId, order) {
        // Clear previous content
        this.orderPage.clearOrderDetails();
        
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
        
        const customer = order.customer || {};
        
        // Update customer information
        $('#customerName').text(customer.name || 'N/A');
        $('#customerEmail').text(customer.email || 'N/A');
        $('#customerPhone').text(customer.phone || 'N/A');
        $('#customerNumber').text(customer.customer_number || 'N/A');
        $('#customerStatus').html(`
            <span class="badge badge-${customer.status === 'active' ? 'success' : 'danger'}">
                ${customer.status?.toUpperCase() || 'N/A'}
            </span>
        `);
        $('#customerAddress').text(customer.address || 'N/A');
        $('#customerCity').text(customer.city || 'N/A');
        $('#officeId').text(order.office_id || 'N/A');
        $('#expectedDelivery').text(order.expected_delivery_date ? 
            new Date(order.expected_delivery_date).toLocaleDateString() : 'N/A');

        // Update order information
        $('#orderNumber').text(order.order_number || 'N/A');
        $('#createdDate').text(order.created_at ? 
            new Date(order.created_at).toLocaleDateString() : 'N/A');
        $('#updatedDate').text(order.updated_at ? 
            new Date(order.updated_at).toLocaleDateString() : 'N/A');

        // Update payment information
        $('#subtotal').text(this.orderPage.formatIDR(order.subtotal || 0));
        $('#discount').text(`-${this.orderPage.formatIDR(order.discount_amount || 0)}`);
        $('#totalAmount').text(this.orderPage.formatIDR(order.total_amount || 0));

        // Update order label
        $('#orderLabel').text(order.label || '');
    }

    updateItemsTab(order) {
        if (!order || !order.order_items) return;
        
        const $itemsGrid = $('#orderItemsGrid');
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
                        
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('font-weight-bold')
                                    .text(productDetail.name)
                            )
                            .append(
                                $('<div>')
                                    .text(`${item.size} - ${item.color}`)
                            )
                            .append(
                                customization.name ?
                                    $('<div>')
                                        .addClass('text-muted')
                                        .text(`${customization.name} #${customization.number}`) :
                                    null
                            )
                            .appendTo(container);
                    }
                },
                'quantity',
                {
                    dataField: 'unit_price',
                    caption: 'Unit Price',
                    format: 'currency'
                },
                {
                    dataField: 'final_subtotal',
                    caption: 'Total',
                    format: 'currency'
                }
            ]
        });
    }

    updateProductionTab(order) {
        if (!order) return;
        const $timeline = $('.production-timeline');
        $timeline.empty();
        this.orderPage.orderTimeline.render($timeline, order);
    }

    updatePaymentTab(order) {
        if (!order) return;
        const $paymentHistory = $('.payment-history');
        $paymentHistory.empty();

        // Create payment history container
        const $container = $('<div>').addClass('payment-history-container');

        // Add payment summary
        const $summary = this.createPaymentSummary(order);
        
        // Add payment transactions
        const $transactions = this.createPaymentTransactions(order);

        // Append all elements
        $container.append($summary).append($transactions);
        $paymentHistory.append($container);
    }

    createPaymentSummary(order) {
        return $('<div>').addClass('payment-summary card mb-4')
            .append(
                $('<div>').addClass('card-body')
                    .append($('<h5>').addClass('card-title').text('Payment Summary'))
                    .append(
                        $('<div>').addClass('row')
                            .append(this.createSummaryColumn('Total Amount', order.total_amount, 'text-primary'))
                            .append(this.createSummaryColumn('Amount Paid', order.total_amount - (order.balance || 0), 'text-success'))
                            .append(this.createSummaryColumn('Balance', order.balance || 0, 'text-danger'))
                    )
            );
    }

    createSummaryColumn(label, amount, colorClass) {
        return $('<div>').addClass('col-md-4')
            .append($('<p>').addClass('mb-1 text-muted').text(label))
            .append($('<h3>').addClass(colorClass).text(`$${amount.toFixed(2)}`));
    }

    createPaymentTransactions(order) {
        const $transactions = $('<div>').addClass('payment-transactions card');
        const $transactionsBody = $('<div>').addClass('card-body')
            .append($('<h5>').addClass('card-title').text('Payment Transactions'));
        
        if (order.payments && order.payments.length > 0) {
            const $list = $('<div>').addClass('transaction-list');
            order.payments.forEach(payment => {
                $list.append(this.createPaymentItem(payment));
            });
            $transactionsBody.append($list);
        } else {
            $transactionsBody.append(
                $('<div>').addClass('text-center text-muted py-4')
                    .append($('<i>').addClass('fas fa-receipt fa-3x mb-3'))
                    .append($('<p>').text('No payment transactions found'))
            );
        }

        return $transactions.append($transactionsBody);
    }

    createPaymentItem(payment) {
        return $('<div>').addClass('payment-item')
            .append(
                $('<div>').addClass('payment-icon')
                    .append($('<i>').addClass('fas fa-credit-card'))
            )
            .append(
                $('<div>').addClass('payment-details')
                    .append($('<div>').addClass('font-weight-bold').text(payment.payment_method || 'N/A'))
                    .append($('<small>').addClass('text-muted').text(payment.payment_date ? 
                        new Date(payment.payment_date).toLocaleString() : 'N/A'))
            )
            .append(
                $('<div>').addClass('payment-amount')
                    .text(`$${(payment.amount || 0).toFixed(2)}`)
            );
    }
} 