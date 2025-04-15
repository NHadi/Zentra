package handlers

import (
	"zentra/internal/domain/task"
)

// TaskResponse represents the task response structure
// @Description Task response model
type TaskResponse struct {
	ID             int     `json:"id" example:"1"`
	OrderItemID    int     `json:"order_item_id" example:"1"`
	TaskType       string  `json:"task_type" example:"washing"`
	SequenceNumber int     `json:"sequence_number" example:"1"`
	EmployeeID     *int    `json:"employee_id,omitempty" example:"1"`
	EmployeeName   string  `json:"employee_name,omitempty" example:"John Doe"`
	Status         string  `json:"status" example:"pending"`
	StartedAt      *string `json:"started_at,omitempty" example:"2024-03-24T21:41:49Z"`
	CompletedAt    *string `json:"completed_at,omitempty" example:"2024-03-24T21:41:49Z"`
	Notes          string  `json:"notes" example:"Handle with care"`
	CreatedAt      string  `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy      string  `json:"created_by" example:"admin"`
	UpdatedAt      string  `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy      string  `json:"updated_by" example:"admin"`
	TenantID       int     `json:"tenant_id" example:"1"`
}

// ToTaskResponse converts a task entity to a task response
func ToTaskResponse(t *task.Task) TaskResponse {
	response := TaskResponse{
		ID:             t.ID,
		OrderItemID:    t.OrderItemID,
		TaskType:       t.TaskType,
		SequenceNumber: t.SequenceNumber,
		EmployeeID:     t.EmployeeID,
		Status:         t.Status,
		StartedAt:      t.StartedAt,
		CompletedAt:    t.CompletedAt,
		Notes:          t.Notes,
		CreatedAt:      t.CreatedAt.String(),
		CreatedBy:      t.CreatedBy,
		UpdatedAt:      t.UpdatedAt.String(),
		UpdatedBy:      t.UpdatedBy,
		TenantID:       t.TenantID,
	}

	if t.Employee != nil {
		response.EmployeeName = t.Employee.Name
	}

	return response
}
