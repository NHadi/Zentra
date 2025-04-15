package models

import (
	"time"
	"zentra/internal/domain/employee"
	"zentra/internal/domain/order"
)

// TransactionCategory represents the base transaction category model
type TransactionCategory struct {
	ID          int       `gorm:"primaryKey"`
	Code        string    `gorm:"size:50;not null;unique"`
	Name        string    `gorm:"size:100;not null"`
	Type        string    `gorm:"size:20;not null"` // income or expense
	Description string    `gorm:"type:text"`
	IsActive    bool      `gorm:"default:true"`
	TenantID    int       `gorm:"not null"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy   string    `gorm:"size:255;not null"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy   string    `gorm:"size:255;not null"`
}

// TableName specifies the table name for the TransactionCategory model
func (TransactionCategory) TableName() string {
	return "transaction_categories"
}

// CashFlow represents the base cash flow model
type CashFlow struct {
	ID                    int       `gorm:"primaryKey"`
	TransactionDate       time.Time `gorm:"not null"`
	Amount                float64   `gorm:"type:decimal(12,2);not null"`
	Type                  string    `gorm:"column:transaction_type;size:20;not null"` // income or expense
	Description           string    `gorm:"type:text"`
	TransactionCategoryID int       `gorm:"column:category_id;not null"`
	ReferenceNumber       string    `gorm:"size:100"`
	TenantID              int       `gorm:"not null"`
	CreatedAt             time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy             string    `gorm:"size:255;not null"`
	UpdatedAt             time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy             string    `gorm:"size:255;not null"`
}

// TableName specifies the table name for the CashFlow model
func (CashFlow) TableName() string {
	return "cash_flow"
}

// PurchaseOrder represents the base purchase order model
type PurchaseOrder struct {
	ID          int       `gorm:"primaryKey"`
	PONumber    string    `gorm:"size:50;not null;unique"`
	SupplierID  int       `gorm:"not null"`
	OrderDate   time.Time `gorm:"not null"`
	Status      string    `gorm:"size:20;not null;default:'draft'"` // draft, submitted, approved, rejected, completed
	TotalAmount float64   `gorm:"type:decimal(12,2);not null"`
	Notes       string    `gorm:"type:text"`
	TenantID    int       `gorm:"not null"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy   string    `gorm:"size:255;not null"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy   string    `gorm:"size:255;not null"`
}

// TableName specifies the table name for the PurchaseOrder model
func (PurchaseOrder) TableName() string {
	return "purchase_orders"
}

// PurchaseOrderItem represents the base purchase order item model
type PurchaseOrderItem struct {
	ID              int     `gorm:"primaryKey"`
	PurchaseOrderID int     `gorm:"not null"`
	ItemID          int     `gorm:"not null"`
	Quantity        int     `gorm:"not null"`
	UnitPrice       float64 `gorm:"type:decimal(10,2);not null"`
	TotalPrice      float64 `gorm:"type:decimal(12,2);not null"`
	TenantID        int     `gorm:"not null"`
	CreatedAt       time.Time
	CreatedBy       string
	UpdatedAt       time.Time
	UpdatedBy       string
}

// TableName specifies the table name for the PurchaseOrderItem model
func (PurchaseOrderItem) TableName() string {
	return "purchase_order_items"
}

// PettyCash represents the base petty cash model
type PettyCash struct {
	ID               int       `gorm:"primaryKey"`
	OfficeID         int       `gorm:"not null"`
	PeriodStartDate  time.Time `gorm:"not null"`
	PeriodEndDate    time.Time `gorm:"not null"`
	InitialBalance   float64   `gorm:"type:decimal(10,2);not null"`
	CurrentBalance   float64   `gorm:"type:decimal(10,2);not null"`
	ChannelID        *int      `gorm:"column:channel_id"`
	DivisionID       *int      `gorm:"column:division_id"`
	BudgetLimit      *float64  `gorm:"type:decimal(10,2)"`
	BudgetPeriod     *string   `gorm:"size:20"`
	AlertThreshold   *float64  `gorm:"type:decimal(10,2)"`
	Status           string    `gorm:"size:20;not null;default:'active'"`
	BalanceUpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	TenantID         int       `gorm:"not null"`
	CreatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy        string    `gorm:"size:255;not null"`
	UpdatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy        string    `gorm:"size:255;not null"`
}

// TableName specifies the table name for the PettyCash model
func (PettyCash) TableName() string {
	return "petty_cash"
}

