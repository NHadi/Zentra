package task

import (
	"context"
	"zentra/internal/domain/common"
	"zentra/internal/domain/employee"
)

// Task represents the production_tasks table
type Task struct {
	ID             int                `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderItemID    int                `gorm:"index" json:"order_item_id"`
	TaskType       string             `gorm:"type:varchar(20);not null" json:"task_type"`
	SequenceNumber int                `gorm:"not null" json:"sequence_number"`
	EmployeeID     *int               `gorm:"index" json:"employee_id,omitempty"`
	Employee       *employee.Employee `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	Status         string             `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, in_progress, completed, rejected
	StartedAt      *string            `gorm:"type:timestamp with time zone" json:"started_at,omitempty"`
	CompletedAt    *string            `gorm:"type:timestamp with time zone" json:"completed_at,omitempty"`
	Notes          string             `gorm:"type:text" json:"notes"`
	common.TenantModel
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
}
