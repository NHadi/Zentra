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

// @Summary Create a new work order task
// @Description Create a new task for a work order
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param task body WorkOrderTaskInput true "Task Data"
// @Success 201 {object} WorkOrderTaskItem
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/tasks [post]
func CreateWorkOrderTask(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		var req WorkOrderTaskInput
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

		task := &accounting.WorkOrderTask{
			WorkOrderTask: models.WorkOrderTask{
				WorkOrderID: workOrderID,
				TaskName:    req.TaskName,
				Description: req.Description,
				AssignedTo:  req.AssignedTo,
				StartDate:   startDate,
				EndDate:     endDate,
				Status:      "pending",
			},
		}

		if err := service.CreateTask(workOrderID, task, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, WorkOrderTaskItem{
			ID:          task.ID,
			TaskName:    task.TaskName,
			Description: task.Description,
			AssignedTo:  task.AssignedTo,
			StartDate:   task.StartDate.Format(time.RFC3339),
			EndDate:     task.EndDate.Format(time.RFC3339),
			Status:      task.Status,
		})
	}
}

// @Summary Update a work order task
// @Description Update an existing task in a work order
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param taskId path int true "Task ID"
// @Param task body WorkOrderTaskInput true "Task Data"
// @Success 200 {object} WorkOrderTaskItem
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order or task not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/tasks/{taskId} [put]
func UpdateWorkOrderTask(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		taskID, err := strconv.Atoi(c.Param("taskId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task ID"})
			return
		}

		var req WorkOrderTaskInput
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

		task := &accounting.WorkOrderTask{
			WorkOrderTask: models.WorkOrderTask{
				ID:          taskID,
				WorkOrderID: workOrderID,
				TaskName:    req.TaskName,
				Description: req.Description,
				AssignedTo:  req.AssignedTo,
				StartDate:   startDate,
				EndDate:     endDate,
			},
		}

		if err := service.UpdateTask(workOrderID, taskID, task, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, WorkOrderTaskItem{
			ID:          task.ID,
			TaskName:    task.TaskName,
			Description: task.Description,
			AssignedTo:  task.AssignedTo,
			StartDate:   task.StartDate.Format(time.RFC3339),
			EndDate:     task.EndDate.Format(time.RFC3339),
			Status:      task.Status,
		})
	}
}

// @Summary Delete a work order task
// @Description Delete a task from a work order
// @Tags WorkOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param taskId path int true "Task ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order or task not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/tasks/{taskId} [delete]
func DeleteWorkOrderTask(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		taskID, err := strconv.Atoi(c.Param("taskId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid task ID"})
			return
		}

		if err := service.DeleteTask(workOrderID, taskID, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Task deleted successfully"})
	}
}
