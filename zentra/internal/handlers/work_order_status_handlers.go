package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"

	"github.com/gin-gonic/gin"
)

// CompleteWorkOrderRequest represents the request structure for completing a work order
type CompleteWorkOrderRequest struct {
	CompletionNotes string  `json:"completion_notes" binding:"required" example:"Work completed successfully"`
	ActualCost      float64 `json:"actual_cost" binding:"required" example:"950.00"`
}

// CancelWorkOrderRequest represents the request structure for canceling a work order
type CancelWorkOrderRequest struct {
	Reason string `json:"reason" binding:"required" example:"Customer cancelled the order"`
}

// @Summary Complete a work order
// @Description Mark a work order as completed with completion notes and actual cost
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param request body CompleteWorkOrderRequest true "Completion Data"
// @Success 200 {object} WorkOrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/complete [post]
func CompleteWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		var req CompleteWorkOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Complete(id, req.CompletionNotes, req.ActualCost, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		workOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toWorkOrderResponse(workOrder))
	}
}

// @Summary Cancel a work order
// @Description Mark a work order as cancelled with a reason
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param request body CancelWorkOrderRequest true "Cancellation Data"
// @Success 200 {object} WorkOrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/cancel [post]
func CancelWorkOrder(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		var req CancelWorkOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.Cancel(id, req.Reason, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		workOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toWorkOrderResponse(workOrder))
	}
}
