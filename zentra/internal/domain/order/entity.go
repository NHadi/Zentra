package order

import (
	"context"
	"zentra/internal/domain/common"
)

// Order represents the orders table
type Order struct {
	ID                   int         `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderNumber          string      `gorm:"type:varchar(50);not null;unique" json:"order_number"`
	CustomerName         string      `gorm:"type:varchar(100);not null" json:"customer_name"`
	CustomerEmail        string      `gorm:"type:varchar(255)" json:"customer_email"`
	CustomerPhone        string      `gorm:"type:varchar(20)" json:"customer_phone"`
	DeliveryAddress      string      `gorm:"type:text" json:"delivery_address"`
	OfficeID             int         `gorm:"index" json:"office_id"`
	Subtotal             float64     `gorm:"type:decimal(12,2);not null;default:0" json:"subtotal"`
	DiscountAmount       float64     `gorm:"type:decimal(12,2);not null;default:0" json:"discount_amount"`
	TotalAmount          float64     `gorm:"type:decimal(12,2);not null;default:0" json:"total_amount"`
	Status               string      `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`        // pending, confirmed, in_production, completed, cancelled
	PaymentStatus        string      `gorm:"type:varchar(20);not null;default:'unpaid'" json:"payment_status"` // unpaid, partial, paid, refunded
	ExpectedDeliveryDate string      `gorm:"type:date" json:"expected_delivery_date"`
	Notes                string      `gorm:"type:text" json:"notes"`
	OrderItems           []OrderItem `gorm:"foreignKey:OrderID" json:"order_items,omitempty"`
	common.TenantModel
}

func (Order) TableName() string {
	return "orders"
}

type Repository interface {
	Create(order *Order, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Order, error)
	FindAll(ctx context.Context) ([]Order, error)
	Update(order *Order, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByCustomerEmail(email string, ctx context.Context) ([]Order, error)
	FindByOrderNumber(orderNumber string, ctx context.Context) (*Order, error)
	FindByStatus(status string, ctx context.Context) ([]Order, error)
	FindByPaymentStatus(status string, ctx context.Context) ([]Order, error)
}
