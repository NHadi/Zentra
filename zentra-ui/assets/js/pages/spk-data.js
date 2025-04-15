import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define SPKPage
window.SPKPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.spks = [];
        this.currentSPK = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Status Badge */
            .status-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .status-badge.pending {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .status-badge.in_progress {
                color: #f7b924;
                background: rgba(247, 185, 36, 0.1);
            }

            .status-badge.completed {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            /* Work Type Badge */
            .work-type-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .work-type-badge.production {
                color: #5e72e4;
                background: rgba(94, 114, 228, 0.1);
            }

            .work-type-badge.repair {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .work-type-badge.maintenance {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            /* Task Status */
            .task-status {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.5rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
            }

            .task-status.pending {
                color: #8898aa;
                background: rgba(136, 152, 170, 0.1);
            }

            .task-status.in_progress {
                color: #f7b924;
                background: rgba(247, 185, 36, 0.1);
            }

            .task-status.completed {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
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
        $('#spkDetailsModal').off('show.bs.modal');
        $('#spkDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#spkDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const spkId = button.data('spk-id');
            if (spkId) {
                this.loadSPKDetails(spkId);
            }
        });

        $('#spkDetailsModal').on('hide.bs.modal', () => {
            this.currentSPK = null;
            this.clearSPKDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Save button event
        $('#saveSPKBtn').on('click', () => {
            this.saveSPK();
        });

        // Edit button event
        $('#editSPKBtn').on('click', () => {
            if (this.currentSPK) {
                this.editSPK(this.currentSPK);
            }
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#spkGrid');
        if (!gridElement.length) {
            console.error('SPK grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        // Add print button to the grid header
        const $gridHeader = $('.card-header');
        $gridHeader.find('.text-right').prepend(`
            <button type="button" class="btn btn-sm btn-info mr-2" id="printSPKGrid">
                <i class="fas fa-print"></i> Print
            </button>
        `);

        this.grid = $('#spkGrid').dxDataGrid({
            dataSource: this.spks,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: true,
            wordWrapEnabled: true,
            columns: [
                {
                    dataField: 'spk_number',
                    caption: 'SPK Number',
                    width: '15%'
                },
                {
                    dataField: 'order.order_number',
                    caption: 'Order Number',
                    width: '15%'
                },
                {
                    dataField: 'customer_name',
                    caption: 'Customer',
                    width: '20%'
                },
                {
                    dataField: 'work_type',
                    caption: 'Work Type',
                    width: '10%',
                    cellTemplate: (container, options) => {
                        const type = options.value;
                        $('<div>')
                            .addClass(`work-type-badge ${type}`)
                            .text(type.charAt(0).toUpperCase() + type.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    width: '25%'
                },
                {
                    dataField: 'start_date',
                    caption: 'Start Date',
                    dataType: 'datetime',
                    format: 'dd/MM/yyyy HH:mm',
                    width: '15%'
                },
                {
                    dataField: 'end_date',
                    caption: 'End Date',
                    dataType: 'datetime',
                    format: 'dd/MM/yyyy HH:mm',
                    width: '15%'
                },
                {
                    dataField: 'status',
                    caption: 'Status',
                    width: '10%',
                    cellTemplate: (container, options) => {
                        const status = options.value;
                        $('<div>')
                            .addClass(`status-badge ${status}`)
                            .text(status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'assigned_to.name',
                    caption: 'Assigned To',
                    width: '15%'
                },
                {
                    dataField: 'estimated_cost',
                    caption: 'Estimated Cost',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    },
                    width: '12%'
                },
                {
                    type: 'buttons',
                    width: '10%',
                    buttons: [{
                        hint: 'View Details',
                        icon: 'fas fa-eye',
                        onClick: (e) => {
                            this.showSPKDetails(e.row.data);
                        }
                    }, {
                        hint: 'Edit',
                        icon: 'fas fa-edit',
                        onClick: (e) => {
                            this.editSPK(e.row.data);
                        }
                    }]
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
                    this.renderSPKDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'SPK_Data');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');

        // Add print functionality
        $('#printSPKGrid').on('click', () => {
            this.printGrid();
        });
    }

    async loadData() {
        try {
            this.spks = await zentra.getWorkOrders();
            this.grid.option('dataSource', this.spks);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading SPKs:', error);
            DevExpress.ui.notify('Failed to load SPKs', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalSPK = this.spks.length;
        const inProgressSPK = this.spks.filter(spk => spk.status === 'in_progress').length;
        const completedSPK = this.spks.filter(spk => spk.status === 'completed').length;
        const totalCost = this.spks.reduce((sum, spk) => sum + (spk.estimated_cost || 0), 0);

        $('#totalSPK').text(totalSPK);
        $('#inProgressSPK').text(inProgressSPK);
        $('#completedSPK').text(completedSPK);
        $('#totalCost').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(totalCost));
    }

    showSPKDetails(spk) {
        this.currentSPK = spk;
        $('#spkDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('spkInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateSPKDetails(spk);
        }, 150);
    }

    updateSPKDetails(spk) {
        // Format dates
        const startDate = new Date(spk.start_date);
        const endDate = new Date(spk.end_date);
        const formattedStartDate = startDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const formattedEndDate = endDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Update fields
        $('#spkNumber').text(spk.spk_number);
        $('#orderNumber').text(spk.order.order_number);
        $('#customerName').text(spk.customer_name);
        $('#workType').html(`
            <span class="work-type-badge ${spk.work_type}">
                ${spk.work_type.charAt(0).toUpperCase() + spk.work_type.slice(1)}
            </span>
        `);
        $('#description').text(spk.description);
        $('#startDate').text(formattedStartDate);
        $('#endDate').text(formattedEndDate);
        $('#status').html(`
            <span class="status-badge ${spk.status}">
                ${spk.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
        `);
        $('#assignedTo').text(spk.assigned_to.name);
        $('#estimatedCost').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(spk.estimated_cost || 0));
        $('#actualCost').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(spk.actual_cost || 0));

        // Update tasks list
        this.updateTasksList(spk.tasks);

        // Update items list
        this.updateItemsList(spk.items);

        // Add print button to modal footer if not exists
        if (!$('#printSPKDetailsBtn').length) {
            $('.modal-footer').prepend(`
                <button type="button" class="btn btn-info" id="printSPKDetailsBtn">
                    <i class="fas fa-print"></i> Print Details
                </button>
            `);

            // Add print functionality
            $('#printSPKDetailsBtn').on('click', () => {
                this.printSPKDetails(spk);
            });
        }
    }

    updateTasksList(tasks) {
        const $tasksList = $('#tasksList');
        $tasksList.empty();

        tasks.forEach(task => {
            const startDate = new Date(task.start_date);
            const endDate = new Date(task.end_date);
            const formattedStartDate = startDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const formattedEndDate = endDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            $tasksList.append(`
                <tr>
                    <td>${task.task_name}</td>
                    <td>${task.description}</td>
                    <td>${task.assigned_to}</td>
                    <td>${formattedStartDate}</td>
                    <td>${formattedEndDate}</td>
                    <td>
                        <span class="task-status ${task.status}">
                            ${task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                    </td>
                </tr>
            `);
        });
    }

    updateItemsList(items) {
        const $itemsList = $('#itemsList');
        $itemsList.empty();

        items.forEach(item => {
            $itemsList.append(`
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(item.unit_price)}</td>
                    <td>${new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(item.total_price)}</td>
                </tr>
            `);
        });
    }

    clearSPKDetails() {
        $('#spkNumber, #orderNumber, #customerName, #workType, #description, #startDate, #endDate, #status, #assignedTo, #estimatedCost, #actualCost').text('');
        $('#tasksList, #itemsList').empty();
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');
    }

    editSPK(spk) {
        this.currentSPK = spk;
        $('#addSPKModalLabel').text('Edit SPK');
        
        // Fill form fields
        $('#input-order').val(spk.order.id);
        $('#input-customer').val(spk.customer_name);
        $('#input-work-type').val(spk.work_type);
        $('#input-description').val(spk.description);
        $('#input-start-date').val(spk.start_date.split('T')[0] + 'T' + spk.start_date.split('T')[1].split('.')[0]);
        $('#input-end-date').val(spk.end_date.split('T')[0] + 'T' + spk.end_date.split('T')[1].split('.')[0]);
        $('#input-assigned-to').val(spk.assigned_to.id);
        $('#input-estimated-cost').val(spk.estimated_cost);
        
        $('#addSPKModal').modal('show');
    }

    async saveSPK() {
        try {
            const formData = {
                order_id: $('#input-order').val(),
                customer_name: $('#input-customer').val(),
                work_type: $('#input-work-type').val(),
                description: $('#input-description').val(),
                start_date: $('#input-start-date').val(),
                end_date: $('#input-end-date').val(),
                assigned_to_id: $('#input-assigned-to').val(),
                estimated_cost: parseFloat($('#input-estimated-cost').val()) || 0
            };

            if (this.currentSPK) {
                // Update existing SPK
                await zentra.updateWorkOrder(this.currentSPK.id, formData);
                DevExpress.ui.notify('SPK updated successfully', 'success', 3000);
            } else {
                // Create new SPK
                await zentra.createWorkOrder(formData);
                DevExpress.ui.notify('SPK created successfully', 'success', 3000);
            }

            // Reload data and close modal
            await this.loadData();
            $('#addSPKModal').modal('hide');
        } catch (error) {
            console.error('Error saving SPK:', error);
            DevExpress.ui.notify('Failed to save SPK', 'error', 3000);
        }
    }

    renderSPKDetails(container, spk) {
        const $detailContent = $('<div>').addClass('p-4');

        // Header Section
        const $header = $('<div>')
            .addClass('d-flex justify-content-between align-items-center mb-4')
            .append(
                $('<div>')
                    .append(
                        $('<h4>').text(spk.spk_number),
                        $('<p>').addClass('text-muted mb-0').text(spk.description)
                    )
            )
            .append(
                $('<div>')
                    .addClass('text-right')
                    .append(
                        $('<div>').addClass('status-badge ' + spk.status)
                            .text(spk.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
                    )
            )
            .appendTo($detailContent);

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row').appendTo($detailContent);
        
        // Left column - SPK Details
        const $leftCol = $('<div>').addClass('col-lg-6').appendTo($row);
        
        // Right column - Tasks and Items
        const $rightCol = $('<div>').addClass('col-lg-6').appendTo($row);

        // SPK Details Card
        const $spkInfo = $('<div>')
            .addClass('card mb-4')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('SPK Details'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('row')
                            .append(
                                $('<div>').addClass('col-md-6')
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('Order: '))
                                            .append(spk.order.order_number)
                                    )
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('Customer: '))
                                            .append(spk.customer_name)
                                    )
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('Work Type: '))
                                            .append(
                                                $('<span>').addClass('work-type-badge ' + spk.work_type)
                                                    .text(spk.work_type.charAt(0).toUpperCase() + spk.work_type.slice(1))
                                            )
                                    )
                            )
                            .append(
                                $('<div>').addClass('col-md-6')
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('Start Date: '))
                                            .append(new Date(spk.start_date).toLocaleString())
                                    )
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('End Date: '))
                                            .append(new Date(spk.end_date).toLocaleString())
                                    )
                                    .append(
                                        $('<p>').addClass('mb-2')
                                            .append($('<strong>').text('Assigned To: '))
                                            .append(spk.assigned_to.name)
                                    )
                            )
                    )
            )
            .appendTo($leftCol);

        // Tasks Card
        const $tasksCard = $('<div>')
            .addClass('card mb-4')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Tasks'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('table-responsive')
                            .append(
                                $('<table>').addClass('table align-items-center table-flush')
                                    .append(
                                        $('<thead>').addClass('thead-light')
                                            .append(
                                                $('<tr>')
                                                    .append($('<th>').text('Task Name'))
                                                    .append($('<th>').text('Status'))
                                                    .append($('<th>').text('Due Date'))
                                            )
                                    )
                                    .append(
                                        $('<tbody>').append(
                                            spk.tasks.map(task => 
                                                $('<tr>')
                                                    .append($('<td>').text(task.task_name))
                                                    .append(
                                                        $('<td>')
                                                            .append(
                                                                $('<span>').addClass('task-status ' + task.status)
                                                                    .text(task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
                                                            )
                                                    )
                                                    .append($('<td>').text(new Date(task.end_date).toLocaleDateString()))
                                            )
                                        )
                                    )
                            )
                    )
            )
            .appendTo($rightCol);

        // Items Card
        const $itemsCard = $('<div>')
            .addClass('card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Items'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('table-responsive')
                            .append(
                                $('<table>').addClass('table align-items-center table-flush')
                                    .append(
                                        $('<thead>').addClass('thead-light')
                                            .append(
                                                $('<tr>')
                                                    .append($('<th>').text('Description'))
                                                    .append($('<th>').text('Quantity'))
                                                    .append($('<th>').text('Unit Price'))
                                                    .append($('<th>').text('Total Price'))
                                            )
                                    )
                                    .append(
                                        $('<tbody>').append(
                                            spk.items.map(item => 
                                                $('<tr>')
                                                    .append($('<td>').text(item.description))
                                                    .append($('<td>').text(item.quantity))
                                                    .append(
                                                        $('<td>').text(new Intl.NumberFormat('id-ID', {
                                                            style: 'currency',
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0
                                                        }).format(item.unit_price))
                                                    )
                                                    .append(
                                                        $('<td>').text(new Intl.NumberFormat('id-ID', {
                                                            style: 'currency',
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0
                                                        }).format(item.total_price))
                                                    )
                                            )
                                        )
                                    )
                            )
                    )
            )
            .appendTo($rightCol);

        container.append($detailContent);
    }

    printGrid() {
        // Create print window
        const printWindow = window.open('', '_blank');
        
        // Get current grid data
        const gridData = this.grid.getDataSource().items();
        
        // Create print HTML
        let printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>SPK Data Report</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .print-container { padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; }
                    .header p { margin: 5px 0; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .detail-section { margin-left: 20px; margin-bottom: 15px; }
                    .detail-section h3 { margin: 10px 0; }
                    @media print {
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <h1>SPK Data Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
        `;

        // Add main grid data
        printHTML += `
            <table>
                <thead>
                    <tr>
                        <th>SPK Number</th>
                        <th>Order Number</th>
                        <th>Customer</th>
                        <th>Work Type</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Estimated Cost</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Add rows with details
        gridData.forEach(spk => {
            printHTML += `
                <tr>
                    <td>${spk.spk_number}</td>
                    <td>${spk.order.order_number}</td>
                    <td>${spk.customer_name}</td>
                    <td>${spk.work_type}</td>
                    <td>${spk.description}</td>
                    <td>${new Date(spk.start_date).toLocaleString()}</td>
                    <td>${new Date(spk.end_date).toLocaleString()}</td>
                    <td>${spk.status}</td>
                    <td>${spk.assigned_to.name}</td>
                    <td>${spk.estimated_cost}</td>
                </tr>
            `;

            // Add tasks if any
            if (spk.tasks && spk.tasks.length > 0) {
                printHTML += `
                    <tr>
                        <td colspan="10">
                            <div class="detail-section">
                                <h3>Tasks</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Task Name</th>
                                            <th>Description</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;

                spk.tasks.forEach(task => {
                    printHTML += `
                        <tr>
                            <td>${task.task_name}</td>
                            <td>${task.description}</td>
                            <td>${new Date(task.start_date).toLocaleString()}</td>
                            <td>${new Date(task.end_date).toLocaleString()}</td>
                            <td>${task.status}</td>
                        </tr>
                    `;
                });

                printHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                `;
            }

            // Add items if any
            if (spk.items && spk.items.length > 0) {
                printHTML += `
                    <tr>
                        <td colspan="10">
                            <div class="detail-section">
                                <h3>Items</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                `;

                spk.items.forEach(item => {
                    printHTML += `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit_price}</td>
                            <td>${item.total_price}</td>
                        </tr>
                    `;
                });

                printHTML += `
                                    </tbody>
                                </table>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });

        printHTML += `
                </tbody>
            </table>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()">Print</button>
            </div>
            </div>
            </body>
            </html>
        `;

        // Write to print window and focus
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
    }

    printSPKDetails(spk) {
        // Create print window
        const printWindow = window.open('', '_blank');
        
        // Create print HTML
        let printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>SPK Details - ${spk.spk_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .print-container { padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { margin: 0; }
                    .header p { margin: 5px 0; }
                    .section { margin-bottom: 20px; }
                    .section h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
                    .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; margin: 10px 0; }
                    .info-label { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f5f5f5; }
                    .badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; }
                    .badge-primary { background-color: #5e72e4; color: white; }
                    .badge-success { background-color: #2dce89; color: white; }
                    .badge-warning { background-color: #fb6340; color: white; }
                    .currency { text-align: right; }
                    @media print {
                        .no-print { display: none; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="header">
                        <h1>SPK Details</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="section">
                        <h2>Basic Information</h2>
                        <div class="info-grid">
                            <div class="info-label">SPK Number:</div>
                            <div>${spk.spk_number}</div>
                            <div class="info-label">Order Number:</div>
                            <div>${spk.order.order_number}</div>
                            <div class="info-label">Customer:</div>
                            <div>${spk.customer_name}</div>
                            <div class="info-label">Work Type:</div>
                            <div class="badge badge-primary">${spk.work_type}</div>
                            <div class="info-label">Status:</div>
                            <div class="badge badge-${spk.status === 'completed' ? 'success' : 'warning'}">${spk.status}</div>
                            <div class="info-label">Description:</div>
                            <div>${spk.description}</div>
                            <div class="info-label">Start Date:</div>
                            <div>${new Date(spk.start_date).toLocaleString()}</div>
                            <div class="info-label">End Date:</div>
                            <div>${new Date(spk.end_date).toLocaleString()}</div>
                            <div class="info-label">Assigned To:</div>
                            <div>${spk.assigned_to.name}</div>
                            <div class="info-label">Estimated Cost:</div>
                            <div class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(spk.estimated_cost || 0)}</div>
                            <div class="info-label">Actual Cost:</div>
                            <div class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(spk.actual_cost || 0)}</div>
                        </div>
                    </div>

                    ${spk.tasks && spk.tasks.length > 0 ? `
                    <div class="section">
                        <h2>Tasks</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Task Name</th>
                                    <th>Description</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${spk.tasks.map(task => `
                                    <tr>
                                        <td>${task.task_name}</td>
                                        <td>${task.description}</td>
                                        <td>${new Date(task.start_date).toLocaleString()}</td>
                                        <td>${new Date(task.end_date).toLocaleString()}</td>
                                        <td class="badge badge-${task.status === 'completed' ? 'success' : 'warning'}">${task.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    ${spk.items && spk.items.length > 0 ? `
                    <div class="section">
                        <h2>Items</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Quantity</th>
                                    <th class="currency">Unit Price</th>
                                    <th class="currency">Total Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${spk.items.map(item => `
                                    <tr>
                                        <td>${item.description}</td>
                                        <td>${item.quantity}</td>
                                        <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.unit_price)}</td>
                                        <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.total_price)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : ''}

                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()">Print</button>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Write to print window and focus
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.spkPageInstance) {
    window.spkPageInstance = new window.SPKPage();
} 