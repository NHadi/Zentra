import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define PurchaseOrderPage
window.PurchaseOrderPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.purchaseOrders = [];
        this.currentOrder = null;
        this.suppliers = [];
        this.items = [];
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Order Status Badge */
            .order-status {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .order-status.pending {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .order-status.approved {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .order-status.rejected {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            /* Order Number */
            .order-number {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                color: #8898aa;
                background: rgba(136, 152, 170, 0.1);
            }

            /* Timeline */
            .timeline-item {
                position: relative;
                padding-left: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .timeline-item:last-child {
                margin-bottom: 0;
            }

            .timeline-badge {
                position: absolute;
                left: 0;
                top: 0;
                width: 1rem;
                height: 1rem;
                border-radius: 50%;
                background: #5e72e4;
            }

            .timeline-content {
                padding-left: 1rem;
            }

            .timeline-title {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }

            .timeline-info {
                color: #8898aa;
                font-size: 0.875rem;
            }

            /* Master Detail Styles */
            .master-detail-container {
                background: #f8f9fe;
                border-radius: 0.375rem;
                margin: 1rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
            }

            .detail-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 2rem;
                border-radius: 0.375rem 0.375rem 0 0;
                margin: -1.5rem -1.5rem 1.5rem -1.5rem;
            }

            .detail-header .order-date {
                font-size: 0.875rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .detail-header .order-amount {
                font-size: 2rem;
                font-weight: 600;
                color: white !important;
            }

            .info-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.1);
                margin-bottom: 1.5rem;
            }

            .info-card .card-header {
                padding: 1rem 1.5rem;
                background: transparent;
                border-bottom: 1px solid #e9ecef;
            }

            .info-card .card-header h5 {
                margin: 0;
                color: #32325d;
                font-size: 1rem;
                font-weight: 600;
            }

            .info-card .card-body {
                padding: 1.5rem;
            }

            .info-item {
                margin-bottom: 1.25rem;
            }

            .info-item:last-child {
                margin-bottom: 0;
            }

            .info-item .label {
                color: #8898aa;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 0.5rem;
            }

            .info-item .value {
                color: #32325d;
                font-size: 1rem;
                font-weight: 500;
            }

            .info-item .badge {
                font-size: 0.875rem;
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
            }

            .order-meta {
                display: flex;
                align-items: center;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .order-meta-item {
                margin-right: 2rem;
            }

            .order-meta-item:last-child {
                margin-right: 0;
            }

            .order-meta-label {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-bottom: 0.25rem;
            }

            .order-meta-value {
                font-size: 0.875rem;
                font-weight: 600;
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
        $('#orderDetailsModal').off('show.bs.modal');
        $('#orderDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
        $('#addItemBtn').off('click');
        $('.remove-item').off('click');
        $('.quantity, .unit-price').off('input');
    }

    bindEvents() {
        // Modal events
        $('#orderDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const orderId = button.data('order-id');
            if (orderId) {
                this.loadOrderDetails(orderId);
            }
        });

        $('#orderDetailsModal').on('hide.bs.modal', () => {
            this.currentOrder = null;
            this.clearOrderDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Add item button
        $('#addItemBtn').on('click', () => {
            this.addItemRow();
        });

        // Remove item button
        $(document).on('click', '.remove-item', function() {
            $(this).closest('tr').remove();
        });

        // Calculate total on quantity/price change
        $(document).on('input', '.quantity, .unit-price', function() {
            const row = $(this).closest('tr');
            const quantity = parseFloat(row.find('.quantity').val()) || 0;
            const unitPrice = parseFloat(row.find('.unit-price').val()) || 0;
            row.find('.total').val((quantity * unitPrice).toFixed(2));
        });

        // Save button event
        $('#saveOrderBtn').on('click', () => {
            this.saveOrder();
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.loadSuppliers();
        this.loadItems();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#purchaseOrderGrid');
        if (!gridElement.length) {
            console.error('Purchase order grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#purchaseOrderGrid').dxDataGrid({
            dataSource: this.purchaseOrders,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: false,
            wordWrapEnabled: true,
            height: 'calc(100vh - 350px)',
            width: '100%',
            columns: [
                {
                    dataField: 'po_number',
                    caption: 'Order Number',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass('order-number')
                            .text(options.value)
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'order_date',
                    caption: 'Order Date',
                    dataType: 'date',
                    format: 'dd/MM/yyyy'
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass(`order-status ${options.value}`)
                            .text(options.value.charAt(0).toUpperCase() + options.value.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'supplier.name',
                    caption: 'Supplier'
                },
                {
                    dataField: 'total_amount',
                    caption: 'Total Amount',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
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
                    }
                    // , {
                    //     hint: 'Edit',
                    //     icon: 'fas fa-edit',
                    //     onClick: (e) => {
                    //         this.editOrder(e.row.data);
                    //     }
                    // }
                ]
                }
            ],
            paging: {
                pageSize: 10
            },
            pager: {
                showPageSizeSelector: true,
                allowedPageSizes: [5, 10, 20, 50],
                showInfo: true,
                showNavigationButtons: true
            },
            masterDetail: {
                enabled: true,
                template: (container, options) => {
                    this.renderOrderDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Purchase_Orders');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.purchaseOrders = await zentra.getPurchaseOrders();
            this.grid.option('dataSource', this.purchaseOrders);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading orders:', error);
            DevExpress.ui.notify('Failed to load orders', 'error', 3000);
        }
    }

    async loadSuppliers() {
        try {
            this.suppliers = await zentra.getSuppliers();
            const supplierSelect = $('#input-supplier');
            supplierSelect.empty().append('<option value="">Select supplier</option>');
            this.suppliers.forEach(supplier => {
                supplierSelect.append(`<option value="${supplier.id}">${supplier.name}</option>`);
            });
        } catch (error) {
            console.error('Error loading suppliers:', error);
            DevExpress.ui.notify('Failed to load suppliers', 'error', 3000);
        }
    }

    async loadItems() {
        try {
            this.items = await zentra.getItems();
            const itemSelects = $('.item-select');
            itemSelects.empty().append('<option value="">Select item</option>');
            this.items.forEach(item => {
                itemSelects.append(`<option value="${item.id}">${item.name}</option>`);
            });
        } catch (error) {
            console.error('Error loading items:', error);
            DevExpress.ui.notify('Failed to load items', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalOrders = this.purchaseOrders.length;
        const totalAmount = this.purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0);
        const pendingOrders = this.purchaseOrders.filter(order => order.status === 'pending').length;
        
        const lastOrder = this.purchaseOrders.length > 0 ? 
            new Date(Math.max(...this.purchaseOrders.map(order => new Date(order.order_date)))).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        $('#totalOrders').text(totalOrders);
        $('#totalAmount').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(totalAmount));
        $('#pendingOrders').text(pendingOrders);
        $('#lastOrder').text(lastOrder);
    }

    showOrderDetails(order) {
        this.currentOrder = order;
        $('#orderDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('orderInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateOrderDetails(order);
        }, 150);
    }

    updateOrderDetails(order) {
        // Format date
        const date = new Date(order.order_date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update fields
        $('#orderNumber').text(order.po_number);
        $('#orderDate').text(formattedDate);
        $('#orderStatus').html(`
            <span class="order-status ${order.status}">
                ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
        `);
        $('#orderSupplier').text(order.supplier.name);
        $('#orderTotal').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(order.total_amount));
        $('#orderNotes').text(order.notes || '-');
        
        // Update items
        this.updateOrderItems(order.items);
        
        // Timeline
        this.updateTimeline(order);
    }

    updateOrderItems(items) {
        const $items = $('#orderItems');
        $items.empty();

        items.forEach(item => {
            const total = item.quantity * item.unit_price;
            $items.append(`
                <tr>
                    <td>${item.item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(item.unit_price)}</td>
                    <td>${new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(total)}</td>
                </tr>
            `);
        });
    }

    updateTimeline(order) {
        const $timeline = $('.order-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Order Created',
            `Created by ${order.created_by}`,
            order.created_at
        ));

        // Updated if different from created
        if (order.updated_at !== order.created_at) {
            $timeline.append(this.createTimelineItem(
                'Order Updated',
                `Last updated by ${order.updated_by}`,
                order.updated_at
            ));
        }
    }

    createTimelineItem(title, info, date) {
        return $('<div>')
            .addClass('timeline-item')
            .append($('<div>').addClass('timeline-badge'))
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

    clearOrderDetails() {
        $('#orderNumber, #orderDate, #orderStatus, #orderSupplier, #orderTotal, #orderNotes').text('');
        $('#orderItems').empty();
        $('.order-timeline').empty();
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        // Load tab content if needed
        if (tab === 'timeline' && this.currentOrder) {
            this.updateTimeline(this.currentOrder);
        }
    }

    addItemRow() {
        const $row = $(`
            <tr>
                <td>
                    <select class="form-control item-select" required>
                        <option value="">Select item</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control quantity" min="1" required>
                </td>
                <td>
                    <input type="number" class="form-control unit-price" min="0" step="0.01" required>
                </td>
                <td>
                    <input type="text" class="form-control total" readonly>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger remove-item">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);

        // Populate items dropdown
        this.items.forEach(item => {
            $row.find('.item-select').append(`<option value="${item.id}">${item.name}</option>`);
        });

        $('#orderItemsForm').append($row);
    }

    editOrder(order) {
        this.currentOrder = order;
        $('#addOrderModalLabel').text('Edit Purchase Order');
        
        // Fill form fields
        $('#input-supplier').val(order.supplier.id);
        $('#input-date').val(order.order_date.split('T')[0]);
        $('#input-status').val(order.status);
        $('#input-notes').val(order.notes);
        
        // Clear and add items
        $('#orderItemsForm').empty();
        order.items.forEach(item => {
            this.addItemRow();
            const $lastRow = $('#orderItemsForm tr:last');
            $lastRow.find('.item-select').val(item.item.id);
            $lastRow.find('.quantity').val(item.quantity);
            $lastRow.find('.unit-price').val(item.unit_price);
            $lastRow.find('.total').val(item.quantity * item.unit_price);
        });
        
        $('#addOrderModal').modal('show');
    }

    async saveOrder() {
        try {
            const formData = {
                supplier_id: $('#input-supplier').val(),
                order_date: $('#input-date').val(),
                status: $('#input-status').val(),
                notes: $('#input-notes').val(),
                items: []
            };

            // Collect items data
            $('#orderItemsForm tr').each(function() {
                const $row = $(this);
                formData.items.push({
                    item_id: $row.find('.item-select').val(),
                    quantity: parseFloat($row.find('.quantity').val()),
                    unit_price: parseFloat($row.find('.unit-price').val())
                });
            });

            if (this.currentOrder) {
                // Update existing order
                await zentra.updatePurchaseOrder(this.currentOrder.id, formData);
                DevExpress.ui.notify('Order updated successfully', 'success', 3000);
            } else {
                // Create new order
                await zentra.createPurchaseOrder(formData);
                DevExpress.ui.notify('Order created successfully', 'success', 3000);
            }

            // Refresh data
            await this.loadData();
            
            // Close modal
            $('#addOrderModal').modal('hide');
        } catch (error) {
            console.error('Error saving order:', error);
            DevExpress.ui.notify('Failed to save order', 'error', 3000);
        }
    }

    renderOrderDetails(container, order) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Header Section with amount and meta info
        const $header = $('<div>')
            .addClass('detail-header')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('order-date')
                            .text(new Date(order.order_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }))
                    )
                    .append(
                        $('<div>')
                            .addClass('order-amount')
                            .text(new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(order.total_amount))
                    )
            )
            .append(
                $('<div>')
                    .addClass('order-meta')
                    .append(
                        $('<div>')
                            .addClass('order-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('order-meta-label')
                                    .text('Status')
                            )
                            .append(
                                $('<div>')
                                    .addClass('order-meta-value')
                                    .append(
                                        $('<span>')
                                            .addClass(`order-status ${order.status}`)
                                            .text(order.status.charAt(0).toUpperCase() + order.status.slice(1))
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('order-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('order-meta-label')
                                    .text('Supplier')
                            )
                            .append(
                                $('<div>')
                                    .addClass('order-meta-value')
                                    .text(order.supplier.name)
                            )
                    )
            )
            .appendTo($detailContent);

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row mt-4').appendTo($detailContent);
        
        // Left column - Order Details
        const $leftCol = $('<div>').addClass('col-lg-7').appendTo($row);
        
        // Right column - Additional Info
        const $rightCol = $('<div>').addClass('col-lg-5').appendTo($row);

        // Order Details Card
        const $orderInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Order Details'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Order Number'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .append(
                                        $('<span>')
                                            .addClass('order-number')
                                            .text(order.po_number)
                                    )
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Notes'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(order.notes || '-')
                            )
                    )
            )
            .appendTo($leftCol);

        // Items Card
        const $itemsCard = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Order Items'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>')
                            .addClass('table-responsive')
                            .append(
                                $('<table>')
                                    .addClass('table align-items-center table-flush')
                                    .append(
                                        $('<thead>')
                                            .addClass('thead-light')
                                            .append(
                                                $('<tr>')
                                                    .append($('<th>').text('Item'))
                                                    .append($('<th>').text('Quantity'))
                                                    .append($('<th>').text('Unit Price'))
                                                    .append($('<th>').text('Total'))
                                            )
                                    )
                                    .append(
                                        $('<tbody>').append(
                                            order.items.map(item => {
                                                const total = item.quantity * item.unit_price;
                                                return $('<tr>')
                                                    .append($('<td>').text(item.item.name))
                                                    .append($('<td>').text(item.quantity))
                                                    .append($('<td>').text(new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }).format(item.unit_price)))
                                                    .append($('<td>').text(new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }).format(total)));
                                            })
                                        )
                                    )
                            )
                    )
            )
            .appendTo($leftCol);

        // Additional Info Card
        const $additionalInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Additional Information'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Created By'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(order.created_by || '-')
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Created At'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(order.created_at ? 
                                        new Date(order.created_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-')
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Last Updated'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(order.updated_at ? 
                                        new Date(order.updated_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-')
                            )
                    )
            )
            .appendTo($rightCol);

        container.append($detailContent);
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.purchaseOrderPageInstance) {
    window.purchaseOrderPageInstance = new window.PurchaseOrderPage();
} 