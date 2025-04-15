package handlers

import (
	"net/http"
	"strconv"
	"time"
	"zentra/internal/application"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/models"

	"github.com/gin-gonic/gin"
)

// WorkOrderResponse represents the work order response structure with expanded relationships
type WorkOrderResponse struct {
	ID              int                 `json:"id"`
	SPKNumber       string              `json:"spk_number"`
	Order           OrderInfo           `json:"order"` // Expanded order details
	CustomerName    string              `json:"customer_name"`
	WorkType        string              `json:"work_type"`
	Description     string              `json:"description"`
	StartDate       string              `json:"start_date"`
	EndDate         string              `json:"end_date"`
	Status          string              `json:"status"`
	AssignedTo      EmployeeInfo        `json:"assigned_to"` // Expanded employee details
	EstimatedCost   float64             `json:"estimated_cost"`
	ActualCost      float64             `json:"actual_cost"`
	CompletionNotes string              `json:"completion_notes"`
	Tasks           []WorkOrderTaskItem `json:"tasks"`
	Items           []WorkOrderItemInfo `json:"items"`
	CreatedAt       string              `json:"created_at"`
	CreatedBy       string              `json:"created_by"`
	UpdatedAt       string              `json:"updated_at"`
	UpdatedBy       string              `json:"updated_by"`
}

// WorkOrderTaskItem represents a task in the work order
type WorkOrderTaskItem struct {
	ID          int    `json:"id" example:"1"`
	TaskName    string `json:"task_name" example:"Cutting"`
	Description string `json:"description" example:"Cut the fabric according to patterns"`
	AssignedTo  int    `json:"assigned_to" example:"1"`
	StartDate   string `json:"start_date" example:"2024-03-24T21:41:49Z"`
	EndDate     string `json:"end_date" example:"2024-03-24T23:41:49Z"`
	Status      string `json:"status" example:"pending"`
	Notes       string `json:"notes" example:"Ready for cutting"`
}

// WorkOrderItemInfo represents an item in the work order
type WorkOrderItemInfo struct {
	ID          int     `json:"id" example:"1"`
	ItemID      int     `json:"item_id" example:"1"`
	Description string  `json:"description" example:"Fabric material"`
	Quantity    int     `json:"quantity" example:"100"`
	UnitPrice   float64 `json:"unit_price" example:"10.00"`
	TotalPrice  float64 `json:"total_price" example:"1000.00"`
}

// CreateWorkOrderRequest represents the request structure for creating a work order
type CreateWorkOrderRequest struct {
	OrderID       int                  `json:"order_id" binding:"required" example:"1"`
	CustomerName  string               `json:"customer_name" binding:"required" example:"John Doe"`
	WorkType      string               `json:"work_type" binding:"required" example:"production"`
	Description   string               `json:"description" binding:"required" example:"Production of 100 jerseys"`
	StartDate     string               `json:"start_date" binding:"required" example:"2024-03-24T21:41:49Z"`
	EndDate       string               `json:"end_date" binding:"required" example:"2024-03-26T21:41:49Z"`
	AssignedTo    int                  `json:"assigned_to" binding:"required" example:"1"`
	EstimatedCost float64              `json:"estimated_cost" binding:"required" example:"1000.00"`
	Tasks         []WorkOrderTaskInput `json:"tasks"`
	Items         []WorkOrderItemInput `json:"items"`
}

// WorkOrderTaskInput represents the input for a work order task
type WorkOrderTaskInput struct {
	TaskName    string `json:"task_name" binding:"required" example:"Cutting"`
	Description string `json:"description" example:"Cut the fabric according to patterns"`
	AssignedTo  int    `json:"assigned_to" binding:"required" example:"1"`
	StartDate   string `json:"start_date" binding:"required" example:"2024-03-24T21:41:49Z"`
	EndDate     string `json:"end_date" binding:"required" example:"2024-03-24T23:41:49Z"`
}

// WorkOrderItemInput represents the input for a work order item
type WorkOrderItemInput struct {
	ItemID      int     `json:"item_id" binding:"required" example:"1"`
	Description string  `json:"description" example:"Fabric material"`
	Quantity    int     `json:"quantity" binding:"required" example:"100"`
	UnitPrice   float64 `json:"unit_price" binding:"required" example:"10.00"`
}

// UpdateWorkOrderRequest represents the request structure for updating a work order
type UpdateWorkOrderRequest struct {
	CustomerName  string               `json:"customer_name" binding:"required" example:"John Doe"`
	WorkType      string               `json:"work_type" binding:"required" example:"production"`
	Description   string               `json:"description" binding:"required" example:"Production of 100 jerseys"`
	StartDate     string               `json:"start_date" binding:"required" example:"2024-03-24T21:41:49Z"`
	EndDate       string               `json:"end_date" binding:"required" example:"2024-03-26T21:41:49Z"`
	AssignedTo    int                  `json:"assigned_to" binding:"required" example:"1"`
	EstimatedCost float64              `json:"estimated_cost" binding:"required" example:"1000.00"`
	Tasks         []WorkOrderTaskInput `json:"tasks"`
	Items         []WorkOrderItemInput `json:"items"`
}

