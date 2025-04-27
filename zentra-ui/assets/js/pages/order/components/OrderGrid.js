import { gridUtils } from '../../../utils/gridUtils.js';
import { getBaseUrl } from '../../../api/config.js';

export class OrderGrid {
    constructor(orderPage) {
        this.orderPage = orderPage;
        this.grid = null;
    }

    initialize() {
        const gridElement = $('#orderGrid');
        if (!gridElement.length) {
            console.error('Order grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

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
                            this.orderPage.showOrderDetails(e.row.data);
                        }
                    }, {
                        hint: 'Print Order',
                        icon: 'fas fa-print',
                        onClick: (e) => {
                            this.orderPage.printInvoice(e.row.data);
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
                    // Use the OrderDetails class to render the detail view
                    this.orderPage.orderDetails.render(container, options.data);
                }
            }
        }).dxDataGrid('instance');

        // Add export buttons
        gridUtils.addExportButtons(this.grid, 'orders');
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
} 