package accounting

import (
	"context"
	"zentra/internal/domain/channel"
	"zentra/internal/domain/division"
	"zentra/internal/domain/models"
	"zentra/internal/domain/office"
)

// TransactionCategory represents the transaction category domain model
type TransactionCategory struct {
	models.TransactionCategory
}

// CashFlow represents the cash flow domain model
type CashFlow struct {
	models.CashFlow
}

// PurchaseOrder represents the purchase order domain model
type PurchaseOrder struct {
	models.PurchaseOrder
	Items []PurchaseOrderItem
}

// PurchaseOrderItem represents the purchase order item domain model
type PurchaseOrderItem struct {
	models.PurchaseOrderItem
}

// PettyCash represents the petty cash domain model
type PettyCash struct {
	models.PettyCash
	Office   *office.Office
	Division *division.Division
	Channel  *channel.Channel
}

// PettyCashRequest represents the petty cash request domain model
type PettyCashRequest struct {
	models.PettyCashRequest
	Office              *office.Office       `gorm:"foreignKey:OfficeID"`
	Division            *division.Division   `gorm:"foreignKey:DivisionID"`
	Channel             *channel.Channel     `gorm:"foreignKey:ChannelID"`
	TransactionCategory *TransactionCategory `gorm:"foreignKey:CategoryID"`
}

// WorkOrder represents the work order (SPK) domain model
type WorkOrder struct {
	models.WorkOrder
	Items []WorkOrderItem
	Tasks []WorkOrderTask
}

// WorkOrderItem represents the work order item domain model
type WorkOrderItem struct {
	models.WorkOrderItem
}

// WorkOrderTask represents the work order task domain model
type WorkOrderTask struct {
	models.WorkOrderTask
}

// TransactionCategoryRepository defines the interface for transaction category persistence operations
type TransactionCategoryRepository interface {
	Create(category *TransactionCategory, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*TransactionCategory, error)
	FindAll(ctx context.Context) ([]TransactionCategory, error)
	Update(category *TransactionCategory, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByCode(code string, ctx context.Context) (*TransactionCategory, error)
}

// CashFlowRepository defines the interface for cash flow persistence operations
type CashFlowRepository interface {
	Create(cashFlow *CashFlow, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*CashFlow, error)
	FindAll(ctx context.Context) ([]CashFlow, error)
	Update(cashFlow *CashFlow, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByDateRange(startDate, endDate string, ctx context.Context) ([]CashFlow, error)
}

// PurchaseOrderRepository defines the interface for purchase order persistence operations
type PurchaseOrderRepository interface {
	Create(order *PurchaseOrder, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*PurchaseOrder, error)
	FindAll(ctx context.Context) ([]PurchaseOrder, error)
	Update(order *PurchaseOrder, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByNumber(poNumber string, ctx context.Context) (*PurchaseOrder, error)
}

// PettyCashRepository defines the interface for petty cash persistence operations
type PettyCashRepository interface {
	Create(pettyCash *PettyCash, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*PettyCash, error)
	FindAll(ctx context.Context) ([]PettyCash, error)
	Update(pettyCash *PettyCash, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByOffice(officeID int, ctx context.Context) (*PettyCash, error)
	GetPettyCashSummary(ctx context.Context) (*PettyCashSummary, error)
}

// PettyCashRequestRepository defines the interface for petty cash request persistence operations
type PettyCashRequestRepository interface {
	Create(request *PettyCashRequest, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*PettyCashRequest, error)
	FindAll(ctx context.Context) ([]PettyCashRequest, error)
	Update(request *PettyCashRequest, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByStatus(status string, ctx context.Context) ([]PettyCashRequest, error)
	FindByNumber(requestNumber string, ctx context.Context) (*PettyCashRequest, error)
}

// WorkOrderRepository defines the interface for work order (SPK) persistence operations
type WorkOrderRepository interface {
	Create(workOrder *WorkOrder, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*WorkOrder, error)
	FindAll(ctx context.Context) ([]WorkOrder, error)
	Update(workOrder *WorkOrder, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByNumber(spkNumber string, ctx context.Context) (*WorkOrder, error)
	FindByStatus(status string, ctx context.Context) ([]WorkOrder, error)
	FindByDateRange(startDate, endDate string, ctx context.Context) ([]WorkOrder, error)
}