// OrderInfo represents the essential order information
type OrderInfo struct {
	ID                   int             `json:"id"`
	OrderNumber          string          `json:"order_number"`
	CustomerEmail        string          `json:"customer_email"`
	CustomerPhone        string          `json:"customer_phone"`
	DeliveryAddress      string          `json:"delivery_address"`
	Status               string          `json:"status"`
	PaymentStatus        string          `json:"payment_status"`
	ExpectedDeliveryDate string          `json:"expected_delivery_date"`
	TotalAmount          float64         `json:"total_amount"`
	OrderItems           []OrderItemInfo `json:"order_items"`
}

// OrderItemInfo represents the essential order item information
type OrderItemInfo struct {
	ID               int     `json:"id"`
	ProductName      string  `json:"product_name"`
	Quantity         int     `json:"quantity"`
	Size             string  `json:"size"`
	Color            string  `json:"color"`
	ProductionStatus string  `json:"production_status"`
	FinalSubtotal    float64 `json:"final_subtotal"`
}

// Convert from models to accounting types
func toAccountingWorkOrder(m *accounting.WorkOrder) *accounting.WorkOrder {
	return m
}

func toAccountingWorkOrderTask(m *accounting.WorkOrderTask) *accounting.WorkOrderTask {
	return m
}

func toAccountingWorkOrderItem(m *accounting.WorkOrderItem) *accounting.WorkOrderItem {
	return m
}

// Convert from accounting to models types
func toModelsWorkOrder(a *accounting.WorkOrder) *accounting.WorkOrder {
	return a
}

func toWorkOrderResponse(w interface{}) WorkOrderResponse {
	var workOrder accounting.WorkOrder
	switch v := w.(type) {
	case accounting.WorkOrder:
		workOrder = v
	case *accounting.WorkOrder:
		workOrder = *v
	default:
		panic("invalid type for toWorkOrderResponse")
	}

	tasks := make([]WorkOrderTaskItem, len(workOrder.Tasks))
	for i, task := range workOrder.Tasks {
		tasks[i] = WorkOrderTaskItem{
			ID:          task.ID,
			TaskName:    task.TaskName,
			Description: task.Description,
			AssignedTo:  task.AssignedTo,
			StartDate:   task.StartDate.Format(time.RFC3339),
			EndDate:     task.EndDate.Format(time.RFC3339),
			Status:      task.Status,
			Notes:       task.Notes,
		}
	}

	items := make([]WorkOrderItemInfo, len(workOrder.Items))
	for i, item := range workOrder.Items {
		items[i] = WorkOrderItemInfo{
			ID:          item.ID,
			ItemID:      item.ItemID,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			TotalPrice:  item.TotalPrice,
		}
	}

	// Convert Order to OrderInfo
	orderInfo := OrderInfo{
		ID:                   workOrder.Order.ID,
		OrderNumber:          workOrder.Order.OrderNumber,
		CustomerEmail:        workOrder.Order.CustomerEmail,
		CustomerPhone:        workOrder.Order.CustomerPhone,
		DeliveryAddress:      workOrder.Order.DeliveryAddress,
		Status:               workOrder.Order.Status,
		PaymentStatus:        workOrder.Order.PaymentStatus,
		ExpectedDeliveryDate: workOrder.Order.ExpectedDeliveryDate,
		TotalAmount:          workOrder.Order.TotalAmount,
	}

	// Convert Employee to EmployeeInfo
	employeeInfo := EmployeeInfo{
		ID:    workOrder.Employee.ID,
		Name:  workOrder.Employee.Name,
		Email: workOrder.Employee.Email,
		Phone: workOrder.Employee.Phone,
	}

	return WorkOrderResponse{
		ID:              workOrder.ID,
		SPKNumber:       workOrder.SPKNumber,
		Order:           orderInfo,
		CustomerName:    workOrder.CustomerName,
		WorkType:        workOrder.WorkType,
		Description:     workOrder.Description,
		StartDate:       workOrder.StartDate.Format(time.RFC3339),
		EndDate:         workOrder.EndDate.Format(time.RFC3339),
		Status:          workOrder.Status,
		AssignedTo:      employeeInfo,
		EstimatedCost:   workOrder.EstimatedCost,
		ActualCost:      workOrder.ActualCost,
		CompletionNotes: workOrder.CompletionNotes,
		Tasks:           tasks,
		Items:           items,
		CreatedAt:       workOrder.CreatedAt.Format(time.RFC3339),
		CreatedBy:       workOrder.CreatedBy,
		UpdatedAt:       workOrder.UpdatedAt.Format(time.RFC3339),
		UpdatedBy:       workOrder.UpdatedBy,
	}
}