// PettyCashRequest represents the base petty cash request model
type PettyCashRequest struct {
	ID                  int        `gorm:"primaryKey"`
	PettyCashID         int        `gorm:"not null"`
	RequestNumber       string     `gorm:"size:50;not null;unique"`
	OfficeID            int        `gorm:"not null"`
	EmployeeID          int        `gorm:"not null"`
	ChannelID           *int       `gorm:"column:channel_id"`
	DivisionID          *int       `gorm:"column:division_id"`
	Amount              float64    `gorm:"type:decimal(10,2);not null"`
	Purpose             string     `gorm:"type:text;not null"`
	CategoryID          int        `gorm:"not null;column:category_id"`
	PaymentMethod       *string    `gorm:"size:20"`
	ReferenceNumber     *string    `gorm:"size:100"`
	BudgetCode          *string    `gorm:"size:50"`
	ReceiptURLs         []string   `gorm:"type:text[]"`
	Status              string     `gorm:"size:20;not null;default:'pending'"`
	SettlementStatus    string     `gorm:"size:20;not null;default:'pending'"`
	SettlementDate      *time.Time `gorm:"type:timestamp with time zone"`
	ReimbursementStatus string     `gorm:"size:20;not null;default:'not_required'"`
	ReimbursementDate   *time.Time `gorm:"type:timestamp with time zone"`
	ApprovedBy          *string    `gorm:"size:255"`
	ApprovedAt          *time.Time `gorm:"type:timestamp with time zone"`
	CompletedAt         *time.Time `gorm:"type:timestamp with time zone"`
	Notes               *string    `gorm:"type:text"`
	RejectionReason     *string    `gorm:"type:text"`
	TenantID            int        `gorm:"not null"`
	CreatedAt           time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy           string     `gorm:"size:255;not null"`
	UpdatedAt           time.Time  `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy           string     `gorm:"size:255;not null"`
}

// TableName specifies the table name for the PettyCashRequest model
func (PettyCashRequest) TableName() string {
	return "petty_cash_requests"
}

// WorkOrder (SPK - Surat Perintah Kerja) represents the base work order model
type WorkOrder struct {
	ID              int               `gorm:"primaryKey"`
	SPKNumber       string            `gorm:"size:50;not null;unique"`
	OrderID         int               `gorm:"not null"`
	Order           order.Order       `gorm:"foreignKey:OrderID"`
	CustomerName    string            `gorm:"size:100;not null"`
	WorkType        string            `gorm:"size:50;not null"` // e.g., production, service, maintenance
	Description     string            `gorm:"type:text;not null"`
	StartDate       time.Time         `gorm:"not null"`
	EndDate         time.Time         `gorm:"not null"`
	Status          string            `gorm:"size:20;not null;default:'draft'"` // draft, in_progress, completed, cancelled
	AssignedTo      int               `gorm:"not null"`                         // Employee ID
	Employee        employee.Employee `gorm:"foreignKey:AssignedTo"`
	EstimatedCost   float64           `gorm:"type:decimal(12,2);not null"`
	ActualCost      float64           `gorm:"type:decimal(12,2)"`
	CompletionNotes string            `gorm:"type:text"`
	TenantID        int               `gorm:"not null"`
	CreatedAt       time.Time         `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy       string            `gorm:"size:255;not null"`
	UpdatedAt       time.Time         `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy       string            `gorm:"size:255;not null"`
}

// TableName specifies the table name for the WorkOrder model
func (WorkOrder) TableName() string {
	return "work_orders"
}

// WorkOrderItem represents the items or materials used in a work order
type WorkOrderItem struct {
	ID          int     `gorm:"primaryKey"`
	WorkOrderID int     `gorm:"not null"`
	ItemID      int     `gorm:"not null"`
	Description string  `gorm:"type:text"`
	Quantity    int     `gorm:"not null"`
	UnitPrice   float64 `gorm:"type:decimal(10,2);not null"`
	TotalPrice  float64 `gorm:"type:decimal(12,2);not null"`
	TenantID    int     `gorm:"not null"`
	CreatedAt   time.Time
	CreatedBy   string
	UpdatedAt   time.Time
	UpdatedBy   string
}

// TableName specifies the table name for the WorkOrderItem model
func (WorkOrderItem) TableName() string {
	return "work_order_items"
}

// WorkOrderTask represents individual tasks within a work order
type WorkOrderTask struct {
	ID          int       `gorm:"primaryKey"`
	WorkOrderID int       `gorm:"not null"`
	TaskName    string    `gorm:"size:100;not null"`
	Description string    `gorm:"type:text"`
	AssignedTo  int       `gorm:"not null"` // Employee ID
	StartDate   time.Time `gorm:"not null"`
	EndDate     time.Time `gorm:"not null"`
	Status      string    `gorm:"size:20;not null;default:'pending'"` // pending, in_progress, completed
	Notes       string    `gorm:"type:text"`
	TenantID    int       `gorm:"not null"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	CreatedBy   string    `gorm:"size:255;not null"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedBy   string    `gorm:"size:255;not null"`
}

// TableName specifies the table name for the WorkOrderTask model
func (WorkOrderTask) TableName() string {
	return "work_order_tasks"
}
