package handlers

import (
	"net/http"
	"strconv"
	"time"
	"zentra/internal/application"
	"zentra/internal/domain/accounting"

	"github.com/gin-gonic/gin"
)

// CashFlowResponse represents the cash flow response structure
// @Description Cash flow response model
type CashFlowResponse struct {
	ID                  int                         `json:"id" example:"1"`
	Amount              float64                     `json:"amount" example:"1000.00"`
	Type                string                      `json:"type" example:"income"`
	Description         string                      `json:"description" example:"Sales revenue"`
	TransactionDate     string                      `json:"transaction_date" example:"2024-04-01T00:00:00Z"`
	ReferenceNumber     string                      `json:"reference_number" example:"TRX-2024-001"`
	TransactionCategory TransactionCategoryResponse `json:"transaction_category"`
	CreatedAt           string                      `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy           string                      `json:"created_by" example:"admin"`
	UpdatedAt           string                      `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy           string                      `json:"updated_by" example:"admin"`
}

// RejectPettyCashRequest represents the request structure for rejecting a petty cash request
// @Description Reject petty cash request model
type RejectPettyCashModelRequest struct {
	Reason string `json:"reason" binding:"required" example:"Insufficient documentation"`
}

// PurchaseOrderResponse represents the enhanced purchase order response structure
type PurchaseOrderResponse struct {
	ID          int                         `json:"id"`
	PONumber    string                      `json:"po_number"`
	OrderDate   string                      `json:"order_date"`
	Status      string                      `json:"status"`
	TotalAmount float64                     `json:"total_amount"`
	Notes       string                      `json:"notes"`
	Supplier    SupplierResponse            `json:"supplier"`
	Items       []PurchaseOrderItemResponse `json:"items"`
	CreatedAt   string                      `json:"created_at"`
	CreatedBy   string                      `json:"created_by"`
	UpdatedAt   string                      `json:"updated_at"`
	UpdatedBy   string                      `json:"updated_by"`
}

// PurchaseOrderItemResponse represents the purchase order item in the response
type PurchaseOrderItemResponse struct {
	ID         int          `json:"id"`
	Item       ItemResponse `json:"item"`
	Quantity   int          `json:"quantity"`
	UnitPrice  float64      `json:"unit_price"`
	TotalPrice float64      `json:"total_price"`
}

// UnifiedPettyCashResponse represents the combined response for petty cash and requests
type UnifiedPettyCashResponse struct {
	PettyCash PettyCashDetailResponse    `json:"petty_cash"`
	Requests  []PettyCashRequestResponse `json:"requests"`
}

// PettyCashOfficeInfo represents the office information in petty cash response
type PettyCashOfficeInfo struct {
	ID      int    `json:"id" example:"1"`
	Name    string `json:"name" example:"Main Office"`
	Code    string `json:"code" example:"OFF-001"`
	Address string `json:"address" example:"123 Main St"`
	Phone   string `json:"phone" example:"+1234567890"`
	Email   string `json:"email" example:"main@office.com"`
}

// PettyCashDivisionInfo represents the division information in petty cash response
type PettyCashDivisionInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"ADMIN"`
	Description string `json:"description" example:"Administration department"`
}

// PettyCashChannelInfo represents the channel information in petty cash response
type PettyCashChannelInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"Retail"`
	Code        string `json:"code" example:"RTL"`
	Description string `json:"description" example:"Retail channel"`
}

// PettyCashDetailResponse represents the enhanced petty cash response structure
type PettyCashDetailResponse struct {
	ID               int                    `json:"id"`
	OfficeID         int                    `json:"office_id"`
	Office           *PettyCashOfficeInfo   `json:"office,omitempty"`
	PeriodStartDate  string                 `json:"period_start_date"`
	PeriodEndDate    string                 `json:"period_end_date"`
	InitialBalance   float64                `json:"initial_balance"`
	CurrentBalance   float64                `json:"current_balance"`
	ChannelID        *int                   `json:"channel_id,omitempty"`
	Channel          *PettyCashChannelInfo  `json:"channel,omitempty"`
	DivisionID       *int                   `json:"division_id,omitempty"`
	Division         *PettyCashDivisionInfo `json:"division,omitempty"`
	BudgetLimit      *float64               `json:"budget_limit,omitempty"`
	BudgetPeriod     *string                `json:"budget_period,omitempty"`
	AlertThreshold   *float64               `json:"alert_threshold,omitempty"`
	Status           string                 `json:"status"`
	BalanceUpdatedAt string                 `json:"balance_updated_at"`
	CreatedAt        string                 `json:"created_at"`
	CreatedBy        string                 `json:"created_by"`
	UpdatedAt        string                 `json:"updated_at"`
	UpdatedBy        string                 `json:"updated_by"`
}

