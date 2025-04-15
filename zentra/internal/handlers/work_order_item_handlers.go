package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/models"

	"github.com/gin-gonic/gin"
)

// @Summary Create a new work order item
// @Description Create a new item for a work order
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param item body WorkOrderItemInput true "Item Data"
// @Success 201 {object} WorkOrderItemInfo
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/items [post]
func CreateWorkOrderItem(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		var req WorkOrderItemInput
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		item := &accounting.WorkOrderItem{
			WorkOrderItem: models.WorkOrderItem{
				WorkOrderID: workOrderID,
				ItemID:      req.ItemID,
				Description: req.Description,
				Quantity:    req.Quantity,
				UnitPrice:   req.UnitPrice,
				TotalPrice:  req.UnitPrice * float64(req.Quantity),
			},
		}

		if err := service.CreateItem(workOrderID, item, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, WorkOrderItemInfo{
			ID:          item.ID,
			ItemID:      item.ItemID,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			TotalPrice:  item.TotalPrice,
		})
	}
}

// @Summary Update a work order item
// @Description Update an existing item in a work order
// @Tags WorkOrder
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param itemId path int true "Item ID"
// @Param item body WorkOrderItemInput true "Item Data"
// @Success 200 {object} WorkOrderItemInfo
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order or item not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/items/{itemId} [put]
func UpdateWorkOrderItem(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		itemID, err := strconv.Atoi(c.Param("itemId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		var req WorkOrderItemInput
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		item := &accounting.WorkOrderItem{
			WorkOrderItem: models.WorkOrderItem{
				ID:          itemID,
				WorkOrderID: workOrderID,
				ItemID:      req.ItemID,
				Description: req.Description,
				Quantity:    req.Quantity,
				UnitPrice:   req.UnitPrice,
				TotalPrice:  req.UnitPrice * float64(req.Quantity),
			},
		}

		if err := service.UpdateItem(workOrderID, itemID, item, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, WorkOrderItemInfo{
			ID:          item.ID,
			ItemID:      item.ItemID,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			TotalPrice:  item.TotalPrice,
		})
	}
}

// @Summary Delete a work order item
// @Description Delete an item from a work order
// @Tags WorkOrder
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Work Order ID"
// @Param itemId path int true "Item ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Work order or item not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /work-orders/{id}/items/{itemId} [delete]
func DeleteWorkOrderItem(service *application.WorkOrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		workOrderID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid work order ID"})
			return
		}

		itemID, err := strconv.Atoi(c.Param("itemId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		if err := service.DeleteItem(workOrderID, itemID, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Item deleted successfully"})
	}
}
