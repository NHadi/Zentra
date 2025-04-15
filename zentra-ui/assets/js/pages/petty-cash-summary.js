import { zentra } from '../api/index.js';

// Define PettyCashSummaryPage
window.PettyCashSummaryPage = class {
    constructor() {
        this.initialize();
    }

    dispose() {
        // Clean up any event listeners or resources if needed
    }

    initialize() {
        this.loadData();
    }

    async loadData() {
        try {
            const summary = await zentra.getPettyCashSummary();
            this.updateUI(summary);
        } catch (error) {
            console.error('Error loading petty cash summary:', error);
            DevExpress.ui.notify('Failed to load petty cash summary', 'error', 3000);
        }
    }

    updateUI(summary) {
        // Update statistics cards
        $('#totalBalance').text(this.formatCurrency(summary.total_balance));
        $('#totalExpenditure').text(this.formatCurrency(summary.total_expenditure));
        $('#pendingRequests').text(summary.pending_requests);
        $('#daysUntilRefresh').text(summary.budget_utilization.days_until_refresh);

        // Update budget utilization
        $('#totalBudget').text(this.formatCurrency(summary.budget_utilization.total_budget));
        $('#usedBudget').text(this.formatCurrency(summary.budget_utilization.used_budget));
        $('#remainingBudget').text(this.formatCurrency(summary.budget_utilization.remaining_budget));
        $('#utilizationRate').text(`${summary.budget_utilization.utilization_rate}%`);
        
        // Update progress bar
        const utilizationRate = summary.budget_utilization.utilization_rate;
        $('#budgetProgress').css('width', `${utilizationRate}%`).attr('aria-valuenow', utilizationRate);
        $('#progressPercentage').text(`${utilizationRate}%`);

        // Update trend analysis
        $('#dailyAverage').text(this.formatCurrency(summary.trend_analysis.daily_average));
        $('#weeklyAverage').text(this.formatCurrency(summary.trend_analysis.weekly_average));
        $('#monthlyAverage').text(this.formatCurrency(summary.trend_analysis.monthly_average));
        $('#growthRate').text(`${summary.trend_analysis.growth_rate}%`);

        // Update recent transactions
        this.updateRecentTransactions(summary.recent_transactions);
    }

    updateRecentTransactions(transactions) {
        const $tbody = $('#recentTransactions');
        $tbody.empty();

        transactions.forEach(transaction => {
            const statusClass = this.getStatusClass(transaction.status);
            const formattedDate = new Date(transaction.date).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            $tbody.append(`
                <tr>
                    <td>${transaction.request_number}</td>
                    <td>${formattedDate}</td>
                    <td>${transaction.employee_name}</td>
                    <td>${transaction.purpose}</td>
                    <td>${this.formatCurrency(transaction.amount)}</td>
                    <td>
                        <span class="badge badge-${statusClass}">
                            ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                    </td>
                </tr>
            `);
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    getStatusClass(status) {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'secondary';
        }
    }
};

// Initialize only if DevExpress is loaded
if (typeof DevExpress !== 'undefined' && !window.pettyCashSummaryPageInstance) {
    window.pettyCashSummaryPageInstance = new window.PettyCashSummaryPage();
} 