// PettyCashRequestResponse represents the enhanced petty cash request response structure
type PettyCashRequestResponse struct {
	ID                  int                          `json:"id"`
	PettyCashID         int                          `json:"petty_cash_id"`
	RequestNumber       string                       `json:"request_number"`
	OfficeID            int                          `json:"office_id"`
	Office              *PettyCashOfficeInfo         `json:"office,omitempty"`
	EmployeeID          int                          `json:"employee_id"`
	ChannelID           *int                         `json:"channel_id,omitempty"`
	Channel             *PettyCashChannelInfo        `json:"channel,omitempty"`
	DivisionID          *int                         `json:"division_id,omitempty"`
	Division            *PettyCashDivisionInfo       `json:"division,omitempty"`
	Amount              float64                      `json:"amount"`
	Purpose             string                       `json:"purpose"`
	CategoryID          int                          `json:"category_id"`
	TransactionCategory *TransactionCategoryResponse `json:"transaction_category,omitempty"`
	PaymentMethod       *string                      `json:"payment_method,omitempty"`
	ReferenceNumber     *string                      `json:"reference_number,omitempty"`
	BudgetCode          *string                      `json:"budget_code,omitempty"`
	ReceiptURLs         []string                     `json:"receipt_urls,omitempty"`
	Status              string                       `json:"status"`
	SettlementStatus    string                       `json:"settlement_status"`
	SettlementDate      *string                      `json:"settlement_date,omitempty"`
	ReimbursementStatus string                       `json:"reimbursement_status"`
	ReimbursementDate   *string                      `json:"reimbursement_date,omitempty"`
	ApprovedBy          *string                      `json:"approved_by,omitempty"`
	ApprovedAt          *string                      `json:"approved_at,omitempty"`
	CompletedAt         *string                      `json:"completed_at,omitempty"`
	Notes               *string                      `json:"notes,omitempty"`
	CreatedAt           string                       `json:"created_at"`
	CreatedBy           string                       `json:"created_by"`
	UpdatedAt           string                       `json:"updated_at"`
	UpdatedBy           string                       `json:"updated_by"`
}

// PettyCashSummaryResponse represents the summary response structure
type PettyCashSummaryResponse struct {
	TotalBalance        float64              `json:"total_balance"`
	TotalExpenditure    float64              `json:"total_expenditure"`
	PendingRequests     int                  `json:"pending_requests"`
	CategoryBreakdown   []CategorySummary    `json:"category_breakdown"`
	MonthlyExpenditures []MonthlyExpenditure `json:"monthly_expenditures"`
	TopExpenses         []TopExpense         `json:"top_expenses"`
	RecentTransactions  []RecentTransaction  `json:"recent_transactions"`
	BudgetUtilization   BudgetUtilization    `json:"budget_utilization"`
	TrendAnalysis       TrendAnalysis        `json:"trend_analysis"`
}

type CategorySummary struct {
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Amount       float64 `json:"amount"`
	Percentage   float64 `json:"percentage"`
}

type MonthlyExpenditure struct {
	Month    string  `json:"month"` // YYYY-MM format
	Amount   float64 `json:"amount"`
	Requests int     `json:"requests"`
}

type TopExpense struct {
	RequestNumber string  `json:"request_number"`
	Amount        float64 `json:"amount"`
	Purpose       string  `json:"purpose"`
	CategoryName  string  `json:"category_name"`
	Date          string  `json:"date"`
	EmployeeName  string  `json:"employee_name"`
}

type RecentTransaction struct {
	ID            int     `json:"id"`
	RequestNumber string  `json:"request_number"`
	Amount        float64 `json:"amount"`
	Purpose       string  `json:"purpose"`
	Status        string  `json:"status"`
	Date          string  `json:"date"`
	EmployeeName  string  `json:"employee_name"`
}

type BudgetUtilization struct {
	TotalBudget      float64 `json:"total_budget"`
	UsedBudget       float64 `json:"used_budget"`
	RemainingBudget  float64 `json:"remaining_budget"`
	UtilizationRate  float64 `json:"utilization_rate"`
	DaysUntilRefresh int     `json:"days_until_refresh"`
}

