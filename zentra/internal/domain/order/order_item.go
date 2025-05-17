package order

import (
	"context"
	"encoding/json"
	"time"
	"zentra/internal/domain/common"
	"zentra/internal/domain/employee"
	"zentra/internal/domain/product"
)

// OrderItem represents the order_items table
type OrderItem struct {
	ID                  int              `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderID             int              `gorm:"index" json:"order_id"`
	Order               *Order           `gorm:"foreignKey:OrderID" json:"order,omitempty"`
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
	Tasks               []OrderItemTask  `gorm:"foreignKey:OrderItemID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"tasks,omitempty"`
	Product             *product.Product `gorm:"foreignKey:ProductID" json:"product,omitempty"`
	common.TenantModel
}

// OrderItemTask represents a task associated with an order item
type OrderItemTask struct {
	ID             int                `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderItemID    int                `gorm:"index" json:"order_item_id"`
	TaskType       string             `gorm:"type:varchar(20);not null" json:"task_type"`
	SequenceNumber int                `gorm:"not null" json:"sequence_number"`
	EmployeeID     *int               `gorm:"index" json:"employee_id,omitempty"`
	Employee       *employee.Employee `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	Status         string             `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	StartedAt      *string            `gorm:"type:timestamp with time zone" json:"started_at,omitempty"`
	CompletedAt    *string            `gorm:"type:timestamp with time zone" json:"completed_at,omitempty"`
	Notes          string             `gorm:"type:text" json:"notes"`
	TenantID       int                `gorm:"not null" json:"tenant_id"`
	CreatedAt      time.Time          `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	CreatedBy      string             `gorm:"size:255;not null" json:"created_by"`
	UpdatedAt      time.Time          `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	UpdatedBy      string             `gorm:"size:255;not null" json:"updated_by"`
}

func (OrderItemTask) TableName() string {
	return "production_tasks"
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
