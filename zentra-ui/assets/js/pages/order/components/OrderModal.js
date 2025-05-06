import { orderAPI } from '../../../api/modules/orders.js';
import { officeAPI } from '../../../api/modules/offices.js';
import { productAPI } from '../../../api/modules/products.js';
import { customerAPI } from '../../../api/modules/customers.js';
import { gridUtils } from '../../../utils/gridUtils.js';
import { getBaseUrl } from '../../../api/config.js';
import { getAuthHeaders } from '../../../api/utils/headers.js';

export class OrderModal {
    constructor(orderPage) {
        this.orderPage = orderPage;
        this.orderItems = [];
        this.products = [];
        this.selectedProduct = null;
        this.selectedCustomer = null;
        this.customerLookup = null;
        
        // Load modal template
        this.loadModalTemplate();
        
        // Bind event handlers
        this.bindEvents();
    }

    async loadModalTemplate() {
        return new Promise((resolve, reject) => {
            // Check if modal already exists
            if ($('#createOrderModal').length) {
                // Remove existing modal to ensure clean state
                $('#createOrderModal').remove();
                $('#newCustomerModal').remove();
            }

            // Load the modal template
            $.get('assets/js/pages/order/templates/createOrderModal.html')
                .done(template => {
                    $('body').append(template);
                    resolve();
                })
                .fail(error => {
                    console.error('Failed to load modal template:', error);
                    reject(error);
                });
        });
    }