type TrendAnalysis struct {
	DailyAverage   float64                `json:"daily_average"`
	WeeklyAverage  float64                `json:"weekly_average"`
	MonthlyAverage float64                `json:"monthly_average"`
	GrowthRate     float64                `json:"growth_rate"`
	WeeklyTrend    []WeeklyExpenditures   `json:"weekly_trend"`
	CategoryTrend  []CategoryTrendMetrics `json:"category_trend"`
}

type WeeklyExpenditures struct {
	WeekStart    string  `json:"week_start"`
	WeekEnd      string  `json:"week_end"`
	TotalAmount  float64 `json:"total_amount"`
	RequestCount int     `json:"request_count"`
}

type CategoryTrendMetrics struct {
	CategoryID   int     `json:"category_id"`
	CategoryName string  `json:"category_name"`
	LastMonth    float64 `json:"last_month"`
	ThisMonth    float64 `json:"this_month"`
	GrowthRate   float64 `json:"growth_rate"`
}

// PettyCashExpenditureResponse represents the expenditure list response
type PettyCashExpenditureResponse struct {
	Expenditures []ExpenditureDetail `json:"expenditures"`
	Summary      ExpenditureSummary  `json:"summary"`
}

type ExpenditureDetail struct {
	ID            int      `json:"id"`
	RequestNumber string   `json:"request_number"`
	Date          string   `json:"date"`
	Amount        float64  `json:"amount"`
	Purpose       string   `json:"purpose"`
	CategoryName  string   `json:"category_name"`
	PaymentMethod *string  `json:"payment_method,omitempty"`
	Status        string   `json:"status"`
	ReceiptURLs   []string `json:"receipt_urls,omitempty"`
	EmployeeName  string   `json:"employee_name"`
}

type ExpenditureSummary struct {
	TotalAmount       float64 `json:"total_amount"`
	TotalTransactions int     `json:"total_transactions"`
	AverageAmount     float64 `json:"average_amount"`
}

// @Summary Create a new cash flow record
// @Description Create a new cash flow record with the provided details
// @Tags CashFlow
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param cashFlow body accounting.CashFlow true "Cash Flow Data"
// @Success 201 {object} CashFlowResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /cash-flows [post]
func CreateCashFlow(service *application.CashFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cashFlow accounting.CashFlow
		if err := c.ShouldBindJSON(&cashFlow); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Create(&cashFlow, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, cashFlow)
	}
}

// @Summary Get a cash flow record by ID
// @Description Get cash flow details by ID
// @Tags CashFlow
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Cash Flow ID"
// @Success 200 {object} CashFlowResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Cash flow record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /cash-flows/{id} [get]
func GetCashFlow(service *application.CashFlowService, categoryService *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		cashFlow, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Cash flow record not found"})
			return
		}

		category, err := categoryService.FindByID(cashFlow.TransactionCategoryID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toCashFlowResponse(cashFlow, category))
	}
}

// @Summary Get all cash flow records
// @Description Get all cash flow records
// @Tags CashFlow
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} CashFlowResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /cash-flows [get]
func GetAllCashFlows(service *application.CashFlowService, categoryService *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		cashFlows, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]CashFlowResponse, len(cashFlows))
		for i, cf := range cashFlows {
			category, err := categoryService.FindByID(cf.TransactionCategoryID, c)
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
				return
			}
			response[i] = toCashFlowResponse(&cf, category)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a cash flow record
// @Description Update an existing cash flow record with new details
// @Tags CashFlow
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Cash Flow ID"
// @Param cashFlow body accounting.CashFlow true "Cash Flow Data"
// @Success 200 {object} CashFlowResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Cash flow record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /cash-flows/{id} [put]
func UpdateCashFlow(service *application.CashFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var cashFlow accounting.CashFlow
		if err := c.ShouldBindJSON(&cashFlow); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		cashFlow.ID = id
		if err := service.Update(&cashFlow, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, cashFlow)
	}
}

// @Summary Delete a cash flow record
// @Description Delete an existing cash flow record
// @Tags CashFlow
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Cash Flow ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Cash flow record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /cash-flows/{id} [delete]
func DeleteCashFlow(service *application.CashFlowService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Cash flow record deleted successfully"})
	}
}

// Similar handlers for PurchaseOrder, PettyCash, and PettyCashRequest...

