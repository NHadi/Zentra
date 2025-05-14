package payment

import (
	"context"
	"zentra/internal/domain/common"
)

const (
	StatusPending   = "pending"
	StatusCompleted = "completed"
	StatusFailed    = "failed"
	StatusRefunded  = "refunded"
)

// Payment represents the payments table
type Payment struct {
	ID              int       `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderID         int       `gorm:"index" json:"order_id"`
	Amount          float64   `gorm:"type:decimal(10,2);not null" json:"amount"`
	PaymentMethod   string    `gorm:"type:varchar(50);not null" json:"payment_method"`
	PaymentDate     string    `gorm:"type:timestamp with time zone;not null" json:"payment_date"`
	ReferenceNumber string    `gorm:"type:varchar(100)" json:"reference_number"`
	Status          string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	Notes           string    `gorm:"type:text" json:"notes"`
	CashFlow        *CashFlow `gorm:"foreignKey:PaymentID" json:"cash_flow,omitempty"`
	common.TenantModel
}

// CashFlow represents the cash_flow entry for a payment
type CashFlow struct {
	ID              int     `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	TransactionDate string  `gorm:"type:timestamp with time zone;not null" json:"transaction_date"`
	TransactionType string  `gorm:"type:varchar(20);not null" json:"transaction_type"`
	CategoryID      int     `gorm:"not null" json:"category_id"`
	Amount          float64 `gorm:"type:decimal(12,2);not null" json:"amount"`
	Description     string  `gorm:"type:text" json:"description"`
	ReferenceNumber string  `gorm:"type:varchar(50)" json:"reference_number"`
	ReferenceType   string  `gorm:"type:varchar(50)" json:"reference_type"`
	ReferenceID     int     `json:"reference_id"`
	PaymentID       int     `gorm:"index" json:"payment_id"`
	OfficeID        int     `json:"office_id"`
	Status          string  `gorm:"type:varchar(20);default:'pending'" json:"status"`
	common.TenantModel
}

func (Payment) TableName() string {
	return "payments"
}

func (CashFlow) TableName() string {
	return "cash_flow"
}

type Repository interface {
	Create(payment *Payment, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Payment, error)
	FindAll(ctx context.Context) ([]Payment, error)
	Update(payment *Payment, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByOrderID(orderID int, ctx context.Context) ([]Payment, error)
	FindByReferenceNumber(referenceNumber string, ctx context.Context) (*Payment, error)
	FindByStatus(status string, ctx context.Context) ([]Payment, error)
	CreateCashFlow(cashFlow *CashFlow, ctx context.Context) error
	UpdateCashFlowStatus(paymentID int, status string, ctx context.Context) error
}