// @Summary Create a new work order
// @Description Create a new work order with the provided details
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param workOrder body CreateWorkOrderRequest true "Work Order Data"
// @Success 201 {object} WorkOrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders [post]
func CreateWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateWorkOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		startDate, err := time.Parse(time.RFC3339, req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid start date format"})
			return
		}

		endDate, err := time.Parse(time.RFC3339, req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid end date format"})
			return
		}

		tasks := make([]accounting.WorkOrderTask, len(req.Tasks))
		for i, task := range req.Tasks {
			taskStartDate, err := time.Parse(time.RFC3339, task.StartDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task start date format"})
				return
			}

			taskEndDate, err := time.Parse(time.RFC3339, task.EndDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task end date format"})
				return
			}

			tasks[i] = accounting.WorkOrderTask{
				WorkOrderTask: models.WorkOrderTask{
					TaskName:    task.TaskName,
					Description: task.Description,
					AssignedTo:  task.AssignedTo,
					StartDate:   taskStartDate,
					EndDate:     taskEndDate,
					Status:      "pending",
				},
			}
		}

		items := make([]accounting.WorkOrderItem, len(req.Items))
		for i, item := range req.Items {
			items[i] = accounting.WorkOrderItem{
				WorkOrderItem: models.WorkOrderItem{
					ItemID:      item.ItemID,
					Description: item.Description,
					Quantity:    item.Quantity,
					UnitPrice:   item.UnitPrice,
					TotalPrice:  item.UnitPrice * float64(item.Quantity),
				},
			}
		}

		workOrder := &accounting.WorkOrder{
			WorkOrder: models.WorkOrder{
				OrderID:       req.OrderID,
				CustomerName:  req.CustomerName,
				WorkType:      req.WorkType,
				Description:   req.Description,
				StartDate:     startDate,
				EndDate:       endDate,
				Status:        "draft",
				AssignedTo:    req.AssignedTo,
				EstimatedCost: req.EstimatedCost,
			},
			Tasks: tasks,
			Items: items,
		}

		if err := service.Create(workOrder, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toWorkOrderResponse(*workOrder))
	}
}

// @Summary Get a work order by ID
// @Description Get work order details by ID
// @Tags WorkOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Success 200 {object} WorkOrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id} [get]
func GetWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		workOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Work order not found"})
			return
		}

		c.JSON(http.StatusOK, toWorkOrderResponse(*workOrder))
	}
}

// @Summary Get all work orders
// @Description Get all work orders
// @Tags WorkOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} WorkOrderResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders [get]
func GetAllWorkOrders(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrders, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]WorkOrderResponse, len(workOrders))
		for i, workOrder := range workOrders {
			response[i] = toWorkOrderResponse(workOrder)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a work order
// @Description Update an existing work order with new details
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param workOrder body UpdateWorkOrderRequest true "Work Order Data"
// @Success 200 {object} WorkOrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id} [put]
func UpdateWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		var req UpdateWorkOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		workOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Work order not found"})
			return
		}

		startDate, err := time.Parse(time.RFC3339, req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid start date format"})
			return
		}

		endDate, err := time.Parse(time.RFC3339, req.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid end date format"})
			return
		}

		tasks := make([]accounting.WorkOrderTask, len(req.Tasks))
		for i, task := range req.Tasks {
			taskStartDate, err := time.Parse(time.RFC3339, task.StartDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task start date format"})
				return
			}

			taskEndDate, err := time.Parse(time.RFC3339, task.EndDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task end date format"})
				return
			}

			tasks[i] = accounting.WorkOrderTask{
				WorkOrderTask: models.WorkOrderTask{
					TaskName:    task.TaskName,
					Description: task.Description,
					AssignedTo:  task.AssignedTo,
					StartDate:   taskStartDate,
					EndDate:     taskEndDate,
					Status:      "pending",
				},
			}
		}

		items := make([]accounting.WorkOrderItem, len(req.Items))
		for i, item := range req.Items {
			items[i] = accounting.WorkOrderItem{
				WorkOrderItem: models.WorkOrderItem{
					ItemID:      item.ItemID,
					Description: item.Description,
					Quantity:    item.Quantity,
					UnitPrice:   item.UnitPrice,
					TotalPrice:  item.UnitPrice * float64(item.Quantity),
				},
			}
		}

		workOrder.WorkOrder.CustomerName = req.CustomerName
		workOrder.WorkOrder.WorkType = req.WorkType
		workOrder.WorkOrder.Description = req.Description
		workOrder.WorkOrder.StartDate = startDate
		workOrder.WorkOrder.EndDate = endDate
		workOrder.WorkOrder.AssignedTo = req.AssignedTo
		workOrder.WorkOrder.EstimatedCost = req.EstimatedCost
		workOrder.Tasks = tasks
		workOrder.Items = items

		if err := service.Update(workOrder, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toWorkOrderResponse(*workOrder))
	}
}

// @Summary Delete a work order
// @Description Delete an existing work order
// @Tags WorkOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id} [delete]
func DeleteWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Work order deleted successfully"})
	}
}
