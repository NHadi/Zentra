package postgres

import (
	"context"
	"time"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type PettyCashRepository struct {
	db *gorm.DB
}

func NewPettyCashRepository(db *gorm.DB) accounting.PettyCashRepository {
	return &PettyCashRepository{db: db}
}

func (r *PettyCashRepository) Create(pettyCash *accounting.PettyCash, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	pettyCash.TenantID = userCtx.TenantID
	pettyCash.CreatedBy = userCtx.Username
	pettyCash.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(pettyCash).Error
}

func (r *PettyCashRepository) FindByID(id int, ctx context.Context) (*accounting.PettyCash, error) {
	var pettyCash accounting.PettyCash
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		First(&pettyCash)
	return &pettyCash, result.Error
}

func (r *PettyCashRepository) FindAll(ctx context.Context) ([]accounting.PettyCash, error) {
	var pettyCashes []accounting.PettyCash
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		Find(&pettyCashes)
	return pettyCashes, result.Error
}

func (r *PettyCashRepository) Update(pettyCash *accounting.PettyCash, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	pettyCash.TenantID = userCtx.TenantID
	pettyCash.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", pettyCash.ID, userCtx.TenantID).
		Updates(pettyCash).Error
}

func (r *PettyCashRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.PettyCash{}).Error
}

func (r *PettyCashRepository) FindByOffice(officeID int, ctx context.Context) (*accounting.PettyCash, error) {
	var pettyCash accounting.PettyCash
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("office_id = ? AND tenant_id = ? AND status = ?", officeID, userCtx.TenantID, "active").
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		First(&pettyCash)
	return &pettyCash, result.Error
}

