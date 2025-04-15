import { zentra } from '../api/index.js';
import { gridUtils } from '../utils/gridUtils.js';

// Define PettyCashPage
window.PettyCashPage = class {
    constructor() {
        this.grid = null;
        this.exportButtonsAdded = false;
        this.pettyCashBudgets = [];
        this.currentBudget = null;
        
        // Initialize components
        if (typeof DevExpress !== 'undefined') {
            this.initialize();
        }
        
        // Bind event handlers
        this.bindEvents();

        // Add styles
        $('<style>')
        .text(`
            /* Budget Status Badge */
            .budget-status {
                display: inline-flex;
                align-items: center;
                padding: 0.25rem 0.75rem;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .budget-status.active {
                color: #2dce89;
                background: rgba(45, 206, 137, 0.1);
            }

            .budget-status.inactive {
                color: #f5365c;
                background: rgba(245, 54, 92, 0.1);
            }

            .budget-status.pending {
                color: #fb6340;
                background: rgba(251, 99, 64, 0.1);
            }

            /* Budget Card */
            .budget-card {
                background: white;
                border-radius: 0.375rem;
                box-shadow: 0 0 2rem 0 rgba(136, 152, 170, 0.15);
                margin-bottom: 1.5rem;
                overflow: hidden;
            }

            .budget-card-header {
                background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%);
                color: white;
                padding: 1.5rem;
            }

            .budget-card-body {
                padding: 1.5rem;
            }

            .budget-progress {
                height: 0.5rem;
                border-radius: 0.25rem;
                background-color: #e9ecef;
                margin-bottom: 1rem;
            }

            .budget-progress-bar {
                height: 100%;
                border-radius: 0.25rem;
                background: linear-gradient(87deg, #2dce89 0, #2dcecc 100%);
                transition: width 0.3s ease;
            }

            .budget-meta {
                display: flex;
                align-items: center;
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .budget-meta-item {
                margin-right: 2rem;
            }

            .budget-meta-item:last-child {
                margin-right: 0;
            }

            .budget-meta-label {
                font-size: 0.75rem;
                opacity: 0.8;
                margin-bottom: 0.25rem;
            }

            .budget-meta-value {
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

            .detail-header .budget-date {
                font-size: 0.875rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .detail-header .budget-amount {
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
        $('#budgetDetailsModal').off('show.bs.modal');
        $('#budgetDetailsModal').off('hide.bs.modal');
        $('.nav-tabs .nav-link').off('click');
    }

    bindEvents() {
        // Modal events
        $('#budgetDetailsModal').on('show.bs.modal', (event) => {
            const button = $(event.relatedTarget);
            const budgetId = button.data('budget-id');
            if (budgetId) {
                this.loadBudgetDetails(budgetId);
            }
        });

        $('#budgetDetailsModal').on('hide.bs.modal', () => {
            this.currentBudget = null;
            this.clearBudgetDetails();
        });

        // Tab switching
        $('.nav-tabs .nav-link').on('click', (e) => {
            e.preventDefault();
            const tab = $(e.currentTarget).data('tab');
            this.switchTab(tab);
        });
    }

    initialize() {
        this.initializeGrid();
        this.loadData();
        this.updateStatistics();
    }

    initializeGrid() {
        const gridElement = $('#pettyCashGrid');
        if (!gridElement.length) {
            console.error('Petty cash grid element not found');
            return;
        }

        if (this.grid) {
            this.grid.dispose();
        }

        this.grid = $('#pettyCashGrid').dxDataGrid({
            dataSource: this.pettyCashBudgets,
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
                    dataField: 'Office.name',
                    caption: 'Office'
                },
                {
                    dataField: 'Division.name',
                    caption: 'Division'
                },
                {
                    dataField: 'Channel.name',
                    caption: 'Channel',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .text(options.value || '-')
                            .appendTo(container);
                    }
                },
                {
                    dataField: 'InitialBalance',
                    caption: 'Initial Balance',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    }
                },
                {
                    dataField: 'CurrentBalance',
                    caption: 'Current Balance',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    }
                },
                {
                    dataField: 'BudgetLimit',
                    caption: 'Budget Limit',
                    dataType: 'number',
                    format: {
                        type: 'fixedPoint',
                        precision: 2
                    }
                },
                {
                    dataField: 'Status',
                    caption: 'Status',
                    cellTemplate: (container, options) => {
                        $('<div>')
                            .addClass(`budget-status ${options.value}`)
                            .text(options.value.charAt(0).toUpperCase() + options.value.slice(1))
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
                            this.showBudgetDetails(e.row.data);
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
                    this.renderBudgetDetails(container, options.data);
                }
            },
            onContentReady: (e) => {
                if (this.grid && !this.exportButtonsAdded) {
                    gridUtils.addExportButtons(this.grid, 'Petty_Cash_Budgets');
                    this.exportButtonsAdded = true;
                }
            }
        }).dxDataGrid('instance');
    }

    async loadData() {
        try {
            this.pettyCashBudgets = await zentra.getPettyCashBudgets();
            this.grid.option('dataSource', this.pettyCashBudgets);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading budgets:', error);
            DevExpress.ui.notify('Failed to load budgets', 'error', 3000);
        }
    }

    updateStatistics() {
        const totalBudgets = this.pettyCashBudgets.length;
        const totalAmount = this.pettyCashBudgets.reduce((sum, budget) => sum + budget.InitialBalance, 0);
        const activeBudgets = this.pettyCashBudgets.filter(budget => budget.Status === 'active').length;
        
        const lastBudget = this.pettyCashBudgets.length > 0 ? 
            new Date(Math.max(...this.pettyCashBudgets.map(budget => new Date(budget.CreatedAt)))).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : '-';

        $('#totalBudget').text(totalBudgets);
        $('#totalBalance').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(totalAmount));
        $('#activeBudgets').text(activeBudgets);
        $('#lastUpdate').text(lastBudget);
    }

    showBudgetDetails(budget) {
        this.currentBudget = budget;
        $('#budgetDetailsModal').modal('show');
        
        // Reset tabs to first tab
        this.switchTab('budgetInfo');
        
        // Update content after small delay to ensure modal is visible
        setTimeout(() => {
            this.updateBudgetDetails(budget);
        }, 150);
    }

    updateBudgetDetails(budget) {
        // Format dates
        const startDate = new Date(budget.PeriodStartDate);
        const endDate = new Date(budget.PeriodEndDate);
        const formattedStartDate = startDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedEndDate = endDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Calculate budget usage percentage
        const usagePercentage = ((budget.InitialBalance - budget.CurrentBalance) / budget.InitialBalance) * 100;

        // Update fields
        $('#budgetOffice').text(budget.Office.name);
        $('#budgetDivision').text(budget.Division.name);
        $('#budgetChannel').text(budget.Channel ? budget.Channel.name : '-');
        $('#budgetPeriod').text(`${formattedStartDate} - ${formattedEndDate}`);
        $('#budgetStatus').html(`
            <span class="budget-status ${budget.Status}">
                ${budget.Status.charAt(0).toUpperCase() + budget.Status.slice(1)}
            </span>
        `);
        $('#budgetInitialBalance').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(budget.InitialBalance));
        $('#budgetCurrentBalance').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(budget.CurrentBalance));
        $('#budgetLimit').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(budget.BudgetLimit));
        $('#budgetAlertThreshold').text(new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(budget.AlertThreshold));

        // Update progress bar
        $('.budget-progress-bar').css('width', `${usagePercentage}%`);
        
        // Timeline
        this.updateTimeline(budget);
    }

    updateTimeline(budget) {
        const $timeline = $('.budget-timeline');
        $timeline.empty();

        // Created
        $timeline.append(this.createTimelineItem(
            'Budget Created',
            `Created by ${budget.CreatedBy}`,
            budget.CreatedAt
        ));

        // Updated if different from created
        if (budget.UpdatedAt !== budget.CreatedAt) {
            $timeline.append(this.createTimelineItem(
                'Budget Updated',
                `Last updated by ${budget.UpdatedBy}`,
                budget.UpdatedAt
            ));
        }

        // Balance updated
        if (budget.BalanceUpdatedAt) {
            $timeline.append(this.createTimelineItem(
                'Balance Updated',
                `Current balance: ${new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(budget.CurrentBalance)}`,
                budget.BalanceUpdatedAt
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

    clearBudgetDetails() {
        $('#budgetOffice, #budgetDivision, #budgetChannel, #budgetPeriod, #budgetStatus, #budgetInitialBalance, #budgetCurrentBalance, #budgetLimit, #budgetAlertThreshold').text('');
        $('.budget-timeline').empty();
    }

    switchTab(tab) {
        // Remove active class from all tabs and panes
        $('.nav-tabs .nav-link').removeClass('active');
        $('.tab-pane').removeClass('show active');
        
        // Add active class to selected tab and pane
        $(`.nav-tabs .nav-link[data-tab="${tab}"]`).addClass('active');
        $(`#${tab}`).addClass('show active');

        // Load tab content if needed
        if (tab === 'timeline' && this.currentBudget) {
            this.updateTimeline(this.currentBudget);
        }
    }

    renderBudgetDetails(container, budget) {
        const $detailContent = $('<div>').addClass('master-detail-container p-4');

        // Header Section with amount and meta info
        const $header = $('<div>')
            .addClass('detail-header')
            .append(
                $('<div>')
                    .addClass('d-flex flex-column')
                    .append(
                        $('<div>')
                            .addClass('budget-date')
                            .text(new Date(budget.CreatedAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }))
                    )
                    .append(
                        $('<div>')
                            .addClass('budget-amount')
                            .text(new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(budget.InitialBalance))
                    )
            )
            .append(
                $('<div>')
                    .addClass('budget-meta')
                    .append(
                        $('<div>')
                            .addClass('budget-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('budget-meta-label')
                                    .text('Status')
                            )
                            .append(
                                $('<div>')
                                    .addClass('budget-meta-value')
                                    .append(
                                        $('<span>')
                                            .addClass(`budget-status ${budget.Status}`)
                                            .text(budget.Status.charAt(0).toUpperCase() + budget.Status.slice(1))
                                    )
                            )
                    )
                    .append(
                        $('<div>')
                            .addClass('budget-meta-item')
                            .append(
                                $('<div>')
                                    .addClass('budget-meta-label')
                                    .text('Office')
                            )
                            .append(
                                $('<div>')
                                    .addClass('budget-meta-value')
                                    .text(budget.Office.name)
                            )
                    )
            )
            .appendTo($detailContent);

        // Create the main layout with two columns
        const $row = $('<div>').addClass('row mt-4').appendTo($detailContent);
        
        // Left column - Budget Details
        const $leftCol = $('<div>').addClass('col-lg-7').appendTo($row);
        
        // Right column - Additional Info
        const $rightCol = $('<div>').addClass('col-lg-5').appendTo($row);

        // Budget Details Card
        const $budgetInfo = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Budget Details'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Division'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(budget.Division.name)
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Channel'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(budget.Channel ? budget.Channel.name : '-')
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Period'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(`${new Date(budget.PeriodStartDate).toLocaleDateString()} - ${new Date(budget.PeriodEndDate).toLocaleDateString()}`)
                            )
                    )
            )
            .appendTo($leftCol);

        // Budget Usage Card
        const $usageCard = $('<div>')
            .addClass('info-card')
            .append(
                $('<div>')
                    .addClass('card-header')
                    .append($('<h5>').text('Budget Usage'))
            )
            .append(
                $('<div>')
                    .addClass('card-body')
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Initial Balance'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }).format(budget.InitialBalance))
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Current Balance'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }).format(budget.CurrentBalance))
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Budget Limit'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }).format(budget.BudgetLimit))
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Alert Threshold'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }).format(budget.AlertThreshold))
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Usage'))
                            .append(
                                $('<div>')
                                    .addClass('budget-progress')
                                    .append(
                                        $('<div>')
                                            .addClass('budget-progress-bar')
                                            .css('width', `${((budget.InitialBalance - budget.CurrentBalance) / budget.InitialBalance) * 100}%`)
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
                                    .text(budget.CreatedBy || '-')
                            )
                    )
                    .append(
                        $('<div>').addClass('info-item')
                            .append($('<div>').addClass('label').text('Created At'))
                            .append(
                                $('<div>')
                                    .addClass('value')
                                    .text(budget.CreatedAt ? 
                                        new Date(budget.CreatedAt).toLocaleString('en-US', {
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
                                    .text(budget.UpdatedAt ? 
                                        new Date(budget.UpdatedAt).toLocaleString('en-US', {
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
if (typeof DevExpress !== 'undefined' && !window.pettyCashPageInstance) {
    window.pettyCashPageInstance = new window.PettyCashPage();
} 