package handlers

import (
	"zentra/internal/domain/order"
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

// EnhancedTaskResponse represents the task response structure with related data
// @Description Enhanced task response model
type EnhancedTaskResponse struct {
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
	OrderItem      struct {
		ID               int     `json:"id"`
		ProductName      string  `json:"product_name"`
		Quantity         int     `json:"quantity"`
		Size             string  `json:"size"`
		Color            string  `json:"color"`
		ProductionStatus string  `json:"production_status"`
		FinalSubtotal    float64 `json:"final_subtotal"`
		Order            struct {
			ID                   int     `json:"id"`
			OrderNumber          string  `json:"order_number"`
			CustomerName         string  `json:"customer_name"`
			CustomerEmail        string  `json:"customer_email"`
			CustomerPhone        string  `json:"customer_phone"`
			Status               string  `json:"status"`
			PaymentStatus        string  `json:"payment_status"`
			ExpectedDeliveryDate string  `json:"expected_delivery_date"`
			TotalAmount          float64 `json:"total_amount"`
		} `json:"order"`
	} `json:"order_item"`
}

// ToEnhancedTaskResponse converts a task entity to an enhanced task response
func ToEnhancedTaskResponse(t *task.Task, orderItem *order.OrderItem, ord *order.Order) EnhancedTaskResponse {
	response := EnhancedTaskResponse{
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

	// Use the OrderItem from the task if not provided explicitly
	if orderItem == nil && t.OrderItem != nil {
		orderItem = t.OrderItem
	}

	if orderItem != nil {
		response.OrderItem.ID = orderItem.ID
		if orderItem.Product != nil {
			response.OrderItem.ProductName = orderItem.Product.Name
		}
		response.OrderItem.Quantity = orderItem.Quantity
		response.OrderItem.Size = orderItem.Size
		response.OrderItem.Color = orderItem.Color
		response.OrderItem.ProductionStatus = orderItem.ProductionStatus
		response.OrderItem.FinalSubtotal = orderItem.FinalSubtotal

		// Use the Order from the OrderItem if not provided explicitly
		if ord == nil && orderItem.Order != nil {
			ord = orderItem.Order
		}

		if ord != nil {
			response.OrderItem.Order.ID = ord.ID
			response.OrderItem.Order.OrderNumber = ord.OrderNumber
			if ord.Customer != nil {
				response.OrderItem.Order.CustomerName = ord.Customer.Name
				response.OrderItem.Order.CustomerEmail = ord.Customer.Email
				response.OrderItem.Order.CustomerPhone = ord.Customer.Phone
			}
			response.OrderItem.Order.Status = ord.Status
			response.OrderItem.Order.PaymentStatus = ord.PaymentStatus
			response.OrderItem.Order.ExpectedDeliveryDate = ord.ExpectedDeliveryDate
			response.OrderItem.Order.TotalAmount = ord.TotalAmount
		}
	}

	return response
}
