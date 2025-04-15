import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define CashFlowPage
window.CashFlowPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.transactions = [];
        this.currentTransaction = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Transaction Amount */
            .transaction-amount {
                font-weight: 600;
            }

            .transaction-amount.income {
                color: #2dce89;
            }

            .transaction-amount.expense {
                color: #fb6340;
            }

            /* Transaction Type Badge */
            .transaction-type {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .transaction-type.income {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .transaction-type.expense {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            /* Reference Number */
            .reference-number {
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

            .detail-header .transaction-date {
                font-size: 0.875rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .detail-header .transaction-amount {
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

            .transaction-meta {
                display: flex;
                align-items: center;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .transaction-meta-item {
                margin-right: 2rem;
            }

            .transaction-meta-item:last-child {
                margin-right: 0;
            }

            .transaction-meta-label {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-bottom: 0.25rem;
            }

            .transaction-meta-value {
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
        $('#transactionDetailsModal').off('show.bs.modal');
        $('#transactionDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#transactionDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const transactionId = button.data('transaction-id');
            if (transactionId) {
                this.loadTransactionDetails(transactionId);
            }
        });

        $('#transactionDetailsModal').on('hide.bs.modal', () => {
            this.currentTransaction = null;
            this.clearTransactionDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });

        // Save button event
        $('#saveTransactionBtn').on('click', () => {
            this.saveTransaction();
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#cashFlowGrid');
        if (!gridElement.length) {
            console.error('Cash flow grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#cashFlowGrid').dxDataGrid({
            dataSource: this.transactions,
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
                    dataField: 'transaction_date',
                    caption: 'Date',
                    dataType: 'date',
                    format: 'dd/MM/yyyy',
                    width: 120,
                    sortIndex: 0,
                    sortOrder: 'desc'
                },
                {
                    dataField: 'amount',
                    caption: 'Amount',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    },
                    cellTemplate: (container, options) => {
                        const amount = options.value;
                        const type = amount >= 0 ? 'income' : 'expense';
                        $('<div>')
                            .addClass(`transaction-amount ${type}`)
                            .text(new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0
                            }).format(amount))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'type',
                    caption: 'Type',
                    width: 120,
                    cellTemplate: (container, options) => {
                        const type = options.value;
                        $('<div>')
                            .addClass(`transaction-type ${type}`)
                            .text(type.charAt(0).toUpperCase() + type.slice(1))
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'transaction_category.name',
                    caption: 'Category',
                    width: 150,
                    cellTemplate: (container, options) => {
                        if (options.value) {
                            $('<div>')
                                .addClass('badge badge-secondary')
                                .text(options.value)
                                .appendTo(container);
                        } else {
                            container.text('-');
                        }
                    }
                },
                {
                    dataField: 'description',
                    caption: 'Description',
                    width: 250
                },
                {
                    dataField: 'reference_number',
                    caption: 'Reference',
                    width: 150,
                    cellTemplate: (container, options) => {
                        if (options.value) {
                            $('<div>')
                                .addClass('reference-number')
                                .text(options.value)
                                .appendTo(container);
                        } else {
                            container.text('-');
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
                            this.showTransactionDetails(e.row.data);
                        }
                    }, {
                        hint: 'Edit',
                        icon: 'fas fa-edit',
                        onClick: (e) => {
                            this.editTransaction(e.row.data);
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
                    this.renderTransactionDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Cash_Flow_Transactions');
                    this.exportButtonsAdded = true;
                }
            },
            summary: {
                totalItems: [{
                    column: 'amount',
                    summaryType: 'sum',
                    valueFormat: {
                        type: 'fixedPoint',
                        precision: 2
                    },
                    customizeText: (data) => {
                        return new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                        }).format(data.value);
                    }
                }],
                groupItems: [{
                    column: 'amount',
                    summaryType: 'sum',
                    valueFormat: {
                        type: 'fixedPoint',
                        precision: 2
                    },
                    customizeText: (data) => {
                        return new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                        }).format(data.value);
                    }
                }]
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.transactions = await zentra.getCashFlows();
            this.grid.option('dataSource', this.transactions);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading transactions:', error);
            DevExpress.ui.notify('Failed to load transactions', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalIncome = this.transactions
            .filter(t => t.amount >= 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = this.transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        const netBalance = totalIncome - totalExpenses;
        
        const lastTransaction = this.transactions.length > 0 ? 
            new Date(Math.max(...this.transactions.map(t => new Date(t.transaction_date)))).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        $('#totalIncome').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(totalIncome));
        
        $('#totalExpenses').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(totalExpenses));
        
        $('#netBalance').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(netBalance));
        
        $('#lastTransaction').text(lastTransaction);
    }

    showTransactionDetails(transaction) {
        this.currentTransaction = transaction;
        $('#transactionDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('transactionInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateTransactionDetails(transaction);
        }, 150);
    }

    updateTransactionDetails(transaction) {
        // Format date
        const date = new Date(transaction.transaction_date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Determine type
        const type = transaction.type || (transaction.amount >= 0 ? 'income' : 'expense');
        const typeClass = type === 'income' ? 'success' : 'danger';

        // Update fields
        $('#transactionDate').text(formattedDate);
        $('#transactionAmount').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(transaction.amount));
        $('#transactionType').html(`
            <span class="badge badge-${typeClass}">
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
        `);
        $('#transactionDescription').text(transaction.description);
        $('#transactionReference').text(transaction.reference_number || '-');
        $('#transactionCategory').text(transaction.transaction_category?.name || '-');
        
        // Timeline
        this.updateTimeline(transaction);
    }

    updateTimeline(transaction) {
        const $timeline = $('.transaction-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Transaction Created',
            `Created by ${transaction.created_by}`,
            transaction.created_at
        ));

        // Updated if different from created
        if (transaction.updated_at !== transaction.created_at) {
            $timeline.append(this.createTimelineItem(
                'Transaction Updated',
                `Last updated by ${transaction.updated_by}`,
                transaction.updated_at
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

    clearTransactionDetails() {
        $('#transactionDate, #transactionAmount, #transactionType, #transactionDescription, #transactionReference, #transactionCategory').text('');
        $('.transaction-timeline').empty();
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        // Load tab content if needed
        if (tab === 'timeline' && this.currentTransaction) {
            this.updateTimeline(this.currentTransaction);
        }
    }

    editTransaction(transaction) {
        this.currentTransaction = transaction;
        $('#addTransactionModalLabel').text('Edit Transaction');
        
        // Fill form fields
        $('#input-date').val(transaction.transaction_date.split('T')[0]);
        $('#input-amount').val(Math.abs(transaction.amount));
        $('#input-type').val(transaction.type);
        $('#input-description').val(transaction.description);
        $('#input-reference').val(transaction.reference_number);
        $('#input-category').val(transaction.transaction_category?.id);
        
        $('#addTransactionModal').modal('show');
    }

    renderTransactionDetails(container, transaction) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Header Section with amount and meta info
        const $header = $('<div>')
            .addClass('detail-header')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('transaction-date')
                            .text(new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }))
                    )
                    .append(
                        $('<div>')
                            .addClass('transaction-amount')
                            .text(new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR'
                            }).format(transaction.amount))
                    )
            )
            .append(
                $('<div>')
                    .addClass('transaction-meta')
                    .append(
                        $('<div>')
                            .addClass('transaction-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('transaction-meta-label')
                                    .text('Category')
                            )
                            .append(
                                $('<div>')
                                    .addClass('transaction-meta-value')
                                    .text(transaction.transaction_category?.name || '-')
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('transaction-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('transaction-meta-label')
                                    .text('Reference')
                            )
                            .append(
                                $('<div>')
                                    .addClass('transaction-meta-value')
                                    .text(transaction.reference_number || '-')
                            )
                    )
            )
            .appendTo($detailContent);

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row mt-4').appendTo($detailContent);
        
        // Left column - Transaction Details
        const $leftCol = $('<div>').addClass('col-lg-7').appendTo($row);
        
        // Right column - Additional Info
        const $rightCol = $('<div>').addClass('col-lg-5').appendTo($row);

        // Transaction Details Card
        const $transactionInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Transaction Details'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Description'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(transaction.description)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Category Code'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .append(
                                        $('<span>')
                                            .addClass('badge badge-secondary')
                                            .text(transaction.transaction_category?.code || '-')
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
                                    .text(transaction.created_by || '-')
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Created At'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(transaction.created_at ? 
                                        new Date(transaction.created_at).toLocaleString('en-US', {
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
                                    .text(transaction.updated_at ? 
                                        new Date(transaction.updated_at).toLocaleString('en-US', {
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
if (typeof DevExpress !== 'undefined' && !window.cashFlowPageInstance) {
    window.cashFlowPageInstance = new window.CashFlowPage();
} 