// @Summary Create a new purchase order
// @Description Create a new purchase order with the provided details
// @Tags PurchaseOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param order body accounting.PurchaseOrder true "Purchase Order Data"
// @Success 201 {object} accounting.PurchaseOrder
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /purchase-orders [post]
func CreatePurchaseOrder(service *application.PurchaseOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var order accounting.PurchaseOrder
		if err := c.ShouldBindJSON(&order); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Create(&order, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, order)
	}
}

// @Summary Get a purchase order by ID
// @Description Get purchase order details by ID
// @Tags PurchaseOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Purchase Order ID"
// @Success 200 {object} accounting.PurchaseOrder
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Purchase order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /purchase-orders/{id} [get]
func GetPurchaseOrder(service *application.PurchaseOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		order, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Purchase order not found"})
			return
		}

		c.JSON(http.StatusOK, order)
	}
}

// @Summary Get all purchase orders
// @Description Get all purchase orders with supplier and item details
// @Tags PurchaseOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} PurchaseOrderResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /purchase-orders [get]
func GetAllPurchaseOrders(service *application.PurchaseOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get all purchase orders
		purchaseOrders, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Convert to response format
		response := make([]PurchaseOrderResponse, len(purchaseOrders))
		for i, po := range purchaseOrders {
			// Get supplier details
			supplier, err := service.GetSupplier(po.SupplierID, c)
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
				return
			}

			// Convert items
			items := make([]PurchaseOrderItemResponse, len(po.Items))
			for j, item := range po.Items {
				// Get item details
				itemDetails, err := service.GetItem(item.ItemID, c)
				if err != nil {
					c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
					return
				}

				items[j] = PurchaseOrderItemResponse{
					ID: item.ID,
					Item: ItemResponse{
						ID:          itemDetails.ID,
						Code:        itemDetails.Code,
						Name:        itemDetails.Name,
						Description: itemDetails.Description,
						Unit:        itemDetails.Unit,
					},
					Quantity:   item.Quantity,
					UnitPrice:  item.UnitPrice,
					TotalPrice: item.TotalPrice,
				}
			}

			response[i] = PurchaseOrderResponse{
				ID:          po.ID,
				PONumber:    po.PONumber,
				OrderDate:   po.OrderDate.Format(time.RFC3339),
				Status:      po.Status,
				TotalAmount: po.TotalAmount,
				Notes:       po.Notes,
				Supplier: SupplierResponse{
					ID:            supplier.ID,
					Code:          supplier.Code,
					Name:          supplier.Name,
					ContactPerson: supplier.ContactPerson,
					Phone:         supplier.Phone,
					Email:         supplier.Email,
				},
				Items:     items,
				CreatedAt: po.CreatedAt.Format(time.RFC3339),
				CreatedBy: po.CreatedBy,
				UpdatedAt: po.UpdatedAt.Format(time.RFC3339),
				UpdatedBy: po.UpdatedBy,
			}
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a purchase order
// @Description Update an existing purchase order with new details
// @Tags PurchaseOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Purchase Order ID"
// @Param order body accounting.PurchaseOrder true "Purchase Order Data"
// @Success 200 {object} accounting.PurchaseOrder
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Purchase order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /purchase-orders/{id} [put]
func UpdatePurchaseOrder(service *application.PurchaseOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var order accounting.PurchaseOrder
		if err := c.ShouldBindJSON(&order); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		order.ID = id
		if err := service.Update(&order, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, order)
	}
}

// @Summary Delete a purchase order
// @Description Delete an existing purchase order
// @Tags PurchaseOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Purchase Order ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Purchase order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /purchase-orders/{id} [delete]
func DeletePurchaseOrder(service *application.PurchaseOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Purchase order deleted successfully"})
	}
}

// @Summary Create a new petty cash record
// @Description Create a new petty cash record with the provided details
// @Tags PettyCash
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param pettyCash body accounting.PettyCash true "Petty Cash Data"
// @Success 201 {object} accounting.PettyCash
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash [post]
func CreatePettyCash(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pettyCash accounting.PettyCash
		if err := c.ShouldBindJSON(&pettyCash); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Create(&pettyCash, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, pettyCash)
	}
}

// @Summary Get a petty cash record by ID
// @Description Get petty cash details by ID
// @Tags PettyCash
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash ID"
// @Success 200 {object} accounting.PettyCash
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash/{id} [get]
func GetPettyCash(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		pettyCash, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Petty cash record not found"})
			return
		}

		c.JSON(http.StatusOK, pettyCash)
	}
}

