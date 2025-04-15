package payment

import (
	"context"
	"zentra/internal/domain/common"
)

// Payment represents the payments table
type Payment struct {
	ID              int     `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderID         int     `gorm:"index" json:"order_id"`
	Amount          float64 `gorm:"type:decimal(10,2);not null" json:"amount"`
	PaymentMethod   string  `gorm:"type:varchar(50);not null" json:"payment_method"`
	PaymentDate     string  `gorm:"type:timestamp with time zone;not null" json:"payment_date"`
	ReferenceNumber string  `gorm:"type:varchar(100)" json:"reference_number"`
	Status          string  `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, completed, failed, refunded
	Notes           string  `gorm:"type:text" json:"notes"`
	common.TenantModel
}

func (Payment) TableName() string {
	return "payments"
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
}
