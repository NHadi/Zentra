import { orderAPI } from '../../api/modules/orders.js';
import { gridUtils } from '../../utils/gridUtils.js';
import { getBaseUrl } from '../../api/config.js';
import { officeAPI } from '../../api/modules/offices.js';
import { productAPI } from '../../api/modules/products.js';
import { OrderGrid } from './components/OrderGrid.js';
import { OrderDetails } from './components/OrderDetails.js';
import { OrderTimeline } from './components/OrderTimeline.js';
import { OrderModal } from './components/OrderModal.js';

export class OrderPage {
    constructor() {
        this.grid = null;
        this.orderItemsGrid = null;
        this.currentOrder = null;
        this.orderItems = [];
        
        // Initialize components
        this.orderGrid = new OrderGrid(this);
        this.orderDetails = new OrderDetails(this);
        this.orderTimeline = new OrderTimeline(this);
        this.orderModal = new OrderModal(this);
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();
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

        // Action buttons
        $('#editOrder').on('click', () => this.editOrder());
        $('#updateStatus').on('click', () => this.updateOrderStatus());
        $('#printOrder').on('click', () => this.printOrder());
        $('#cancelOrder').on('click', () => this.cancelOrder());

        // Create order button
        $('#createOrderBtn').on('click', () => {
            this.orderModal.showCreateOrderModal();
        });
        
        // Create order form submission
        $('#saveOrder').on('click', () => {
            this.orderModal.createOrder();
        });
        
        // Edit order form submission
        $('#updateOrder').on('click', () => {
            this.orderModal.updateOrder();
        });
    }

    initialize() {
        // Initialize the grid
        this.orderGrid.initialize();
        // Load initial data
        this.loadData();
        // Update statistics
        this.updateStats();
    }

    async loadData() {
        try {
            // Show loading panel
            this.orderGrid.grid.beginCustomLoading('Loading orders...');
            
            const orders = await orderAPI.getOrders();
            if (Array.isArray(orders)) {
                this.orderGrid.grid.option('dataSource', orders);
                this.updateStats(orders);
            } else {
                console.warn('Invalid data format received:', orders);
                this.orderGrid.grid.option('dataSource', []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            if (gridUtils && gridUtils.handleGridError) {
                gridUtils.handleGridError(error, 'loading orders');
            } else {
                alert('Failed to load orders. Please try again.');
            }
        } finally {
            // Always hide loading panel
            this.orderGrid.grid.endCustomLoading();
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

    showOrderDetails(order) {
        // Store the current order for reference in other methods
        this.currentOrder = order;
        
        // Update the modal title
        $('#orderTitle').text(`Order Details: ${order.order_number}`);
        
        // Update tab content
        this.orderDetails.updateTabContent('orderInfo', order);
        
        // Show the modal
        $('#orderDetailsModal').modal('show');
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
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
                    .invoice-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .invoice-title { font-size: 24px; color: #5e72e4; margin: 0; }
                    .invoice-subtitle { color: #666; margin: 5px 0; }
                    .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .company-info, .customer-info { flex: 1; }
                    .info-title { font-weight: bold; margin-bottom: 10px; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    .items-table th { background-color: #f8f9fc; }
                    .total-section { text-align: right; margin-top: 20px; }
                    .total-row { margin: 5px 0; }
                    .total-label { display: inline-block; width: 150px; font-weight: bold; }
                    .total-value { display: inline-block; width: 100px; }
                    .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
                    @media print { body { padding: 0; } .no-print { display: none; } }
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
}

// Initialize only if DevExtreme is loaded
if (typeof DevExpress !== 'undefined' && !window.orderPageInstance) {
    window.orderPageInstance = new OrderPage();
} 