// @Summary Get all petty cash records
// @Description Get all petty cash records
// @Tags PettyCash
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} accounting.PettyCash
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash [get]
func GetAllPettyCash(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		pettyCashes, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, pettyCashes)
	}
}

// @Summary Update a petty cash record
// @Description Update an existing petty cash record with new details
// @Tags PettyCash
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash ID"
// @Param pettyCash body accounting.PettyCash true "Petty Cash Data"
// @Success 200 {object} accounting.PettyCash
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash/{id} [put]
func UpdatePettyCash(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var pettyCash accounting.PettyCash
		if err := c.ShouldBindJSON(&pettyCash); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		pettyCash.ID = id
		if err := service.Update(&pettyCash, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, pettyCash)
	}
}

// @Summary Delete a petty cash record
// @Description Delete an existing petty cash record
// @Tags PettyCash
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash record not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash/{id} [delete]
func DeletePettyCash(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Petty cash record deleted successfully"})
	}
}

// @Summary Create a new petty cash request
// @Description Create a new petty cash request with the provided details
// @Tags PettyCashRequest
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param request body accounting.PettyCashRequest true "Petty Cash Request Data"
// @Success 201 {object} accounting.PettyCashRequest
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests [post]
func CreatePettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request accounting.PettyCashRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Create(&request, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, request)
	}
}

// @Summary Get a petty cash request by ID
// @Description Get petty cash request details by ID
// @Tags PettyCashRequest
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash Request ID"
// @Success 200 {object} accounting.PettyCashRequest
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash request not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests/{id} [get]
func GetPettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		request, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Petty cash request not found"})
			return
		}

		c.JSON(http.StatusOK, request)
	}
}

// @Summary Get all petty cash requests
// @Description Get all petty cash requests
// @Tags PettyCashRequest
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} accounting.PettyCashRequest
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests [get]
func GetAllPettyCashRequests(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		requests, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, requests)
	}
}

// @Summary Update a petty cash request
// @Description Update an existing petty cash request with new details
// @Tags PettyCashRequest
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash Request ID"
// @Param request body accounting.PettyCashRequest true "Petty Cash Request Data"
// @Success 200 {object} accounting.PettyCashRequest
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash request not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests/{id} [put]
func UpdatePettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var request accounting.PettyCashRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		request.ID = id
		if err := service.Update(&request, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, request)
	}
}

// @Summary Delete a petty cash request
// @Description Delete an existing petty cash request
// @Tags PettyCashRequest
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash Request ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash request not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests/{id} [delete]
func DeletePettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Petty cash request deleted successfully"})
	}
}

// @Summary Approve a petty cash request
// @Description Approve an existing petty cash request
// @Tags PettyCashRequest
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash Request ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash request not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests/{id}/approve [post]
func ApprovePettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		if err := service.Approve(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Petty cash request approved successfully"})
	}
}

// @Summary Reject a petty cash request
// @Description Reject an existing petty cash request
// @Tags PettyCashRequest
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Petty Cash Request ID"
// @Param request body RejectPettyCashModelRequest true "Rejection Reason"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Petty cash request not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash-requests/{id}/reject [post]
func RejectPettyCashRequest(service *application.PettyCashRequestService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid ID format"})
			return
		}

		var request RejectPettyCashModelRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Reject(id, request.Reason, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Petty cash request rejected successfully"})
	}
}

// @Summary Get detailed petty cash summary
// @Description Get comprehensive summary and analytics for petty cash management
// @Tags PettyCash
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {object} accounting.PettyCashSummary
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /petty-cash/summary [get]
func GetPettyCashSummary(service *application.PettyCashService) gin.HandlerFunc {
	return func(c *gin.Context) {
		summary, err := service.GetSummary(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, summary)
	}
}

func toCashFlowResponse(cf *accounting.CashFlow, category *accounting.TransactionCategory) CashFlowResponse {
	return CashFlowResponse{
		ID:                  cf.ID,
		Amount:              cf.Amount,
		Type:                cf.Type,
		Description:         cf.Description,
		TransactionDate:     cf.TransactionDate.Format(time.RFC3339),
		ReferenceNumber:     cf.ReferenceNumber,
		TransactionCategory: toTransactionCategoryResponse(category),
		CreatedAt:           cf.CreatedAt.String(),
		CreatedBy:           cf.CreatedBy,
		UpdatedAt:           cf.UpdatedAt.String(),
		UpdatedBy:           cf.UpdatedBy,
	}
}