// GetPettyCashSummary retrieves comprehensive summary statistics for petty cash
func (r *PettyCashRepository) GetPettyCashSummary(ctx context.Context) (*accounting.PettyCashSummary, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	var summary accounting.PettyCashSummary

	// Basic metrics query
	basicMetricsQuery := `
		WITH basic_metrics AS (
			SELECT 
				COALESCE(SUM(CASE WHEN status = 'active' THEN current_balance ELSE 0 END), 0) as total_balance,
				COALESCE(SUM(CASE WHEN status = 'active' THEN budget_limit ELSE 0 END), 0) as total_budget,
				COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests
			FROM petty_cash
			WHERE tenant_id = ?
		),
		expenditure_metrics AS (
			SELECT 
				COALESCE(SUM(amount), 0) as total_expenditure
			FROM petty_cash_requests
			WHERE tenant_id = ? AND status = 'approved'
		)
		SELECT 
			bm.total_balance,
			bm.total_budget,
			bm.pending_requests,
			em.total_expenditure
		FROM basic_metrics bm
		CROSS JOIN expenditure_metrics em;
	`

	var basicMetrics struct {
		TotalBalance     float64
		TotalBudget      float64
		PendingRequests  int
		TotalExpenditure float64
	}

	if err := r.db.Raw(basicMetricsQuery, userCtx.TenantID, userCtx.TenantID).Scan(&basicMetrics).Error; err != nil {
		return nil, err
	}

	// Category breakdown query
	categoryQuery := `
		WITH category_totals AS (
			SELECT 
				pcr.category_id,
				tc.name as category_name,
				SUM(pcr.amount) as total_amount,
				COUNT(*) as request_count
			FROM petty_cash_requests pcr
			JOIN transaction_categories tc ON pcr.category_id = tc.id
			WHERE pcr.tenant_id = ? AND pcr.status = 'approved'
			GROUP BY pcr.category_id, tc.name
		)
		SELECT 
			category_id,
			category_name,
			total_amount as amount,
			(total_amount * 100.0 / NULLIF(SUM(total_amount) OVER(), 0)) as percentage
		FROM category_totals
		ORDER BY total_amount DESC;
	`

	var categoryBreakdown []accounting.CategorySummary
	if err := r.db.Raw(categoryQuery, userCtx.TenantID).Scan(&categoryBreakdown).Error; err != nil {
		return nil, err
	}

	// Monthly trend query
	monthlyTrendQuery := `
		WITH monthly_data AS (
			SELECT 
				DATE_TRUNC('month', created_at) as month,
				SUM(amount) as total_amount,
				COUNT(*) as request_count
			FROM petty_cash_requests
			WHERE tenant_id = ? 
				AND status = 'approved'
				AND created_at >= NOW() - INTERVAL '12 months'
			GROUP BY DATE_TRUNC('month', created_at)
			ORDER BY month DESC
		)
		SELECT 
			TO_CHAR(month, 'YYYY-MM') as month,
			total_amount as amount,
			request_count as requests
		FROM monthly_data;
	`

	var monthlyExpenditures []accounting.MonthlyExpenditure
	if err := r.db.Raw(monthlyTrendQuery, userCtx.TenantID).Scan(&monthlyExpenditures).Error; err != nil {
		return nil, err
	}

	// Top expenses query
	topExpensesQuery := `
		SELECT 
			pcr.request_number,
			pcr.amount,
			pcr.purpose,
			tc.name as category_name,
			TO_CHAR(pcr.created_at, 'YYYY-MM-DD') as date,
			me.name as employee_name
		FROM petty_cash_requests pcr
		JOIN transaction_categories tc ON pcr.category_id = tc.id
		JOIN master_employee me ON pcr.employee_id = me.id
		WHERE pcr.tenant_id = ? AND pcr.status = 'approved'
		ORDER BY pcr.amount DESC
		LIMIT 5;
	`

	var topExpenses []accounting.TopExpense
	if err := r.db.Raw(topExpensesQuery, userCtx.TenantID).Scan(&topExpenses).Error; err != nil {
		return nil, err
	}

	// Recent transactions query
	recentTxQuery := `
		SELECT 
			pcr.id,
			pcr.request_number,
			pcr.amount,
			pcr.purpose,
			pcr.status,
			TO_CHAR(pcr.created_at, 'YYYY-MM-DD') as date,
			me.name as employee_name
		FROM petty_cash_requests pcr
		JOIN master_employee me ON pcr.employee_id = me.id
		WHERE pcr.tenant_id = ?
		ORDER BY pcr.created_at DESC
		LIMIT 10;
	`

	var recentTransactions []accounting.RecentTransaction
	if err := r.db.Raw(recentTxQuery, userCtx.TenantID).Scan(&recentTransactions).Error; err != nil {
		return nil, err
	}

	// Trend analysis query
	trendQuery := `
		WITH time_ranges AS (
			SELECT
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN amount ELSE 0 END) as daily_total,
				COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as daily_count,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as weekly_total,
				COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as weekly_count,
				SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as monthly_total,
				COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as monthly_count
			FROM petty_cash_requests
			WHERE tenant_id = ? AND status = 'approved'
		),
		current_vs_last AS (
			SELECT
				SUM(CASE 
					WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) 
					THEN amount ELSE 0 END) as current_month,
				SUM(CASE 
					WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
					THEN amount ELSE 0 END) as last_month
			FROM petty_cash_requests
			WHERE tenant_id = ? AND status = 'approved'
		)
		SELECT
			COALESCE(daily_total / NULLIF(daily_count, 0), 0) as daily_average,
			COALESCE(weekly_total / NULLIF(weekly_count, 0), 0) as weekly_average,
			COALESCE(monthly_total / NULLIF(monthly_count, 0), 0) as monthly_average,
			CASE 
				WHEN last_month = 0 THEN 0
				ELSE ((current_month - last_month) / last_month) * 100 
			END as growth_rate
		FROM time_ranges, current_vs_last;
	`

	var trendAnalysis accounting.TrendAnalysis
	if err := r.db.Raw(trendQuery, userCtx.TenantID, userCtx.TenantID).Scan(&trendAnalysis).Error; err != nil {
		return nil, err
	}

	// Weekly trend query
	weeklyTrendQuery := `
		SELECT 
			TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week_start,
			TO_CHAR(DATE_TRUNC('week', created_at) + INTERVAL '6 days', 'YYYY-MM-DD') as week_end,
			SUM(amount) as total_amount,
			COUNT(*) as request_count
		FROM petty_cash_requests
		WHERE tenant_id = ? 
			AND status = 'approved'
			AND created_at >= NOW() - INTERVAL '12 weeks'
		GROUP BY DATE_TRUNC('week', created_at)
		ORDER BY week_start DESC
		LIMIT 12;
	`

	var weeklyTrend []accounting.WeeklyExpenditures
	if err := r.db.Raw(weeklyTrendQuery, userCtx.TenantID).Scan(&weeklyTrend).Error; err != nil {
		return nil, err
	}

	// Category trend query
	categoryTrendQuery := `
		WITH category_trends AS (
			SELECT 
				pcr.category_id,
				tc.name as category_name,
				SUM(CASE 
					WHEN DATE_TRUNC('month', pcr.created_at) = DATE_TRUNC('month', NOW()) 
					THEN pcr.amount ELSE 0 END) as this_month,
				SUM(CASE 
					WHEN DATE_TRUNC('month', pcr.created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') 
					THEN pcr.amount ELSE 0 END) as last_month
			FROM petty_cash_requests pcr
			JOIN transaction_categories tc ON pcr.category_id = tc.id
			WHERE pcr.tenant_id = ? AND pcr.status = 'approved'
			GROUP BY pcr.category_id, tc.name
		)
		SELECT 
			category_id,
			category_name,
			last_month,
			this_month,
			CASE 
				WHEN last_month = 0 THEN 0
				ELSE ((this_month - last_month) / last_month) * 100 
			END as growth_rate
		FROM category_trends
		WHERE last_month > 0 OR this_month > 0
		ORDER BY this_month DESC;
	`

	var categoryTrend []accounting.CategoryTrendMetrics
	if err := r.db.Raw(categoryTrendQuery, userCtx.TenantID).Scan(&categoryTrend).Error; err != nil {
		return nil, err
	}

	// Assemble the final summary
	summary = accounting.PettyCashSummary{
		TotalBalance:        basicMetrics.TotalBalance,
		TotalExpenditure:    basicMetrics.TotalExpenditure,
		PendingRequests:     basicMetrics.PendingRequests,
		CategoryBreakdown:   categoryBreakdown,
		MonthlyExpenditures: monthlyExpenditures,
		TopExpenses:         topExpenses,
		RecentTransactions:  recentTransactions,
		BudgetUtilization: accounting.BudgetUtilization{
			TotalBudget:      basicMetrics.TotalBudget,
			UsedBudget:       basicMetrics.TotalExpenditure,
			RemainingBudget:  basicMetrics.TotalBudget - basicMetrics.TotalExpenditure,
			UtilizationRate:  calculateUtilizationRate(basicMetrics.TotalExpenditure, basicMetrics.TotalBudget),
			DaysUntilRefresh: daysUntilNextMonth(),
		},
		TrendAnalysis: accounting.TrendAnalysis{
			DailyAverage:   trendAnalysis.DailyAverage,
			WeeklyAverage:  trendAnalysis.WeeklyAverage,
			MonthlyAverage: trendAnalysis.MonthlyAverage,
			GrowthRate:     trendAnalysis.GrowthRate,
			WeeklyTrend:    weeklyTrend,
			CategoryTrend:  categoryTrend,
		},
	}

	return &summary, nil
}

func calculateUtilizationRate(used, total float64) float64 {
	if total == 0 {
		return 0
	}
	return (used / total) * 100
}

func daysUntilNextMonth() int {
	now := time.Now()
	nextMonth := now.AddDate(0, 1, 0)
	firstOfNextMonth := time.Date(nextMonth.Year(), nextMonth.Month(), 1, 0, 0, 0, 0, now.Location())
	return int(firstOfNextMonth.Sub(now).Hours() / 24)
}
