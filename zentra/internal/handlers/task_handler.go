package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"zentra/internal/application"
	"zentra/internal/domain/models"
	"zentra/internal/domain/task"

	"github.com/gin-gonic/gin"
)

// CreateTaskRequest represents the request structure for creating a task
// @Description Create task request model
type CreateTaskRequest struct {
	OrderItemID    int     `json:"order_item_id" binding:"required" example:"1"`
	TaskType       string  `json:"task_type" binding:"required" example:"washing"`
	SequenceNumber int     `json:"sequence_number" binding:"required" example:"1"`
	EmployeeID     *int    `json:"employee_id,omitempty" example:"1"`
	Status         string  `json:"status" binding:"required" example:"pending"`
	StartedAt      *string `json:"started_at,omitempty" example:"2024-03-24T21:41:49Z"`
	CompletedAt    *string `json:"completed_at,omitempty" example:"2024-03-24T21:41:49Z"`
	Notes          string  `json:"notes" example:"Handle with care"`
}

// UpdateTaskRequest represents the request structure for updating a task
// @Description Update task request model
type UpdateTaskRequest struct {
	OrderItemID    int     `json:"order_item_id" binding:"required" example:"1"`
	TaskType       string  `json:"task_type" binding:"required" example:"washing"`
	SequenceNumber int     `json:"sequence_number" binding:"required" example:"1"`
	EmployeeID     *int    `json:"employee_id,omitempty" example:"1"`
	Status         string  `json:"status" binding:"required" example:"pending"`
	StartedAt      *string `json:"started_at,omitempty" example:"2024-03-24T21:41:49Z"`
	CompletedAt    *string `json:"completed_at,omitempty" example:"2024-03-24T21:41:49Z"`
	Notes          string  `json:"notes" example:"Handle with care"`
}

func toTaskResponse(t *task.Task) TaskResponse {
	return TaskResponse{
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
}

// @Summary Create a new task
// @Description Create a new task with the provided details
// @Tags Task
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param task body CreateTaskRequest true "Task Data"
// @Success 201 {object} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks [post]
func CreateTask(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		task := &task.Task{
			Task: models.Task{
				OrderItemID:    req.OrderItemID,
				TaskType:       req.TaskType,
				SequenceNumber: req.SequenceNumber,
				EmployeeID:     req.EmployeeID,
				Status:         req.Status,
				StartedAt:      req.StartedAt,
				CompletedAt:    req.CompletedAt,
				Notes:          req.Notes,
			},
		}

		if err := service.Create(task, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created task
		createdTask, err := service.FindByID(task.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created task"})
			return
		}

		c.JSON(http.StatusCreated, ToTaskResponse(createdTask))
	}
}

// @Summary Get a task by ID
// @Description Get task details by ID
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Task ID"
// @Param include query string false "Include related data (order_item,order)" example:"order_item,order"
// @Success 200 {object} EnhancedTaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Task not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/{id} [get]
func GetTask(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task ID"})
			return
		}

		include := c.Query("include")
		var task *task.Task
		if include != "" && (strings.Contains(include, "order_item") || strings.Contains(include, "order")) {
			task, err = service.FindByIDWithRelations(id, c)
		} else {
			task, err = service.FindByID(id, c)
		}

		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Task not found"})
			return
		}

		if include != "" && (strings.Contains(include, "order_item") || strings.Contains(include, "order")) {
			c.JSON(http.StatusOK, ToEnhancedTaskResponse(task, nil, nil)) // The repository already joins the data
		} else {
			c.JSON(http.StatusOK, ToTaskResponse(task))
		}
	}
}

// @Summary Get all tasks
// @Description Get all tasks
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param include query string false "Include related data (order_item,order)" example:"order_item,order"
// @Success 200 {array} EnhancedTaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks [get]
func GetAllTasks(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		include := c.Query("include")
		var tasks []task.Task
		var err error

		if include != "" && (strings.Contains(include, "order_item") || strings.Contains(include, "order")) {
			tasks, err = service.FindAllWithRelations(c)
		} else {
			tasks, err = service.FindAll(c)
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		if include != "" && (strings.Contains(include, "order_item") || strings.Contains(include, "order")) {
			response := make([]EnhancedTaskResponse, len(tasks))
			for i, t := range tasks {
				response[i] = ToEnhancedTaskResponse(&t, nil, nil) // The repository already joins the data
			}
			c.JSON(http.StatusOK, response)
		} else {
			response := make([]TaskResponse, len(tasks))
			for i, t := range tasks {
				response[i] = ToTaskResponse(&t)
			}
			c.JSON(http.StatusOK, response)
		}
	}
}

// @Summary Update a task
// @Description Update an existing task with new details
// @Tags Task
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Task ID"
// @Param task body UpdateTaskRequest true "Task Data"
// @Success 200 {object} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Task not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/{id} [put]
func UpdateTask(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task ID"})
			return
		}

		var req UpdateTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		task, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Task not found"})
			return
		}

		task.OrderItemID = req.OrderItemID
		task.TaskType = req.TaskType
		task.SequenceNumber = req.SequenceNumber
		task.EmployeeID = req.EmployeeID
		task.Status = req.Status
		task.StartedAt = req.StartedAt
		task.CompletedAt = req.CompletedAt
		task.Notes = req.Notes

		if err := service.Update(task, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated task
		updatedTask, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated task"})
			return
		}

		c.JSON(http.StatusOK, ToTaskResponse(updatedTask))
	}
}

// @Summary Delete a task
// @Description Delete an existing task
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Task ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Task not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/{id} [delete]
func DeleteTask(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Task deleted successfully"})
	}
}

// @Summary Get tasks by order item ID
// @Description Get all tasks for a specific order item
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param order_item_id query int true "Order Item ID" example:"1"
// @Success 200 {array} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/by-order-item [get]
func GetTasksByOrderItemID(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderItemID, err := strconv.Atoi(c.Query("order_item_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order item ID"})
			return
		}

		tasks, err := service.FindByOrderItemID(orderItemID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]TaskResponse, len(tasks))
		for i, t := range tasks {
			response[i] = ToTaskResponse(&t)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get tasks by employee ID
// @Description Get all tasks assigned to an employee
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param employee_id query int true "Employee ID" example:"1"
// @Success 200 {array} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/by-employee [get]
func GetTasksByEmployeeID(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		employeeID, err := strconv.Atoi(c.Query("employee_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid employee ID"})
			return
		}

		tasks, err := service.FindByEmployeeID(employeeID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]TaskResponse, len(tasks))
		for i, t := range tasks {
			response[i] = ToTaskResponse(&t)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get tasks by status
// @Description Get all tasks with a specific status
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param status query string true "Task Status" example:"pending"
// @Success 200 {array} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/by-status [get]
func GetTasksByStatus(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		if status == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Status is required"})
			return
		}

		tasks, err := service.FindByStatus(status, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]TaskResponse, len(tasks))
		for i, t := range tasks {
			response[i] = ToTaskResponse(&t)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get tasks by task type
// @Description Get all tasks of a specific type
// @Tags Task
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param task_type query string true "Task Type" example:"washing"
// @Success 200 {array} TaskResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /tasks/by-type [get]
func GetTasksByTaskType(service *application.TaskService) gin.HandlerFunc {
	return func(c *gin.Context) {
		taskType := c.Query("task_type")
		if taskType == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Task type is required"})
			return
		}

		tasks, err := service.FindByTaskType(taskType, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]TaskResponse, len(tasks))
		for i, t := range tasks {
			response[i] = ToTaskResponse(&t)
		}

		c.JSON(http.StatusOK, response)
	}
}
