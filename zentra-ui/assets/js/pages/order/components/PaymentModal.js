import { orderAPI } from '../../../api/modules/orders.js';
import { gridUtils } from '../../../utils/gridUtils.js';

export class PaymentModal {
    constructor(orderPage) {
        this.orderPage = orderPage;
        this.currentOrder = null;
        
        // Load modal template
        this.loadModalTemplate();
        
        // Bind event handlers
        this.bindEvents();
    }

    async loadModalTemplate() {
        return new Promise((resolve, reject) => {
            // Check if modal already exists
            if ($('#paymentModal').length) {
                $('#paymentModal').remove();
            }

            // Create modal HTML
            const modalHtml = `
                <div class="modal fade" id="paymentModal" tabindex="-1" role="dialog">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-money-bill mr-2"></i>Process Payment
                                </h5>
                                <button type="button" class="close" data-dismiss="modal">
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <form id="paymentForm">
                                    <input type="hidden" id="payment-order-id" name="orderId">
                                    
                                    <!-- Order Summary -->
                                    <div class="order-summary mb-4">
                                        <h6 class="heading-small text-muted mb-3">Order Summary</h6>
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="row">
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Order Number</small>
                                                        <div class="font-weight-bold" id="payment-order-number"></div>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Customer</small>
                                                        <div class="font-weight-bold" id="payment-customer-name"></div>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Order Date</small>
                                                        <div class="font-weight-bold" id="payment-order-date"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Payment Details -->
                                    <div class="payment-details">
                                        <h6 class="heading-small text-muted mb-3">Payment Details</h6>
                                        <div class="card">
                                            <div class="card-body">
                                                <div class="row mb-4">
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Total Amount</small>
                                                        <div class="h3 text-primary" id="payment-total-amount"></div>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Amount Paid</small>
                                                        <div class="h3 text-success" id="payment-amount-paid"></div>
                                                    </div>
                                                    <div class="col-sm-4">
                                                        <small class="text-muted">Balance</small>
                                                        <div class="h3 text-danger" id="payment-balance"></div>
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <label for="payment-amount">Payment Amount</label>
                                                    <div class="input-group">
                                                        <div class="input-group-prepend">
                                                            <span class="input-group-text">IDR</span>
                                                        </div>
                                                        <input type="number" class="form-control" id="payment-amount" name="amount" required min="0" step="0.01">
                                                    </div>
                                                </div>

                                                <div class="form-group">
                                                    <label for="payment-method">Payment Method</label>
                                                    <select class="form-control" id="payment-method" name="paymentMethod" required>
                                                        <option value="">Select Payment Method</option>
                                                        <option value="cash">Cash</option>
                                                        <option value="bank_transfer">Bank Transfer</option>
                                                        <option value="credit_card">Credit Card</option>
                                                        <option value="debit_card">Debit Card</option>
                                                        <option value="ewallet">E-Wallet</option>
                                                    </select>
                                                </div>

                                                <div class="form-group">
                                                    <label for="payment-reference">Reference Number</label>
                                                    <input type="text" class="form-control" id="payment-reference" name="referenceNumber" placeholder="Enter payment reference number">
                                                </div>

                                                <div class="form-group mb-0">
                                                    <label for="payment-notes">Notes</label>
                                                    <textarea class="form-control" id="payment-notes" name="notes" rows="3" placeholder="Enter any additional notes"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="processPayment">Process Payment</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add modal to body
            $('body').append(modalHtml);
            resolve();
        });
    }

    bindEvents() {
        // Process payment button click
        $('#processPayment').off('click').on('click', () => {
            this.processPayment();
        });

        // Payment amount validation
        $('#payment-amount').off('input').on('input', (e) => {
            const amount = parseFloat(e.target.value);
            const balance = parseFloat($('#payment-balance').text().replace(/[^0-9.-]+/g, ''));
            
            if (amount > balance) {
                e.target.value = balance;
            }
        });
    }

    showPaymentModal(order) {
        this.currentOrder = order;
        
        // Set order ID
        $('#payment-order-id').val(order.id);
        
        // Update order summary
        $('#payment-order-number').text(order.order_number);
        $('#payment-customer-name').text(order.customer?.name || 'N/A');
        $('#payment-order-date').text(new Date(order.created_at).toLocaleDateString());
        
        // Calculate payment amounts
        const totalAmount = order.total_amount;
        const paidAmount = order.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        const balance = totalAmount - paidAmount;
        
        // Update payment details
        $('#payment-total-amount').text(this.orderPage.formatIDR(totalAmount));
        $('#payment-amount-paid').text(this.orderPage.formatIDR(paidAmount));
        $('#payment-balance').text(this.orderPage.formatIDR(balance));
        
        // Set max payment amount
        $('#payment-amount').attr('max', balance).val(balance);
        
        // Show modal
        $('#paymentModal').modal('show');
    }

    async processPayment() {
        try {
            // Validate form
            const form = $('#paymentForm')[0];
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const paymentData = {
                OrderID: this.currentOrder.id,
                Amount: parseFloat(formData.get('amount')),
                PaymentMethod: formData.get('paymentMethod'),
                ReferenceNumber: formData.get('referenceNumber'),
                Notes: formData.get('notes'),
                PaymentDate: new Date().toISOString()
            };

            // Send payment request
            const response = await orderAPI.processPayment(paymentData);
            
            // Close modal and refresh data
            $('#paymentModal').modal('hide');
            await this.orderPage.loadData();
            
            // Show success message
            gridUtils.showSuccess('Payment processed successfully!');
            
            // Refresh order details if open
            if (this.orderPage.currentOrder?.id === this.currentOrder.id) {
                // If order details modal is open, refresh it
                if ($('#orderDetailsModal').is(':visible')) {
                    this.orderPage.showOrderDetails(this.currentOrder);
                }
            }
        } catch (error) {
            console.error('Process payment error:', error);
            gridUtils.handleGridError(error, 'processing payment');
        }
    }
} 