    bindEvents() {
        // Remove existing event handlers first
        $('#addItemBtn').off('click');
        $('#productSelect').off('change');
        $('#itemQuantity').off('change');
        $('#input-discount').off('input');
        $('#addNewCustomerBtn').off('click');
        $('#customerForm').off('submit');
        $('#saveOrder').off('click');

        // Add save button handler
        $('#saveOrder').on('click', () => {
            this.createOrder();
        });

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

            const item = {
                ProductID: productId,
                Quantity: quantity,
                Size: size,
                Color: color,
                UnitPrice: unitPrice,
                ProductName: product.name,
                ImageUrl: product.image_url,
                Total: quantity * unitPrice
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

        // Add new customer button handler
        $('#addNewCustomerBtn').on('click', () => {
            this.showNewCustomerForm();
        });

        // Customer form submission
        $('#customerForm').on('submit', async (e) => {
            e.preventDefault();
            await this.handleCustomerSubmit();
        });
    }

    async showCreateOrderModal() {
        try {
            // Ensure modal template is loaded
            await this.loadModalTemplate();
            
            // Reset form
            $('#createOrderForm')[0].reset();
            
            // Show modal first
            $('#createOrderModal').modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });

            // Wait for modal to be shown and content to be ready
            await new Promise(resolve => {
                $('#createOrderModal').on('shown.bs.modal', () => {
                    setTimeout(resolve, 100); // Give a small delay for DOM to be ready
                });
            });
            
            // Now initialize components
            await this.initializeCustomerLookup();
            await this.loadOffices('#input-office');
            await this.loadProducts();
            
            // Reset customer selection
            if (this.customerLookup) {
                this.customerLookup.option('value', null);
            }
            
            this.selectedCustomer = null;
            this.updateCustomerDetails();
            
            // Reset items
            this.orderItems = [];
            this.renderOrderItemsTable();
            this.updateOrderSummary();

            // Add modal styles
            this.addModalStyles();

            // Rebind events after modal is loaded
            this.bindEvents();
        } catch (error) {
            console.error('Error showing create order modal:', error);
            gridUtils.handleGridError(error, 'showing create order modal');
        }
    }

    initializeCustomerLookup() {
        try {
            if (!$('#customerLookup').length) {
                console.error('Customer lookup element not found');
                return;
            }

            // Remove any existing instance
            const existingInstance = $('#customerLookup').data('dxSelectBox');
            if (existingInstance) {
                existingInstance.dispose();
            }

            // Create new instance
            const selectBoxInstance = $('#customerLookup').dxSelectBox({
                dataSource: new DevExpress.data.CustomStore({
                    key: 'id',
                    load: async (loadOptions) => {
                        try {
                            const { searchValue, searchExpr, skip, take } = loadOptions;
                            const page = skip ? Math.floor(skip / take) + 1 : 1;
                            const query = searchValue || '';
                            
                            const response = await fetch(
                                `${getBaseUrl()}/api/customers?query=${encodeURIComponent(query)}&page=${page}&per_page=10`,
                                {
                                    headers: {
                                        ...getAuthHeaders(),
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            return {
                                data: result.data || [],
                                totalCount: result.total || 0
                            };
                        } catch (error) {
                            console.error('Error loading customers:', error);
                            return {
                                data: [],
                                totalCount: 0
                            };
                        }
                    }
                }),
                displayExpr: (item) => item ? item.name : '',
                valueExpr: 'id',
                searchEnabled: true,
                searchExpr: ['name', 'email', 'phone', 'customer_number'],
                searchMode: 'contains',
                searchTimeout: 500,
                minSearchLength: 2,
                showClearButton: true,
                placeholder: 'Search customers by name, email, or phone...',
                noDataText: 'No customers found',
                showDataBeforeSearch: false,
                itemTemplate: (item) => {
                    if (!item) return '';
                    return $('<div>').addClass('customer-lookup-item')
                        .append(
                            $('<div>').addClass('customer-name')
                                .append($('<span>').text(item.name))
                                .append($('<span>').addClass('customer-number').text(item.customer_number))
                        )
                        .append(
                            $('<div>').addClass('customer-details')
                                .append(
                                    $('<div>').addClass('detail-item')
                                        .append($('<i>').addClass('fas fa-envelope'))
                                        .append($('<span>').text(item.email))
                                    )
                                    .append(
                                        $('<div>').addClass('detail-item')
                                            .append($('<i>').addClass('fas fa-phone'))
                                            .append($('<span>').text(item.phone || 'No phone'))
                                    )
                                    .append(
                                        $('<div>').addClass('detail-item')
                                            .append($('<i>').addClass('fas fa-map-marker-alt'))
                                            .append($('<span>').text(item.city || 'No city'))
                                    )
                            );
                },
                onValueChanged: (e) => {
                    this.selectedCustomer = e.component.option('selectedItem');
                    this.updateCustomerDetails();
                },
                width: '100%',
                dropDownOptions: {
                    width: 'auto',
                    closeOnOutsideClick: true,
                    shading: false
                }
            }).dxSelectBox('instance');

            this.customerLookup = selectBoxInstance;
        } catch (error) {
            console.error('Error initializing customer lookup:', error);
        }
    }

    updateCustomerDetails() {
        if (this.selectedCustomer) {
            $('#customerDetails').html(`
                <div class="customer-info-card">
                    <div class="card-body">
                        <h6 class="heading-small text-muted mb-4">Selected Customer</h6>
                        <div class="pl-lg-4">
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">Customer Number</label>
                                        <p class="form-control-static">${this.selectedCustomer.customer_number || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">Status</label>
                                        <p class="form-control-static">
                                            <span class="badge badge-${this.selectedCustomer.status === 'active' ? 'success' : 'danger'}">
                                                ${this.selectedCustomer.status?.toUpperCase() || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">Name</label>
                                        <p class="form-control-static">${this.selectedCustomer.name}</p>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">Email</label>
                                        <p class="form-control-static">${this.selectedCustomer.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">Phone</label>
                                        <p class="form-control-static">${this.selectedCustomer.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div class="col-lg-6">
                                    <div class="form-group">
                                        <label class="form-control-label">City</label>
                                        <p class="form-control-static">${this.selectedCustomer.city || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="form-group">
                                        <label class="form-control-label">Address</label>
                                        <p class="form-control-static">${this.selectedCustomer.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            ${this.selectedCustomer.notes ? `
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="form-group">
                                        <label class="form-control-label">Notes</label>
                                        <p class="form-control-static">${this.selectedCustomer.notes}</p>
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `);
        } else {
            $('#customerDetails').empty();
        }
    }

    showNewCustomerForm() {
        // Hide the modal that contains the customer lookup
        $('#createOrderModal').modal('hide');
        
        // Show the new customer modal
        $('#newCustomerModal').modal('show');

        // When new customer modal is hidden, show back the create order modal
        $('#newCustomerModal').on('hidden.bs.modal', () => {
            $('#createOrderModal').modal('show');
        });
    }

    async handleCustomerSubmit() {
        try {
            const formData = new FormData($('#customerForm')[0]);
            const customerData = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone') ? `+${formData.get('phone')}` : '',
                address: formData.get('address'),
                city: formData.get('city'),
                postal_code: formData.get('postal_code'),
                notes: formData.get('notes'),
                status: 'active' // Default status for new customers
            };

            // Validate required fields
            if (!customerData.name || !customerData.email) {
                gridUtils.showError('Name and email are required');
                return;
            }

            // Validate phone number format if provided
            if (customerData.phone && !customerData.phone.match(/^\+\d{10,15}$/)) {
                gridUtils.showError('Invalid phone number format. Please enter 10-15 digits with country code');
                return;
            }

            const newCustomer = await customerAPI.createCustomer(customerData);
            
            // Update the customer lookup with the new customer
            if (this.customerLookup) {
                this.customerLookup.option('value', newCustomer.id);
                this.selectedCustomer = newCustomer;
                this.updateCustomerDetails();
            }
            
            // Close modal and show success message
            $('#newCustomerModal').modal('hide');
            $('#customerForm')[0].reset();
            gridUtils.showSuccess('Customer created successfully!');
            
        } catch (error) {
            console.error('Create customer error:', error);
            gridUtils.handleGridError(error, 'creating customer');
        }
    }

    addModalStyles() {
        const styles = `
            .order-modal .modal-dialog.modal-fullscreen {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                margin: 0;
                padding: 0;
            }
            .order-modal .modal-dialog.modal-fullscreen .modal-content {
                height: 100%;
                border: 0;
                border-radius: 0;
            }
            .order-modal .modal-dialog.modal-fullscreen .modal-body {
                height: calc(100vh - 130px);
                overflow-y: auto;
            }
            .order-modal .modal-content {
                box-shadow: none;
            }
            .order-modal .modal-header {
                background: #f8f9fc;
                border-bottom: 1px solid #e9ecef;
                padding: 1rem;
            }
            .order-modal .modal-body {
                padding: 1.5rem;
            }
            .order-modal .modal-footer {
                background: #f8f9fc;
                border-top: 1px solid #e9ecef;
                padding: 1rem;
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
            .order-items-grid {
                margin: 1.5rem 0;
                border-radius: 0.5rem;
                overflow: hidden;
            }
            .order-items-grid .dx-datagrid {
                background: #fff;
                border: 1px solid #e9ecef;
            }
            .order-items-grid .dx-datagrid-headers {
                background: #f8f9fc;
                border-bottom: 1px solid #e9ecef;
            }
            .order-items-grid .dx-datagrid-rowsview {
                border-top: none;
            }
            .product-info {
                padding: 0.5rem 0;
            }
            .product-name {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }
            .product-details {
                font-size: 0.875rem;
                color: #8898aa;
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
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid #e9ecef;
            }
            .order-summary-row:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 1.1em;
            }
            .order-summary-row .input-group {
                width: 150px;
            }
            
            /* Customer Lookup Enhanced Styles */
            .dx-selectbox {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
            }

            .dx-selectbox:hover {
                border-color: #4c6ef5;
            }

            .dx-selectbox.dx-state-focused {
                border-color: #4c6ef5;
                box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.15);
            }

            .dx-selectbox-popup-wrapper {
                border-radius: 0.5rem;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            .dx-selectbox-popup-wrapper .dx-list {
                background: #fff;
                padding: 8px;
            }

            .customer-lookup-item {
                padding: 12px;
                border-radius: 8px;
                transition: all 0.2s ease;
                background: #fff;
            }

            .customer-lookup-item:hover {
                background-color: #f8faff;
            }

            .dx-list-item {
                border: none !important;
                background: transparent !important;
                margin-bottom: 4px;
            }

            .dx-list-item.dx-state-hover .customer-lookup-item {
                background-color: #f8faff;
            }

            .dx-list-item.dx-state-selected .customer-lookup-item {
                background-color: #4c6ef5;
            }

            .customer-lookup-item .customer-name {
                color: #1a202c;
                font-weight: 600;
                font-size: 0.95rem;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
            }

            .customer-lookup-item .customer-number {
                background: #edf2ff;
                color: #4c6ef5;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                margin-left: 8px;
                font-weight: 500;
            }

            .customer-lookup-item .customer-details {
                display: flex;
                align-items: center;
                gap: 16px;
                color: #64748b;
                font-size: 0.85rem;
            }

            .customer-lookup-item .detail-item {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .customer-lookup-item .detail-item i {
                font-size: 0.875rem;
                color: #94a3b8;
            }

            /* Selected state colors */
            .dx-list-item.dx-state-selected .customer-lookup-item {
                background: linear-gradient(145deg, #4c6ef5, #4558d0);
            }

            .dx-list-item.dx-state-selected .customer-lookup-item .customer-name {
                color: #fff;
            }

            .dx-list-item.dx-state-selected .customer-lookup-item .customer-number {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
            }

            .dx-list-item.dx-state-selected .customer-lookup-item .customer-details {
                color: rgba(255, 255, 255, 0.9);
            }

            .dx-list-item.dx-state-selected .customer-lookup-item .detail-item i {
                color: rgba(255, 255, 255, 0.7);
            }

            /* Input field styles */
            .dx-texteditor-input {
                color: #1a202c !important;
                font-size: 0.95rem !important;
            }

            .dx-placeholder {
                color: #94a3b8 !important;
                font-size: 0.95rem !important;
            }

            .dx-texteditor-input-container {
                background: transparent !important;
            }

            /* Clear button styles */
            .dx-clearbutton-area .dx-icon {
                color: #94a3b8 !important;
            }

            .dx-clearbutton-area:hover .dx-icon {
                color: #4c6ef5 !important;
            }

            /* Dropdown arrow styles */
            .dx-dropdowneditor-icon {
                color: #94a3b8 !important;
            }

            .dx-dropdowneditor-icon:hover {
                color: #4c6ef5 !important;
            }

            /* Loading state */
            .dx-loadpanel {
                background-color: rgba(255, 255, 255, 0.9);
            }

            /* Selected Customer Card Styles */
            #customerDetails .customer-info-card {
                background: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                margin-top: 1rem;
                box-shadow: 0 2px 4px rgba(148, 163, 184, 0.05);
            }

            #customerDetails .card-body {
                padding: 1.5rem;
            }

            #customerDetails .heading-small {
                color: #1a202c;
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 1.25rem;
            }

            #customerDetails .form-group {
                margin-bottom: 1.25rem;
            }

            #customerDetails .form-control-label {
                color: #64748b;
                font-size: 0.875rem;
                margin-bottom: 0.375rem;
                font-weight: 500;
            }

            #customerDetails .form-control-static {
                color: #1a202c;
                font-size: 0.95rem;
                padding: 0.375rem 0;
                font-weight: 500;
            }

            #customerDetails .badge {
                padding: 0.35em 0.8em;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-radius: 0.375rem;
            }

            #customerDetails .badge-success {
                background-color: #10b981;
                color: #fff;
            }

            #customerDetails .badge-danger {
                background-color: #ef4444;
                color: #fff;
            }

            /* Select Box Styles */
            .form-control, select.form-control {
                background-color: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 0.375rem;
                color: #2d3748;
                font-size: 0.875rem;
                transition: all 0.2s ease;
            }

            .form-control:focus, select.form-control:focus {
                border-color: #4c6ef5;
                box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.1);
                outline: none;
            }

            .form-control:hover, select.form-control:hover {
                border-color: #4c6ef5;
            }

            select.form-control option {
                padding: 8px 12px;
                background-color: #fff;
                color: #2d3748;
                font-size: 0.875rem;
            }

            select.form-control option:hover {
                background-color: #f8f9fa;
            }

            select.form-control:disabled {
                background-color: #f8f9fa;
                cursor: not-allowed;
            }

            .dx-selectbox-popup-wrapper .dx-list {
                background-color: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 0.375rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }

            .dx-selectbox-popup-wrapper .dx-list-item {
                padding: 8px 12px;
                border: none;
                color: #2d3748;
                transition: all 0.2s ease;
            }

            .dx-selectbox-popup-wrapper .dx-list-item:hover {
                background-color: #f0f4ff;
                color: #4c6ef5;
            }

            .dx-selectbox-popup-wrapper .dx-list-item.dx-state-selected {
                background-color: #4c6ef5;
                color: #fff;
            }

            .dx-selectbox-popup-wrapper .dx-list-item.dx-state-focused {
                background-color: #f0f4ff;
            }

            /* Make dropdowns more compact and modern */
            .form-group select.form-control {
                height: 38px;
                padding: 0.375rem 0.75rem;
            }

            /* Style for the dropdown arrow */
            select.form-control {
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234c6ef5' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.763L10.825 4z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 0.75rem center;
                background-size: 12px;
                padding-right: 2rem;
            }

            /* Style for disabled state */
            select.form-control:disabled {
                opacity: 0.7;
                background-color: #f8f9fa;
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
                price: product.base_price || 0
            }));
            
            const $select = $('#productSelect');
            $select.empty();
            $select.append('<option value="">Select Product</option>');
            
            // Format currency in IDR
            const formatIDR = (value) => {
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(value);
            };
            
            this.products.forEach(p => {
                $select.append(`<option value="${p.id}" data-price="${p.price}">${p.name} - ${formatIDR(p.price)}</option>`);
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
        // Dispose existing grid if any
        const existingGrid = $('#orderItemsGrid').data('dxDataGrid');
        if (existingGrid) {
            existingGrid.dispose();
        }

        // Initialize DataGrid
        $('#orderItemsGrid').dxDataGrid({
            dataSource: this.orderItems,
            showBorders: true,
            paging: {
                enabled: false
            },
            editing: {
                mode: 'row',
                allowDeleting: true,
                useIcons: true
            },
            columns: [{
                dataField: 'ProductName',
                caption: 'Product',
                cellTemplate: (container, options) => {
                    $('<div>').addClass('product-info')
                        .append(
                            $('<div>')
                                .append($('<div>').addClass('product-name').text(options.data.ProductName))
                                .append($('<div>').addClass('product-details').text(`${options.data.Size} - ${options.data.Color}`))
                        )
                        .appendTo(container);
                }
            }, {
                dataField: 'Quantity',
                caption: 'Quantity',
                dataType: 'number',
                alignment: 'center',
                width: 100
            }, {
                dataField: 'UnitPrice',
                caption: 'Unit Price',
                dataType: 'number',
                format: {
                    type: 'currency',
                    currency: 'IDR',
                    precision: 0
                },
                alignment: 'right',
                width: 150
            }, {
                dataField: 'Total',
                caption: 'Total',
                dataType: 'number',
                format: {
                    type: 'currency',
                    currency: 'IDR',
                    precision: 0
                },
                alignment: 'right',
                width: 150,
                calculateCellValue: (data) => data.Quantity * data.UnitPrice
            }],
            onRowRemoving: (e) => {
                const index = this.orderItems.indexOf(e.data);
                if (index > -1) {
                    this.orderItems.splice(index, 1);
                    this.updateOrderSummary();
                }
            }
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

        // Format currency in IDR
        const formatIDR = (value) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        };

        // Update display values
        $('.subtotal-value').text(formatIDR(subtotal));
        $('.discount-value').text(formatIDR(discount));
        $('.total-value').text(formatIDR(total));
    }

    async createOrder() {
        try {
            // Validate form
            const form = $('#createOrderForm')[0];
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            if (!this.selectedCustomer) {
                gridUtils.showError('Please select a customer');
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
            
            const orderData = {
                OrderNumber: orderNumber,
                CustomerID: this.selectedCustomer.id,
                OfficeID: Number(formData.get('officeId')),
                ExpectedDeliveryDate: formData.get('expectedDeliveryDate'),
                Subtotal: subtotal,
                DiscountAmount: discount,
                TotalAmount: total,
                Status: formData.get('status') || 'pending',
                PaymentStatus: formData.get('paymentStatus') || 'unpaid',
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