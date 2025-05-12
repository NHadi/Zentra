import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define PaymentPage
window.PaymentPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.showPending = false;
        this.payments = [];
        this.currentPayment = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Payment Status Badges */
            .payment-status {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .payment-status.completed {
                background-color: rgba(45, 206, 137, 0.1);
                color: #2dce89;
            }

            .payment-status.pending {
                background-color: rgba(251, 99, 64, 0.1);
                color: #fb6340;
            }

            .payment-status.failed {
                background-color: rgba(245, 54, 92, 0.1);
                color: #f5365c;
            }

            /* Payment Method Badge */
            .payment-method {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
                background-color: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
            }

            .payment-method i {
                margin-right: 0.5rem;
            }

            /* Reference Number */
            .reference-number {
                display: inline-flex;
                align-items: center;
                font-weight: 600;
                color: #5e72e4;
            }

            .reference-number i {
                margin-right: 0.5rem;
            }

            /* Amount Display */
            .amount-display {
                font-weight: 600;
                color: #2dce89;
            }

            .amount-display.negative {
                color: #f5365c;
            }

            /* Payment Details Modal */
            .payment-details-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 2rem;
                border-radius: 0.375rem;
                margin-bottom: 2rem;
            }

            .payment-details-header h3 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 600;
            }

            .payment-info-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
                margin-bottom: 2rem;
            }

            .payment-info-card .card-header {
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid #e9ecef;
                background: transparent;
            }

            .payment-info-card .card-header h5 {
                margin: 0;
                font-size: 1rem;
                font-weight: 600;
                color: #32325d;
            }

            .payment-info-card .card-body {
                padding: 1.5rem;
            }

            .info-group {
                margin-bottom: 1.5rem;
            }

            .info-group:last-child {
                margin-bottom: 0;
            }

            .info-label {
                font-size: 0.875rem;
                color: #8898aa;
                margin-bottom: 0.5rem;
            }

            .info-value {
                font-size: 0.875rem;
                color: #32325d;
                font-weight: 600;
            }

            /* Timeline Styles */
            .payment-timeline {
                position: relative;
                padding-left: 2rem;
            }

            .timeline-item {
                position: relative;
                padding-bottom: 1.5rem;
                padding-left: 1.5rem;
            }

            .timeline-item:before {
                content: '';
                position: absolute;
                left: -2px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #e9ecef;
            }

            .timeline-item:last-child {
                padding-bottom: 0;
            }

            .timeline-item:last-child:before {
                display: none;
            }

            .timeline-point {
                position: absolute;
                left: -8px;
                top: 0;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                border: 2px solid #5e72e4;
                background: white;
            }

            .timeline-content {
                background: white;
                border-radius: 0.375rem;
                padding: 1rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
            }

            .timeline-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #32325d;
                margin-bottom: 0.5rem;
            }

            .timeline-info {
                font-size: 0.875rem;
                color: #8898aa;
            }

            /* Transaction History */
            .transaction-item {
                display: flex;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
            }

            .transaction-item:last-child {
                border-bottom: none;
            }

            .transaction-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(94, 114, 228, 0.1);
                color: #5e72e4;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
            }

            .transaction-details {
                flex: 1;
            }

            .transaction-amount {
                font-weight: 600;
                color: #2dce89;
            }

            .transaction-amount.refund {
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
        $('#btnShowPending').off('click');
        $('#btnGroupByStatus').off('click');
        $('#paymentDetailsModal').off('show.bs.modal');
        $('#paymentDetailsModal').off('hide.bs.modal');
        $('#printReceipt').off('click');
        $('#updateStatus').off('click');
        $('#voidPayment').off('click');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        $('#btnShowPending').on('click', () => {
            this.showPending = !this.showPending;
            this.updateGridData();
            $('#btnShowPending i').toggleClass('fa-clock fa-history');
        });

        $('#btnGroupByStatus').on('click', () => {
            const groupPanel = this.grid.option('groupPanel');
            if (groupPanel.visible) {
                this.grid.clearGrouping();
            }
            this.grid.option('groupPanel.visible', !groupPanel.visible);
        });

        // Modal events
        $('#paymentDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const paymentId = button.data('payment-id');
            if (paymentId) {
                this.loadPaymentDetails(paymentId);
            }
        });

        $('#paymentDetailsModal').on('hide.bs.modal', () => {
            this.currentPayment = null;
            this.clearPaymentDetails();
        });

        // Action buttons
        $('#printReceipt').on('click', () => {
            if (this.currentPayment) {
                this.printReceipt(this.currentPayment);
            }
        });

        $('#updateStatus').on('click', () => {
            if (this.currentPayment) {
                this.updatePaymentStatus(this.currentPayment);
            }
        });

        $('#voidPayment').on('click', () => {
            if (this.currentPayment) {
                this.voidPayment(this.currentPayment);
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
        const gridElement = $('#paymentGrid');
        if (!gridElement.length) {
            console.error('Payment grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#paymentGrid').dxDataGrid({
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
                    dataField: 'reference_number',
                    caption: 'Payment Info',
                    cellTemplate: (container, options) => {
                        const payment = options.data;
                        $('<div>')
                            .addClass('d-flex flex-column')
                            .append(
                                $('<div>')
                                    .addClass('reference-number')
                                    .append($('<i>').addClass('ni ni-tag'))
                                    .append(payment.reference_number)
                            )
                            .append(
                                $('<small>')
                                    .addClass('text-muted')
                                    .text(new Date(payment.payment_date).toLocaleDateString())
                            )
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'payment_method',
                    caption: 'Method',
                    cellTemplate: (container, options) => {
                        const methodIcons = {
                            'bank_transfer': 'ni ni-building',
                            'credit_card': 'ni ni-credit-card',
                            'cash': 'ni ni-money-coins',
                            'digital_wallet': 'ni ni-mobile-button'
                        };
                        const icon = methodIcons[options.value] || 'ni ni-money-coins';
                        const displayText = options.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        $('<div>')
                            .addClass('payment-method')
                            .append($('<i>').addClass(icon))
                            .append(displayText)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'amount',
                    caption: 'Amount',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('amount-display')
                            .text(this.formatIDR(options.value))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        const statusIcons = {
                            'completed': 'fas fa-check',
                            'pending': 'fas fa-clock',
                            'failed': 'fas fa-times'
                        };
                        
                        $('<div>')
                            .addClass(`payment-status ${options.value}`)
                            .append($('<i>').addClass(statusIcons[options.value] + ' mr-1'))
                            .append(options.value.charAt(0).toUpperCase() + options.value.slice(1))
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
                            this.showPaymentDetails(e.row.data);
                        }
                    }, {
                        hint: 'Print Receipt',
                        icon: 'fas fa-print',
                        onClick: (e) => {
                            this.printReceipt(e.row.data);
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
                    this.renderPaymentDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Payment_List');
                    this.exportButtonsAdded = true;
                }
                this.updateStats();
            }
        }).dxDataGrid('instance');
    }

    renderPaymentDetails(container, payment) {
        const $detailContent = $('<div>').addClass('payment-detail-container p-4');

        // Payment Information Section
        const $paymentInfo = $('<div>')
            .addClass('payment-info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Payment Information'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(this.createInfoGroup('Reference Number', payment.reference_number))
                    .append(this.createInfoGroup('Payment Method', this.formatPaymentMethod(payment.payment_method)))
                    .append(this.createInfoGroup('Amount', this.formatIDR(payment.amount)))
                    .append(this.createInfoGroup('Status', this.formatStatus(payment.status)))
                    .append(this.createInfoGroup('Payment Date', new Date(payment.payment_date).toLocaleString()))
            );

        // Transaction Timeline
        const $timeline = $('<div>')
            .addClass('payment-info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Transaction Timeline'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(this.createTimeline(payment))
            );

        // Notes Section (if available)
        if (payment.notes) {
            const $notes = $('<div>')
                .addClass('payment-info-card')
                .append(
                    $('<div>')
                        .addClass('card-header')
                        .append($('<h5>').text('Notes'))
                )
                .append(
                    $('<div>')
                        .addClass('card-body')
                        .append($('<p>').addClass('mb-0').text(payment.notes))
                );
            $detailContent.append($notes);
        }

        $detailContent.append($paymentInfo).append($timeline);
        container.append($detailContent);
    }

    createInfoGroup(label, value) {
        return $('<div>')
            .addClass('info-group')
            .append($('<div>').addClass('info-label').text(label))
            .append($('<div>').addClass('info-value').html(value));
    }

    createTimeline(payment) {
        const $timeline = $('<div>').addClass('payment-timeline');

        // Created
        $timeline.append(this.createTimelineItem(
            'Payment Created',
            `Payment initiated via ${this.formatPaymentMethod(payment.payment_method)}`,
            payment.created_at
        ));

        // Processing
        $timeline.append(this.createTimelineItem(
            'Processing',
            'Payment is being processed',
            payment.payment_date
        ));

        // Completed/Failed
        if (payment.status === 'completed') {
            $timeline.append(this.createTimelineItem(
                'Payment Completed',
                `Successfully processed payment of ${this.formatIDR(payment.amount)}`,
                payment.updated_at
            ));
        } else if (payment.status === 'failed') {
            $timeline.append(this.createTimelineItem(
                'Payment Failed',
                'Transaction could not be completed',
                payment.updated_at
            ));
        }

        return $timeline;
    }

    createTimelineItem(title, info, date) {
        return $('<div>')
            .addClass('timeline-item')
            .append($('<div>').addClass('timeline-point'))
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

    formatPaymentMethod(method) {
        const methodIcons = {
            'bank_transfer': 'ni ni-building mr-2',
            'credit_card': 'ni ni-credit-card mr-2',
            'cash': 'ni ni-money-coins mr-2',
            'digital_wallet': 'ni ni-mobile-button mr-2'
        };
        const icon = methodIcons[method] || 'ni ni-money-coins mr-2';
        const displayText = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        return `<i class="${icon}"></i>${displayText}`;
    }

    formatStatus(status) {
        const statusIcons = {
            'completed': 'fas fa-check',
            'pending': 'fas fa-clock',
            'failed': 'fas fa-times'
        };
        const icon = statusIcons[status] || 'fas fa-question';
        return `<div class="payment-status ${status}"><i class="${icon} mr-1"></i>${status.charAt(0).toUpperCase() + status.slice(1)}</div>`;
    }

    updateStats() {
        const payments = this.grid.getDataSource().items();
        const totalPayments = payments.length;
        const completedPayments = payments.filter(p => p.status === 'completed').length;
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        $('#totalPayments').text(totalPayments);
        $('#completedPayments').text(completedPayments);
        $('#pendingPayments').text(pendingPayments);
        $('#totalAmount').text(this.formatIDR(totalAmount));
    }

    updateGridData() {
        const filteredData = this.showPending ? 
            this.payments.filter(payment => payment.status === 'pending') : 
            this.payments;
        this.grid.option('dataSource', filteredData);
    }

    async loadData() {
        try {
            this.payments = await zentra.getPayments();
            this.updateGridData();
        } catch (error) {
            console.error('Error loading payments:', error);
            DevExpress.ui.notify('Failed to load payments', 'error', 3000);
        }
    }

    showPaymentDetails(payment) {
        this.currentPayment = payment;
        $('#paymentDetailsModal').modal('show');
        this.updatePaymentDetails(payment);
    }

    updatePaymentDetails(payment) {
        // Update payment info
        $('#referenceNumber').text(payment.reference_number);
        $('#paymentMethod').html(this.formatPaymentMethod(payment.payment_method));
        $('#paymentDate').text(new Date(payment.payment_date).toLocaleString());
        $('#paymentAmount').text(this.formatIDR(payment.amount));
        $('#paymentNotes').text(payment.notes || 'No notes available');
        
        // Update status badge
        const statusBadge = $('#paymentStatus');
        statusBadge.find('.status').text(payment.status.charAt(0).toUpperCase() + payment.status.slice(1));
        statusBadge.find('i').removeClass().addClass(`bg-${this.getStatusColor(payment.status)}`);

        // Update timeline
        this.updateTimeline(payment);

        // Update transaction summary
        this.updateTransactionSummary(payment);

        // Update order info if available
        if (payment.order) {
            this.updateOrderInfo(payment.order);
        }
    }

    updateTimeline(payment) {
        const $timeline = $('.payment-timeline');
        $timeline.empty();

        const timeline = this.createTimeline(payment);
        $timeline.append(timeline);
    }

    updateTransactionSummary(payment) {
        const $summary = $('.transaction-summary');
        $summary.empty();

        const $transaction = $('<div>')
            .addClass('transaction-item')
            .append(
                $('<div>')
                    .addClass('transaction-icon')
                    .append($('<i>').addClass(this.getPaymentMethodIcon(payment.payment_method)))
            )
            .append(
                $('<div>')
                    .addClass('transaction-details')
                    .append($('<div>').addClass('font-weight-bold').html(this.formatPaymentMethod(payment.payment_method)))
                    .append($('<small>').addClass('text-muted').text(new Date(payment.payment_date).toLocaleString()))
            )
            .append(
                $('<div>')
                    .addClass('transaction-amount')
                    .text(this.formatIDR(payment.amount))
            );

        $summary.append($transaction);
    }

    updateOrderInfo(order) {
        const $orderInfo = $('.order-info');
        $orderInfo.empty();

        const $orderDetails = $('<div>')
            .addClass('card shadow-none border')
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<h6>').addClass('heading-small text-muted mb-4').text('Order Information')
                    )
                    .append(
                        $('<div>')
                            .addClass('pl-lg-4')
                            .append(this.createInfoGroup('Order Number', order.order_number))
                            .append(this.createInfoGroup('Customer', order.customer_name))
                            .append(this.createInfoGroup('Total Amount', this.formatIDR(order.total_amount)))
                            .append(this.createInfoGroup('Status', this.formatOrderStatus(order.status)))
                    )
            );

        $orderInfo.append($orderDetails);
    }

    getStatusColor(status) {
        const colors = {
            'completed': 'success',
            'pending': 'warning',
            'failed': 'danger'
        };
        return colors[status] || 'secondary';
    }

    getPaymentMethodIcon(method) {
        const icons = {
            'bank_transfer': 'ni ni-building mr-2',
            'credit_card': 'ni ni-credit-card mr-2',
            'cash': 'ni ni-money-coins mr-2',
            'digital_wallet': 'ni ni-mobile-button mr-2'
        };
        return icons[method] || 'ni ni-money-coins mr-2';
    }

    formatOrderStatus(status) {
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    clearPaymentDetails() {
        // Clear all dynamic content
        $('#referenceNumber').text('');
        $('#paymentMethod').html('');
        $('#paymentDate').text('');
        $('#paymentAmount').text('');
        $('#paymentNotes').text('');
        $('.payment-timeline').empty();
        $('.transaction-summary').empty();
        $('.order-info').empty();
    }

    switchTab(tab) {
        $('.nav-tabs .nav-link').removeClass('active');
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $('.tab-pane').removeClass('show active');
        $(`#${tab}`).addClass('show active');
    }

    async updatePaymentStatus(payment) {
        // Implement status update functionality
        console.log('Update status for payment:', payment);
    }

    async voidPayment(payment) {
        // Implement void payment functionality
        console.log('Void payment:', payment);
    }

    printReceipt(payment) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Create the receipt HTML
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payment Receipt - ${payment.reference_number}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 20px;
                    }
                    .receipt-title {
                        font-size: 24px;
                        color: #5e72e4;
                        margin: 0;
                    }
                    .receipt-subtitle {
                        color: #666;
                        margin: 5px 0;
                    }
                    .receipt-details {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .company-info {
                        flex: 1;
                    }
                    .info-title {
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .payment-info {
                        background: #f8f9fc;
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 30px;
                    }
                    .payment-row {
                        display: flex;
                        margin-bottom: 10px;
                    }
                    .payment-label {
                        width: 150px;
                        font-weight: bold;
                        color: #8898aa;
                    }
                    .payment-value {
                        flex: 1;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    .status-completed {
                        background: rgba(45, 206, 137, 0.1);
                        color: #2dce89;
                    }
                    .status-pending {
                        background: rgba(251, 99, 64, 0.1);
                        color: #fb6340;
                    }
                    .status-failed {
                        background: rgba(245, 54, 92, 0.1);
                        color: #f5365c;
                    }
                    .timeline {
                        margin-top: 30px;
                    }
                    .timeline-item {
                        position: relative;
                        padding-left: 30px;
                        margin-bottom: 20px;
                    }
                    .timeline-item:before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        bottom: -20px;
                        width: 2px;
                        background: #e9ecef;
                    }
                    .timeline-item:last-child:before {
                        display: none;
                    }
                    .timeline-point {
                        position: absolute;
                        left: -5px;
                        top: 0;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        background: #5e72e4;
                        border: 2px solid white;
                    }
                    .timeline-content {
                        background: white;
                        border-radius: 6px;
                        padding: 15px;
                        box-shadow: 0 2px 4px rgba(50, 50, 93, 0.1);
                    }
                    .timeline-title {
                        font-weight: 600;
                        margin-bottom: 5px;
                    }
                    .timeline-date {
                        font-size: 12px;
                        color: #8898aa;
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
                <div class="receipt-header">
                    <h1 class="receipt-title">PAYMENT RECEIPT</h1>
                    <p class="receipt-subtitle">Reference #${payment.reference_number}</p>
                    <p class="receipt-subtitle">Date: ${new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>

                <div class="receipt-details">
                    <div class="company-info">
                        <div class="info-title">From:</div>
                        <div>zentra</div>
                        <div>123 Business Street</div>
                        <div>City, State, ZIP</div>
                        <div>Phone: (123) 456-7890</div>
                        <div>Email: info@zentra.com</div>
                    </div>
                </div>

                <div class="payment-info">
                    <div class="payment-row">
                        <div class="payment-label">Order ID:</div>
                        <div class="payment-value">${payment.order_id}</div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Payment Method:</div>
                        <div class="payment-value">
                            <i class="fas ${this.getPaymentMethodIcon(payment.payment_method)}"></i>
                            ${this.formatPaymentMethod(payment.payment_method)}
                        </div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Amount:</div>
                        <div class="payment-value">
                            <span style="font-size: 18px; font-weight: bold; color: #2dce89;">
                                ${this.formatIDR(payment.amount)}
                            </span>
                        </div>
                    </div>
                    <div class="payment-row">
                        <div class="payment-label">Status:</div>
                        <div class="payment-value">
                            <span class="status-badge status-${payment.status}">
                                ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                        </div>
                    </div>
                    ${payment.notes ? `
                        <div class="payment-row">
                            <div class="payment-label">Notes:</div>
                            <div class="payment-value">${payment.notes}</div>
                        </div>
                    ` : ''}
                </div>

                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-point"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Payment Created</div>
                            <div class="timeline-date">${new Date(payment.created_at).toLocaleString()}</div>
                            <div class="timeline-date">Created by: ${payment.created_by}</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-point"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Payment Processed</div>
                            <div class="timeline-date">${new Date(payment.payment_date).toLocaleString()}</div>
                        </div>
                    </div>
                    ${payment.status === 'completed' ? `
                        <div class="timeline-item">
                            <div class="timeline-point"></div>
                            <div class="timeline-content">
                                <div class="timeline-title">Payment Completed</div>
                                <div class="timeline-date">${new Date(payment.updated_at).toLocaleString()}</div>
                                <div class="timeline-date">Updated by: ${payment.updated_by}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="footer">
                    <p>Thank you for your payment!</p>
                    <p>This is a computer-generated receipt. No signature is required.</p>
                </div>

                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #5e72e4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print Receipt
                    </button>
                </div>
            </body>
            </html>
        `;

        // Write the HTML to the new window
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.paymentPageInstance) {
    window.paymentPageInstance = new window.PaymentPage();
} 