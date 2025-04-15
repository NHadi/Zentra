package accounting

// PettyCashSummary represents the complete summary of petty cash operations
type PettyCashSummary struct {
	TotalBalance        float64              `json:"total_balance" gorm:"column:total_balance"`
	TotalExpenditure    float64              `json:"total_expenditure" gorm:"column:total_expenditure"`
	PendingRequests     int                  `json:"pending_requests" gorm:"column:pending_requests"`
	CategoryBreakdown   []CategorySummary    `json:"category_breakdown" gorm:"-"`
	MonthlyExpenditures []MonthlyExpenditure `json:"monthly_expenditures" gorm:"-"`
	TopExpenses         []TopExpense         `json:"top_expenses" gorm:"-"`
	RecentTransactions  []RecentTransaction  `json:"recent_transactions" gorm:"-"`
	BudgetUtilization   BudgetUtilization    `json:"budget_utilization" gorm:"-"`
	TrendAnalysis       TrendAnalysis        `json:"trend_analysis" gorm:"-"`
}

// CategorySummary represents the breakdown of expenses by category
type CategorySummary struct {
	CategoryID   int     `json:"category_id" gorm:"column:category_id"`
	CategoryName string  `json:"category_name" gorm:"column:category_name"`
	Amount       float64 `json:"amount" gorm:"column:amount"`
	Percentage   float64 `json:"percentage" gorm:"column:percentage"`
}

// MonthlyExpenditure represents monthly spending data
type MonthlyExpenditure struct {
	Month    string  `json:"month" gorm:"column:month"` // YYYY-MM format
	Amount   float64 `json:"amount" gorm:"column:amount"`
	Requests int     `json:"requests" gorm:"column:requests"`
}

// TopExpense represents a high-value expense
type TopExpense struct {
	RequestNumber string  `json:"request_number" gorm:"column:request_number"`
	Amount        float64 `json:"amount" gorm:"column:amount"`
	Purpose       string  `json:"purpose" gorm:"column:purpose"`
	CategoryName  string  `json:"category_name" gorm:"column:category_name"`
	Date          string  `json:"date" gorm:"column:date"`
	EmployeeName  string  `json:"employee_name" gorm:"column:employee_name"`
}

// RecentTransaction represents a recent petty cash transaction
type RecentTransaction struct {
	ID            int     `json:"id" gorm:"column:id"`
	RequestNumber string  `json:"request_number" gorm:"column:request_number"`
	Amount        float64 `json:"amount" gorm:"column:amount"`
	Purpose       string  `json:"purpose" gorm:"column:purpose"`
	Status        string  `json:"status" gorm:"column:status"`
	Date          string  `json:"date" gorm:"column:date"`
	EmployeeName  string  `json:"employee_name" gorm:"column:employee_name"`
}

// BudgetUtilization represents budget usage metrics
type BudgetUtilization struct {
	TotalBudget      float64 `json:"total_budget" gorm:"column:total_budget"`
	UsedBudget       float64 `json:"used_budget" gorm:"column:used_budget"`
	RemainingBudget  float64 `json:"remaining_budget" gorm:"column:remaining_budget"`
	UtilizationRate  float64 `json:"utilization_rate" gorm:"column:utilization_rate"`
	DaysUntilRefresh int     `json:"days_until_refresh" gorm:"column:days_until_refresh"`
}

// TrendAnalysis represents spending trend metrics
type TrendAnalysis struct {
	DailyAverage   float64                `json:"daily_average" gorm:"column:daily_average"`
	WeeklyAverage  float64                `json:"weekly_average" gorm:"column:weekly_average"`
	MonthlyAverage float64                `json:"monthly_average" gorm:"column:monthly_average"`
	GrowthRate     float64                `json:"growth_rate" gorm:"column:growth_rate"`
	WeeklyTrend    []WeeklyExpenditures   `json:"weekly_trend" gorm:"-"`
	CategoryTrend  []CategoryTrendMetrics `json:"category_trend" gorm:"-"`
}

// WeeklyExpenditures represents weekly spending data
type WeeklyExpenditures struct {
	WeekStart    string  `json:"week_start" gorm:"column:week_start"`
	WeekEnd      string  `json:"week_end" gorm:"column:week_end"`
	TotalAmount  float64 `json:"total_amount" gorm:"column:total_amount"`
	RequestCount int     `json:"request_count" gorm:"column:request_count"`
}

// CategoryTrendMetrics represents category-wise spending trends
type CategoryTrendMetrics struct {
	CategoryID   int     `json:"category_id" gorm:"column:category_id"`
	CategoryName string  `json:"category_name" gorm:"column:category_name"`
	LastMonth    float64 `json:"last_month" gorm:"column:last_month"`
	ThisMonth    float64 `json:"this_month" gorm:"column:this_month"`
	GrowthRate   float64 `json:"growth_rate" gorm:"column:growth_rate"`
}
