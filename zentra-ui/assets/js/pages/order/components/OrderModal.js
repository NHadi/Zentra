import { orderAPI } from '../../../api/modules/orders.js';
import { officeAPI } from '../../../api/modules/offices.js';
import { productAPI } from '../../../api/modules/products.js';
import { gridUtils } from '../../../utils/gridUtils.js';

export class OrderModal {
    constructor(orderPage) {
        this.orderPage = orderPage;
        this.orderItems = [];
        this.products = [];
        this.selectedProduct = null;
    }

    showCreateOrderModal() {
        // Reset form
        $('#createOrderForm')[0].reset();
        
        // Load offices for dropdown
        this.loadOffices('#input-office');
        
        // Load products for dropdown
        this.loadProducts();
        
        // Show modal
        $('#createOrderModal').modal('show');
        
        // Reset items
        this.orderItems = [];
        this.renderOrderItemsTable();
    }

    showEditOrderModal() {
        const currentOrder = this.orderPage.currentOrder;
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

    calculateTotal(e) {
        const formPrefix = $(e.target).attr('id').startsWith('edit-') ? 'edit-' : 'input-';
        const subtotal = parseFloat($(`#${formPrefix}subtotal`).val()) || 0;
        const discount = parseFloat($(`#${formPrefix}discount`).val()) || 0;
        const total = Math.max(0, subtotal - discount).toFixed(2);
        $(`#${formPrefix}total`).val(total);
    }

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
            await this.orderPage.loadData();
            
            // Show success message
            gridUtils.showSuccess('Order created successfully!');
        } catch (error) {
            console.error('Create order error:', error);
            gridUtils.handleGridError(error, 'creating order');
        }
    }

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
            await this.orderPage.loadData();
            
            // Show success message
            gridUtils.showSuccess('Order updated successfully!');
        } catch (error) {
            console.error('Update order error:', error);
            gridUtils.handleGridError(error, 'updating order');
        }
    }
} 