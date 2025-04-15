package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/item"
	"zentra/internal/domain/models"

	"github.com/gin-gonic/gin"
)

// ItemResponse represents the item response structure
type ItemResponse struct {
	ID          int    `json:"id" example:"1"`
	Code        string `json:"code" example:"ITM001"`
	Name        string `json:"name" example:"Test Item"`
	Description string `json:"description" example:"Test item description"`
	Unit        string `json:"unit" example:"PCS"`
	MinStock    int    `json:"min_stock" example:"10"`
	MaxStock    int    `json:"max_stock" example:"100"`
	IsActive    bool   `json:"is_active" example:"true"`
	CreatedAt   string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string `json:"created_by" example:"admin"`
	UpdatedAt   string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string `json:"updated_by" example:"admin"`
	TenantID    int    `json:"tenant_id" example:"1"`
}

// CreateItemRequest represents the request structure for creating an item
type CreateItemRequest struct {
	Code        string `json:"code" binding:"required" example:"ITM001"`
	Name        string `json:"name" binding:"required" example:"Test Item"`
	Description string `json:"description" example:"Test item description"`
	Unit        string `json:"unit" binding:"required" example:"PCS"`
	MinStock    int    `json:"min_stock" example:"10"`
	MaxStock    int    `json:"max_stock" example:"100"`
	IsActive    bool   `json:"is_active" example:"true"`
}

// UpdateItemRequest represents the request structure for updating an item
type UpdateItemRequest struct {
	Name        string `json:"name" binding:"required" example:"Test Item"`
	Description string `json:"description" example:"Test item description"`
	Unit        string `json:"unit" binding:"required" example:"PCS"`
	MinStock    int    `json:"min_stock" example:"10"`
	MaxStock    int    `json:"max_stock" example:"100"`
	IsActive    bool   `json:"is_active" example:"true"`
}

func toItemResponse(i *item.Item) ItemResponse {
	return ItemResponse{
		ID:          i.ID,
		Code:        i.Code,
		Name:        i.Name,
		Description: i.Description,
		Unit:        i.Unit,
		MinStock:    i.MinStock,
		MaxStock:    i.MaxStock,
		IsActive:    i.IsActive,
		CreatedAt:   i.CreatedAt.String(),
		CreatedBy:   i.CreatedBy,
		UpdatedAt:   i.UpdatedAt.String(),
		UpdatedBy:   i.UpdatedBy,
		TenantID:    i.TenantID,
	}
}

// @Summary Create a new item
// @Description Create a new item with the provided details
// @Tags Item
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param item body CreateItemRequest true "Item Data"
// @Success 201 {object} ItemResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /items [post]
func CreateItem(service *application.ItemService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateItemRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		item := &item.Item{
			Item: models.Item{
				Code:        req.Code,
				Name:        req.Name,
				Description: req.Description,
				Unit:        req.Unit,
				MinStock:    req.MinStock,
				MaxStock:    req.MaxStock,
				IsActive:    req.IsActive,
			},
		}

		if err := service.Create(item, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toItemResponse(item))
	}
}

// @Summary Get an item by ID
// @Description Get item details by ID
// @Tags Item
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Item ID"
// @Success 200 {object} ItemResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Item not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /items/{id} [get]
func GetItem(service *application.ItemService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		item, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Item not found"})
			return
		}

		c.JSON(http.StatusOK, toItemResponse(item))
	}
}

// @Summary Get all items
// @Description Get all items
// @Tags Item
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} ItemResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /items [get]
func GetAllItems(service *application.ItemService) gin.HandlerFunc {
	return func(c *gin.Context) {
		items, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ItemResponse, len(items))
		for i, item := range items {
			response[i] = toItemResponse(&item)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update an item
// @Description Update an existing item with new details
// @Tags Item
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Item ID"
// @Param item body UpdateItemRequest true "Item Data"
// @Success 200 {object} ItemResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Item not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /items/{id} [put]
func UpdateItem(service *application.ItemService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		var req UpdateItemRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		item, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Item not found"})
			return
		}

		item.Name = req.Name
		item.Description = req.Description
		item.Unit = req.Unit
		item.MinStock = req.MinStock
		item.MaxStock = req.MaxStock
		item.IsActive = req.IsActive

		if err := service.Update(item, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toItemResponse(item))
	}
}

// @Summary Delete an item
// @Description Delete an existing item
// @Tags Item
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Item ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Item not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /items/{id} [delete]
func DeleteItem(service *application.ItemService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Item deleted successfully"})
	}
}
