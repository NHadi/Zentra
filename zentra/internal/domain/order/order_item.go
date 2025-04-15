package order

import (
	"context"
	"encoding/json"
	"zentra/internal/domain/common"
	"zentra/internal/domain/product"
	"zentra/internal/domain/task"
)

// OrderItem represents the order_items table
type OrderItem struct {
	ID                  int              `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderID             int              `gorm:"index" json:"order_id"`
	ProductID           int              `gorm:"index" json:"product_id"`
	Quantity            int              `gorm:"not null" json:"quantity"`
	Size                string           `gorm:"type:varchar(10);not null" json:"size"`
	Color               string           `gorm:"type:varchar(50);not null" json:"color"`
	UnitPrice           float64          `gorm:"type:decimal(10,2);not null" json:"unit_price"`
	OriginalSubtotal    float64          `gorm:"type:decimal(10,2);not null" json:"original_subtotal"`
	AppliedDiscountRule json.RawMessage  `gorm:"type:jsonb" json:"applied_discount_rule"`
	DiscountAmount      float64          `gorm:"type:decimal(10,2);default:0" json:"discount_amount"`
	FinalSubtotal       float64          `gorm:"type:decimal(10,2);not null" json:"final_subtotal"`
	Customization       json.RawMessage  `gorm:"type:jsonb;not null;default:'{}'" json:"customization"`
	CurrentTask         string           `gorm:"type:varchar(20);not null;default:'layout'" json:"current_task"`
	ProductionStatus    string           `gorm:"type:varchar(20);not null;default:'pending'" json:"production_status"`
	Tasks               []task.Task      `gorm:"foreignKey:OrderItemID" json:"tasks,omitempty"`
	Product             *product.Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	common.TenantModel
}

func (OrderItem) TableName() string {
	return "order_items"
}

type OrderItemRepository interface {
	Create(item *OrderItem, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*OrderItem, error)
	FindByOrderID(orderID int, ctx context.Context) ([]OrderItem, error)
	Update(item *OrderItem, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
