import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';
import { pettyCashRequestsAPI } from '../api/modules/petty-cash-requests.js';

// Define PettyCashRequestsPage
window.PettyCashRequestsPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.pettyCashRequests = [];
        this.currentRequest = null;
        this.pettyCashBudgets = [];
        this.offices = [];
        this.divisions = [];
        this.channels = [];
        this.categories = [];
        this.employees = [];
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Request Status Badge */
            .request-status {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .request-status.pending {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            .request-status.approved {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .request-status.rejected {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            .request-status.paid {
                color: #5e72e4;
                background: rgba(94, 114, 228, 0.1);
            }

            /* Request Card */
            .request-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
                margin-bottom: 1.5rem;
                overflow: hidden;
            }

            .request-card-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 1.5rem;
            }

            .request-card-body {
                padding: 1.5rem;
            }

            .request-meta {
                display: flex;
                align-items: center;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .request-meta-item {
                margin-right: 2rem;
            }

            .request-meta-item:last-child {
                margin-right: 0;
            }

            .request-meta-label {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-bottom: 0.25rem;
            }

            .request-meta-value {
                font-size: 0.875rem;
                font-weight: 600;
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

            .detail-header .request-date {
                font-size: 0.875rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .detail-header .request-amount {
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

            /* Statistics Cards */
            .stat-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
                padding: 1.5rem;
                height: 100%;
            }

            .stat-card .icon {
                width: 3rem;
                height: 3rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 1rem;
            }

            .stat-card .icon i {
                font-size: 1.5rem;
                color: white;
            }

            .stat-card .title {
                color: #8898aa;
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 0.5rem;
            }

            .stat-card .value {
                color: #32325d;
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }

            .stat-card .description {
                color: #8898aa;
                font-size: 0.875rem;
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
        $('#addRequestModal').off('show.bs.modal');
        $('#addRequestModal').off('hidden.bs.modal');
        $('#inputOffice').off('change');
        $('#inputDivision').off('change');
        $('#inputPettyCash').off('change');
        $('#saveRequestBtn').off('click');
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#pettyCashRequestGrid');
        if (!gridElement.length) {
            console.error('Petty cash request grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#pettyCashRequestGrid').dxDataGrid({
            dataSource: this.pettyCashRequests,
            showBorders: true,
            filterRow: { visible: true },
            searchPanel: { visible: true },
            headerFilter: { visible: true },
            groupPanel: { visible: false },
            columnChooser: { enabled: true },
            columnAutoWidth: true,
            wordWrapEnabled: true,
            height: 'calc(100vh - 350px)',
            width: '100%',
            columns: [
                {
                    dataField: 'RequestNumber',
                    caption: 'Request #',
                    width: 130
                },
                {
                    dataField: 'Office.name',
                    caption: 'Office',
                    width: 150
                },
                {
                    dataField: 'Division.name',
                    caption: 'Division',
                    width: 150
                },
                {
                    dataField: 'Channel.name',
                    caption: 'Channel',
                    width: 150,
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .text(options.value || '-')
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'Amount',
                    caption: 'Amount',
                    dataType: 'number',
                    width: 120,
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    }
                },
                {
                    dataField: 'Purpose',
                    caption: 'Purpose',
                    width: 200
                },
                {
                    dataField: 'TransactionCategory.Name',
                    caption: 'Category',
                    width: 150
                },
                {
                    dataField: 'Status',
                    caption: 'Status',
                    width: 120,
                    cellTemplate: (container, options) => {
                        const status = options.value || 'Pending';
                        $('<div>')
                            .addClass(`request-status ${status.toLowerCase()}`)
                            .text(status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'SettlementStatus',
                    caption: 'Settlement',
                    width: 120,
                    cellTemplate: (container, options) => {
                        const status = options.value || 'Pending';
                        $('<div>')
                            .addClass(`request-status ${status.toLowerCase()}`)
                            .text(status.charAt(0).toUpperCase() + status.slice(1).toLowerCase())
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'CreatedAt',
                    caption: 'Created At',
                    dataType: 'datetime',
                    width: 150,
                    cellTemplate: (container, options) => {
                        const date = options.value ? new Date(options.value) : null;
                        $('<div>')
                            .text(date ? date.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : '-')
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
                            this.showRequestDetails(e.row.data);
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
                autoExpandAll: false,
                template: (container, options) => {
                    this.renderRequestDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Petty_Cash_Requests');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.pettyCashRequests = await pettyCashRequestsAPI.getPettyCashRequests();
            if (this.grid) {
                this.grid.option('dataSource', this.pettyCashRequests);
            }
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading requests:', error);
            DevExpress.ui.notify('Failed to load petty cash requests', 'error', 3000);
        }
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'badge-warning';
            case 'approved':
                return 'badge-success';
            case 'rejected':
                return 'badge-danger';
            case 'paid':
                return 'badge-info';
            default:
                return 'badge-secondary';
        }
    }

    renderRequestDetails(container, data) {
        if (!data) {
            container.text('No data available');
            return;
        }

        const detailContent = $('<div>').addClass('master-detail-container p-4');
        
        // Header with amount and status
        const header = $('<div>').addClass('detail-header mb-4')
            .append($('<div>').addClass('row align-items-center')
                .append($('<div>').addClass('col-md-6')
                    .append($('<h4>').addClass('mb-1 text-white').text(`Request #${data.RequestNumber}`))
                    .append($('<p>').addClass('mb-0 text-white-50')
                        .text(data.CreatedAt ? new Date(data.CreatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : '-')))
                .append($('<div>').addClass('col-md-6 text-md-right')
                    .append($('<h3>').addClass('mb-1 text-white')
                        .text(DevExpress.localization.formatNumber(data.Amount || 0, { 
                            style: 'currency',
                            currency: 'IDR',
                            precision: 2
                        })))
                    .append($('<span>')
                        .addClass(`request-status ${(data.Status || 'pending').toLowerCase()}`)
                        .text(data.Status || 'Pending'))));
        
        detailContent.append(header);

        // Create the main layout with two columns
        const row = $('<div>').addClass('row').appendTo(detailContent);
        
        // Left column - Basic & Financial Info
        const leftCol = $('<div>').addClass('col-lg-6').appendTo(row);
        
        // Right column - Status & Additional Info
        const rightCol = $('<div>').addClass('col-lg-6').appendTo(row);

        // Basic Information Card
        const basicInfo = $('<div>').addClass('info-card mb-4')
            .append($('<div>').addClass('card-header')
                .append($('<h5>').addClass('mb-0').text('Basic Information')))
            .append($('<div>').addClass('card-body')
                .append(this.createInfoRow('Office', data.Office?.name || '-'))
                .append(this.createInfoRow('Division', data.Division?.name || '-'))
                .append(this.createInfoRow('Channel', data.Channel?.name || '-')))
            .appendTo(leftCol);

        // Financial Information Card
        const financialInfo = $('<div>').addClass('info-card mb-4')
            .append($('<div>').addClass('card-header')
                .append($('<h5>').addClass('mb-0').text('Financial Information')))
            .append($('<div>').addClass('card-body')
                .append(this.createInfoRow('Category', data.TransactionCategory?.Name || '-'))
                .append(this.createInfoRow('Purpose', data.Purpose || '-'))
                .append(this.createInfoRow('Payment Method', data.PaymentMethod || '-'))
                .append(this.createInfoRow('Reference Number', data.ReferenceNumber || '-')))
            .appendTo(leftCol);

        // Status Information Card
        const statusInfo = $('<div>').addClass('info-card mb-4')
            .append($('<div>').addClass('card-header')
                .append($('<h5>').addClass('mb-0').text('Status Information')))
            .append($('<div>').addClass('card-body')
                .append(this.createInfoRow('Request Status', data.Status || 'Pending', true))
                .append(this.createInfoRow('Settlement Status', data.SettlementStatus || 'Pending', true))
                .append(this.createInfoRow('Created At', 
                    data.CreatedAt ? new Date(data.CreatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : '-')))
            .appendTo(rightCol);

        // Additional Information Card (if Notes exist)
        if (data.Notes) {
            const additionalInfo = $('<div>').addClass('info-card')
                .append($('<div>').addClass('card-header')
                    .append($('<h5>').addClass('mb-0').text('Additional Information')))
                .append($('<div>').addClass('card-body')
                    .append(this.createInfoRow('Notes', data.Notes)))
                .appendTo(rightCol);
        }

        container.append(detailContent);
    }

    createInfoRow(label, value, isStatus = false) {
        const row = $('<div>').addClass('info-item');
        row.append($('<div>').addClass('label').text(label));
        
        if (isStatus) {
            row.append($('<div>').addClass('value')
                .append($('<span>')
                    .addClass(`request-status ${(value || 'pending').toLowerCase()}`)
                    .text(value)));
        } else {
            row.append($('<div>').addClass('value').text(value));
        }
        
        return row;
    }

    bindEvents() {
        // Modal events
        $('#requestDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const requestId = button.data('request-id');
            if (requestId) {
                this.loadRequestForEdit(requestId);
            }
        });

        $('#requestDetailsModal').on('hide.bs.modal', () => {
            this.currentRequest = null;
            this.clearRequestDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Approve/Reject buttons
        $('#approveRequestBtn').on('click', () => {
            if (this.currentRequest) {
                this.approveRequest(this.currentRequest.id);
            }
        });

        $('#rejectRequestBtn').on('click', () => {
            if (this.currentRequest) {
                $('#rejectRequestModal').modal('show');
            }
        });

        $('#confirmRejectBtn').on('click', () => {
            if (this.currentRequest) {
                const reason = $('#inputRejectionReason').val();
                this.rejectRequest(this.currentRequest.id, reason);
            }
        });

        // Add/Edit request modal events
        $('#addRequestModal').on('show.bs.modal', (e) => {
            const button = $(e.relatedTarget);
            const requestId = button.data('request-id');
            if (requestId) {
                this.loadRequestForEdit(requestId);
            } else {
                this.resetForm();
            }
        });

        $('#addRequestModal').on('hidden.bs.modal', () => {
            this.resetForm();
        });

        // Form field change events
        $('#inputOffice').on('change', () => {
            const officeId = $('#inputOffice').val();
            this.filterDivisionsByOffice(officeId);
        });

        $('#inputDivision').on('change', () => {
            const divisionId = $('#inputDivision').val();
            this.filterChannelsByDivision(divisionId);
        });

        // Save request button
        $('#saveRequestBtn').on('click', () => this.saveRequest());
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        // Load tab content if needed
        if (tab === 'timeline' && this.currentRequest) {
            this.updateTimeline(this.currentRequest);
        } else if (tab === 'attachments' && this.currentRequest) {
            this.loadAttachments(this.currentRequest.id);
        }
    }

    clearRequestDetails() {
        $('#requestOffice, #requestDivision, #requestChannel, #requestEmployee, #requestStatus, #requestAmount, #requestPurpose, #requestPaymentMethod, #requestReferenceNumber, #requestBudgetCode, #requestNotes').text('');
        $('.request-timeline').empty();
        $('#requestAttachments').empty();
    }

    async loadAttachments(requestId) {
        try {
            const attachments = await pettyCashRequestsAPI.getRequestAttachments(requestId);
            const tbody = $('#requestAttachments');
            tbody.empty();

            attachments.forEach(attachment => {
                const row = $('<tr>')
                    .append($('<td>').text(attachment.fileName))
                    .append($('<td>').text(this.formatFileSize(attachment.size)))
                    .append($('<td>').text(new Date(attachment.uploadedAt).toLocaleString()))
                    .append($('<td>').append(
                        $('<div>').addClass('btn-group')
                            .append($('<button>')
                                .addClass('btn btn-sm btn-primary')
                                .html('<i class="fas fa-download"></i>')
                                .on('click', () => this.downloadAttachment(attachment)))
                            .append($('<button>')
                                .addClass('btn btn-sm btn-danger')
                                .html('<i class="fas fa-trash"></i>')
                                .on('click', () => this.deleteAttachment(attachment.id)))
                    ));
                tbody.append(row);
            });
        } catch (error) {
            console.error('Error loading attachments:', error);
            DevExpress.ui.notify('Failed to load attachments', 'error', 3000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async approveRequest(requestId) {
        try {
            await pettyCashRequestsAPI.approvePettyCashRequest(requestId);
            DevExpress.ui.notify('Request approved successfully', 'success', 3000);
            $('#requestDetailsModal').modal('hide');
            this.loadData();
        } catch (error) {
            console.error('Error approving request:', error);
            DevExpress.ui.notify('Failed to approve request', 'error', 3000);
        }
    }

    async rejectRequest(requestId, reason) {
        try {
            await pettyCashRequestsAPI.rejectPettyCashRequest(requestId, reason);
            DevExpress.ui.notify('Request rejected successfully', 'success', 3000);
            $('#rejectRequestModal').modal('hide');
            $('#requestDetailsModal').modal('hide');
            this.loadData();
        } catch (error) {
            console.error('Error rejecting request:', error);
            DevExpress.ui.notify('Failed to reject request', 'error', 3000);
        }
    }

    async loadRequestForEdit(requestId) {
        try {
            const request = await zentra.getPettyCashRequest(requestId);
            this.currentRequest = request;
            this.fillForm(request);
        } catch (error) {
            console.error('Error loading request:', error);
            DevExpress.ui.notify('Failed to load request details', 'error', 3000);
        }
    }

    fillForm(request) {
        $('#addRequestModalLabel').text('Edit Petty Cash Request');
        $('#inputPettyCash').val(request.pettyCashId);
        $('#inputOffice').val(request.pettyCash.officeId);
        this.filterDivisionsByOffice(request.pettyCash.officeId);
        $('#inputDivision').val(request.pettyCash.divisionId);
        this.filterChannelsByDivision(request.pettyCash.divisionId);
        $('#inputChannel').val(request.pettyCash.channelId);
        $('#inputCategory').val(request.categoryId);
        $('#inputAmount').val(request.amount);
        $('#inputPurpose').val(request.purpose);
        $('#inputPaymentMethod').val(request.paymentMethod);
        $('#inputReferenceNumber').val(request.referenceNumber);
        $('#inputBudgetCode').val(request.budgetCode);
        $('#inputNotes').val(request.notes);
    }

    resetForm() {
        $('#addRequestForm')[0].reset();
        this.currentRequest = null;
        $('#addRequestModalLabel').text('New Petty Cash Request');
    }

    filterDivisionsByOffice(officeId) {
        const divisionSelect = $('#inputDivision');
        divisionSelect.empty().append('<option value="">Select Division</option>');
        
        const filteredDivisions = this.divisions.filter(division => 
            division.officeId === parseInt(officeId)
        );
        
        filteredDivisions.forEach(division => {
            divisionSelect.append(`<option value="${division.id}">${division.name}</option>`);
        });
    }

    filterChannelsByDivision(divisionId) {
        const channelSelect = $('#inputChannel');
        channelSelect.empty().append('<option value="">Select Channel</option>');
        
        const filteredChannels = this.channels.filter(channel => 
            channel.divisionId === parseInt(divisionId)
        );
        
        filteredChannels.forEach(channel => {
            channelSelect.append(`<option value="${channel.id}">${channel.name}</option>`);
        });
    }

    updateFormFromBudget(budgetId) {
        const budget = this.pettyCashBudgets.find(b => b.id === parseInt(budgetId));
        if (budget) {
            $('#inputOffice').val(budget.officeId);
            this.filterDivisionsByOffice(budget.officeId);
            $('#inputDivision').val(budget.divisionId);
            this.filterChannelsByDivision(budget.divisionId);
            $('#inputChannel').val(budget.channelId);
        }
    }

    async saveRequest() {
        try {
            const formData = {
                pettyCashId: $('#inputPettyCash').val(),
                amount: parseFloat($('#inputAmount').val()),
                purpose: $('#inputPurpose').val(),
                paymentMethod: $('#inputPaymentMethod').val(),
                referenceNumber: $('#inputReferenceNumber').val(),
                budgetCode: $('#inputBudgetCode').val(),
                notes: $('#inputNotes').val()
            };

            if (!formData.pettyCashId || !formData.amount || !formData.purpose) {
                DevExpress.ui.notify('Please fill in all required fields', 'error', 3000);
                return;
            }

            if (this.currentRequest) {
                await zentra.updatePettyCashRequest(this.currentRequest.id, formData);
                DevExpress.ui.notify('Request updated successfully', 'success', 3000);
            } else {
                await zentra.createPettyCashRequest(formData);
                DevExpress.ui.notify('Request created successfully', 'success', 3000);
            }

            $('#addRequestModal').modal('hide');
            this.loadData();
        } catch (error) {
            console.error('Error saving request:', error);
            DevExpress.ui.notify('Failed to save request', 'error', 3000);
        }
    }

    async deleteRequest(request) {
        const result = await DevExpress.ui.dialog.confirm(
            'Are you sure you want to delete this request?',
            'Delete Request'
        );

        if (result) {
            try {
                await zentra.deletePettyCashRequest(request.id);
                DevExpress.ui.notify('Request deleted successfully', 'success', 3000);
                await this.loadData();
                this.grid.refresh();
                this.updateStatistics();
            } catch (error) {
                console.error('Error deleting request:', error);
                DevExpress.ui.notify('Failed to delete request', 'error', 3000);
            }
        }
    }

    updateStatistics() {
        if (!this.pettyCashRequests || !this.pettyCashRequests.length) {
            $('#totalRequests').text('0');
            $('#approvedRequests').text('0');
            $('#pendingRequests').text('0');
            $('#totalAmount').text('Rp0');
            $('#lastUpdate').text('-');
            return;
        }

        const totalRequests = this.pettyCashRequests.length;
        const approvedRequests = this.pettyCashRequests.filter(request => request.Status?.toLowerCase() === 'approved').length;
        const pendingRequests = this.pettyCashRequests.filter(request => request.Status?.toLowerCase() === 'pending').length;
        const totalAmount = this.pettyCashRequests.reduce((sum, request) => sum + (parseFloat(request.Amount) || 0), 0);
        
        const lastRequest = new Date(Math.max(...this.pettyCashRequests
            .filter(request => request.CreatedAt)
            .map(request => new Date(request.CreatedAt)))).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

        $('#totalRequests').text(totalRequests);
        $('#approvedRequests').text(approvedRequests);
        $('#pendingRequests').text(pendingRequests);
        $('#totalAmount').text(DevExpress.localization.formatNumber(totalAmount, { 
            style: 'currency',
            currency: 'IDR',
            precision: 2
        }));
        $('#lastUpdate').text(lastRequest || '-');
    }

    showRequestDetails(request) {
        this.currentRequest = request;
        $('#requestDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('requestInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateRequestDetails(request);
        }, 150);
    }

    updateRequestDetails(request) {
        if (!request) {
            console.error('No request data provided');
            return;
        }

        // Format dates
        const createdDate = request.CreatedAt ? new Date(request.CreatedAt) : null;
        const formattedCreatedDate = createdDate ? createdDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : '-';

        // Update fields
        $('#requestOffice').text(request.Office?.name || '-');
        $('#requestDivision').text(request.Division?.name || '-');
        $('#requestChannel').text(request.Channel?.name || '-');
        $('#requestEmployee').text(request.Employee?.name || '-');
        $('#requestStatus').html(`
            <span class="request-status ${(request.Status || 'pending').toLowerCase()}">
                ${(request.Status || 'Pending').charAt(0).toUpperCase() + (request.Status || 'Pending').slice(1).toLowerCase()}
            </span>
        `);
        $('#requestAmount').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(request.Amount || 0));
        $('#requestPurpose').text(request.Purpose || '-');
        $('#requestPaymentMethod').text(request.PaymentMethod ? 
            request.PaymentMethod.charAt(0).toUpperCase() + request.PaymentMethod.slice(1).toLowerCase() : 
            '-'
        );
        $('#requestReferenceNumber').text(request.ReferenceNumber || '-');
        $('#requestBudgetCode').text(request.BudgetCode || '-');
        $('#requestNotes').text(request.Notes || '-');
        
        // Update approval buttons visibility based on status
        const status = (request.Status || '').toLowerCase();
        if (status === 'pending') {
            $('#approveRequestBtn, #rejectRequestBtn').show();
        } else {
            $('#approveRequestBtn, #rejectRequestBtn').hide();
        }
        
        // Timeline
        this.updateTimeline(request);
    }

    updateTimeline(request) {
        const $timeline = $('.request-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Request Created',
            `Created by ${request.CreatedBy || 'System'}`,
            request.CreatedAt
        ));

        // Updated if different from created
        if (request.UpdatedAt && request.UpdatedAt !== request.CreatedAt) {
            $timeline.append(this.createTimelineItem(
                'Request Updated',
                `Last updated by ${request.UpdatedBy || 'System'}`,
                request.UpdatedAt
            ));
        }

        // Approved
        if (request.ApprovedAt) {
            $timeline.append(this.createTimelineItem(
                'Request Approved',
                `Approved by ${request.ApprovedBy || 'System'}`,
                request.ApprovedAt
            ));
        }

        // Rejected
        if (request.RejectedAt) {
            $timeline.append(this.createTimelineItem(
                'Request Rejected',
                `Rejected by ${request.RejectedBy || 'System'}${request.RejectionReason ? `: ${request.RejectionReason}` : ''}`,
                request.RejectedAt
            ));
        }

        // Paid
        if (request.PaidAt) {
            $timeline.append(this.createTimelineItem(
                'Request Paid',
                `Payment processed by ${request.PaidBy || 'System'}`,
                request.PaidAt
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
}

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.pettyCashRequestsPageInstance) {
    window.pettyCashRequestsPageInstance = new window.PettyCashRequestsPage();
} 