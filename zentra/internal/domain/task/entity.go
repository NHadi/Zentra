package task

import (
	"context"
	"zentra/internal/domain/employee"
	"zentra/internal/domain/models"
	"zentra/internal/domain/order"
)

// Task represents the production_tasks table
type Task struct {
	models.Task
	OrderItem *order.OrderItem   `gorm:"foreignKey:OrderItemID" json:"order_item,omitempty"`
	Employee  *employee.Employee `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
}

func (Task) TableName() string {
	return "production_tasks"
}

type Repository interface {
	Create(task *Task, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Task, error)
	FindAll(ctx context.Context) ([]Task, error)
	Update(task *Task, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByOrderItemID(orderItemID int, ctx context.Context) ([]Task, error)
	FindByEmployeeID(employeeID int, ctx context.Context) ([]Task, error)
	FindByStatus(status string, ctx context.Context) ([]Task, error)
	FindByTaskType(taskType string, ctx context.Context) ([]Task, error)
	FindByIDWithRelations(id int, ctx context.Context) (*Task, error)
	FindAllWithRelations(ctx context.Context) ([]Task, error)
}
