package models

import (
	"time"
)

// Task represents the production_tasks table
type Task struct {
	ID             int       `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	OrderItemID    int       `gorm:"index" json:"order_item_id"`
	TaskType       string    `gorm:"type:varchar(20);not null" json:"task_type"`
	SequenceNumber int       `gorm:"not null" json:"sequence_number"`
	EmployeeID     *int      `gorm:"index" json:"employee_id,omitempty"`
	Status         string    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"` // pending, in_progress, completed, rejected
	StartedAt      *string   `gorm:"type:timestamp with time zone" json:"started_at,omitempty"`
	CompletedAt    *string   `gorm:"type:timestamp with time zone" json:"completed_at,omitempty"`
	Notes          string    `gorm:"type:text" json:"notes"`
	TenantID       int       `gorm:"not null" json:"tenant_id"`
	CreatedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	CreatedBy      string    `gorm:"size:255;not null" json:"created_by"`
	UpdatedAt      time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	UpdatedBy      string    `gorm:"size:255;not null" json:"updated_by"`
}
