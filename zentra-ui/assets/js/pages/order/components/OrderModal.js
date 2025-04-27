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
        
        // Bind event handlers
        this.bindEvents();
    }

    bindEvents() {
        // Add item button handler
        $('#addItemBtn').on('click', () => {
            const productId = Number($('#productSelect').val());
            const quantity = Number($('#itemQuantity').val());
            const size = $('#itemSize').val();
            const color = $('#itemColor').val();
            
            if (!productId || !quantity || !size || !color) {
                gridUtils.showError('Please fill in all item details');
                return;
            }
            
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            const unitPrice = product.price || 0;
            console.log('Product:', product); // Add debug logging
            console.log('Unit Price:', unitPrice); // Add debug logging

            const item = {
                ProductID: productId,
                Quantity: quantity,
                Size: size,
                Color: color,
                UnitPrice: unitPrice,
                ProductName: product.name,
                ImageUrl: product.image_url,
                Total: quantity * unitPrice // Add total calculation
            };

            this.orderItems.push(item);
            this.renderOrderItemsTable();
            this.updateOrderSummary();
            
            // Reset form
            $('#itemQuantity').val('1');
            $('#itemSize').val('');
            $('#itemColor').val('');
            $('#productSelect').val('');
            this.updateProductPreview();
        });

        // Product select change handler
        $('#productSelect').on('change', (e) => {
            const productId = Number($(e.target).val());
            this.selectedProduct = this.products.find(p => p.id === productId);
            this.updateProductPreview();
        });

        // Quantity change handler
        $('#itemQuantity').on('change', (e) => {
            const quantity = Number($(e.target).val());
            if (quantity < 1) {
                $(e.target).val(1);
            }
        });

        // Calculate total handlers
        $('#input-discount').on('input', () => this.updateOrderSummary());
    }

    showCreateOrderModal() {
        // Reset form
        $('#createOrderForm')[0].reset();
        
        // Load offices for dropdown
        this.loadOffices('#input-office');
        
        // Load products for dropdown
        this.loadProducts();
        
        // Show modal with larger size
        $('#createOrderModal').modal({
            backdrop: 'static',
            keyboard: false
        });
        
        // Reset items
        this.orderItems = [];
        this.renderOrderItemsTable();
        this.updateOrderSummary();
    }

    addModalStyles() {
        const styles = `
            .order-modal .modal-dialog {
                max-width: 1200px;
            }
            .order-modal .modal-content {
                border-radius: 1rem;
                box-shadow: 0 0 30px rgba(0,0,0,0.1);
            }
            .order-modal .modal-header {
                background: #f8f9fc;
                border-bottom: 1px solid #e9ecef;
                padding: 1.5rem;
            }
            .order-modal .modal-body {
                padding: 2rem;
            }
            .order-modal .modal-footer {
                background: #f8f9fc;
                border-top: 1px solid #e9ecef;
                padding: 1.5rem;
            }
            .product-preview {
                width: 120px;
                height: 120px;
                object-fit: cover;
                border-radius: 0.5rem;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                margin-bottom: 1rem;
            }
            .item-details-form {
                background: #f8f9fc;
                padding: 1.5rem;
                border-radius: 0.75rem;
                margin-bottom: 1.5rem;
            }
            .order-items-table {
                margin-top: 1.5rem;
            }
            .order-items-table th {
                background: #f8f9fc;
            }
            .order-items-table img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 0.375rem;
            }
            .order-summary {
                background: #f8f9fc;
                padding: 1.5rem;
                border-radius: 0.75rem;
                margin-top: 1.5rem;
            }
            .order-summary-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e9ecef;
            }
            .order-summary-row:last-child {
                border-bottom: none;
                font-weight: bold;
            }
        `;

        if (!document.querySelector('style[data-order-modal-styles]')) {
            const styleElement = document.createElement('style');
            styleElement.setAttribute('data-order-modal-styles', '');
            styleElement.textContent = styles;
            document.head.appendChild(styleElement);
        }
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
            const response = await productAPI.getProducts();
            this.products = response.map(product => ({
                ...product,
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                colors: ['Red', 'Blue', 'Green', 'Black', 'White'],
                price: product.base_price || 0 // Use base_price from API
            }));
            
            const $select = $('#productSelect');
            $select.empty();
            $select.append('<option value="">Select Product</option>');
            
            this.products.forEach(p => {
                $select.append(`<option value="${p.id}" data-price="${p.price}">${p.name} - $${p.price.toFixed(2)}</option>`);
            });
        } catch (error) {
            console.error('Failed to load products:', error);
            gridUtils.handleGridError(error, 'loading products');
        }
    }

    updateProductPreview() {
        const $sizeSelect = $('#itemSize');
        const $colorSelect = $('#itemColor');
        
        if (this.selectedProduct) {
            // Update available sizes
            $sizeSelect.empty();
            $sizeSelect.append('<option value="">Select Size</option>');
            if (this.selectedProduct.sizes && Array.isArray(this.selectedProduct.sizes)) {
                this.selectedProduct.sizes.forEach(size => {
                    $sizeSelect.append(`<option value="${size}">${size}</option>`);
                });
            }
            
            // Update available colors
            $colorSelect.empty();
            $colorSelect.append('<option value="">Select Color</option>');
            if (this.selectedProduct.colors && Array.isArray(this.selectedProduct.colors)) {
                this.selectedProduct.colors.forEach(color => {
                    $colorSelect.append(`<option value="${color}">${color}</option>`);
                });
            }
        } else {
            $sizeSelect.empty().append('<option value="">Select Size</option>');
            $colorSelect.empty().append('<option value="">Select Color</option>');
        }
    }

    renderOrderItemsTable() {
        const $tbody = $('#orderItemsTable');
        $tbody.empty();
        
        this.orderItems.forEach((item, idx) => {
            const total = item.Quantity * item.UnitPrice;
            $tbody.append(`
                <tr>
                    <td>
                        <div class="product-info">
                            <div>
                                <div class="product-name">${item.ProductName}</div>
                                <div class="product-details">${item.Size} - ${item.Color}</div>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">${item.Quantity}</td>
                    <td class="text-right">$${item.UnitPrice.toFixed(2)}</td>
                    <td class="text-right">$${total.toFixed(2)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-danger btn-sm btn-remove" data-idx="${idx}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });

        // Remove item handler
        $tbody.find('.btn-remove').on('click', (e) => {
            const idx = $(e.target).closest('button').data('idx');
            this.orderItems.splice(idx, 1);
            this.renderOrderItemsTable();
            this.updateOrderSummary();
        });
    }

    updateOrderSummary() {
        const subtotal = this.orderItems.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
        const discount = parseFloat($('#input-discount').val()) || 0;
        const total = Math.max(0, subtotal - discount);

        // Update hidden form fields
        $('input[name="subtotal"]').val(subtotal);
        $('input[name="discountAmount"]').val(discount);
        $('input[name="totalAmount"]').val(total);

        // Update display values
        $('.subtotal-value').text(`$${subtotal.toFixed(2)}`);
        $('.discount-value').text(`$${discount.toFixed(2)}`);
        $('.total-value').text(`$${total.toFixed(2)}`);
    }

    async createOrder() {
        try {
            // Validate form
            const form = $('#createOrderForm')[0];
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            if (this.orderItems.length === 0) {
                gridUtils.showError('Please add at least one item to the order');
                return;
            }

            // Calculate final totals
            const subtotal = this.orderItems.reduce((sum, item) => sum + (item.Quantity * item.UnitPrice), 0);
            const discount = parseFloat($('#input-discount').val()) || 0;
            const total = Math.max(0, subtotal - discount);
            
            // Get form data
            const formData = new FormData(form);
            
            // Generate order number
            const timestamp = new Date().getTime();
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const orderNumber = `ORD-${timestamp}-${randomNum}`;
            
            // Map to PascalCase keys for backend compatibility
            const orderData = {
                OrderNumber: orderNumber,
                CustomerName: formData.get('customerName'),
                CustomerEmail: formData.get('customerEmail'),
                CustomerPhone: formData.get('customerPhone'),
                DeliveryAddress: formData.get('deliveryAddress'),
                OfficeID: Number(formData.get('officeId')),
                ExpectedDeliveryDate: formData.get('expectedDeliveryDate'),
                Subtotal: subtotal,
                DiscountAmount: discount,
                TotalAmount: total,
                Status: formData.get('status') || 'pending',
                PaymentStatus: formData.get('paymentStatus') || 'unpaid',
                Notes: formData.get('notes'),
                OrderItems: this.orderItems.map(item => ({
                    ...item,
                    Total: item.Quantity * item.UnitPrice
                }))
            };

            console.log('Creating order with data:', orderData); // Add debug logging
            
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