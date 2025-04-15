package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/models"
	"zentra/internal/domain/stockmovement"

	"github.com/gin-gonic/gin"
)

// StockMovementResponse represents the stock movement response structure
type StockMovementResponse struct {
	ID            int           `json:"id" example:"1"`
	Item          *ItemResponse `json:"item,omitempty"`
	MovementType  string        `json:"movement_type" example:"in"`
	Quantity      int           `json:"quantity" example:"100"`
	ReferenceType string        `json:"reference_type" example:"purchase"`
	ReferenceID   int           `json:"reference_id" example:"1"`
	Notes         string        `json:"notes" example:"Initial stock"`
	CreatedAt     string        `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy     string        `json:"created_by" example:"admin"`
	UpdatedAt     string        `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy     string        `json:"updated_by" example:"admin"`
	TenantID      int           `json:"tenant_id" example:"1"`
}

// CreateStockMovementRequest represents the request structure for creating a stock movement
type CreateStockMovementRequest struct {
	ItemID        int    `json:"item_id" binding:"required" example:"1"`
	MovementType  string `json:"movement_type" binding:"required" example:"in"`
	Quantity      int    `json:"quantity" binding:"required" example:"100"`
	ReferenceType string `json:"reference_type" example:"purchase"`
	ReferenceID   int    `json:"reference_id" example:"1"`
	Notes         string `json:"notes" example:"Initial stock"`
}

func toStockMovementResponse(m *stockmovement.StockMovement) StockMovementResponse {
	response := StockMovementResponse{
		ID:            m.ID,
		MovementType:  m.MovementType,
		Quantity:      m.Quantity,
		ReferenceType: m.ReferenceType,
		ReferenceID:   m.ReferenceID,
		Notes:         m.Notes,
		CreatedAt:     m.CreatedAt.String(),
		CreatedBy:     m.CreatedBy,
		UpdatedAt:     m.UpdatedAt.String(),
		UpdatedBy:     m.UpdatedBy,
		TenantID:      m.TenantID,
	}

	if m.Item != nil {
		response.Item = &ItemResponse{
			ID:          m.Item.ID,
			Code:        m.Item.Code,
			Name:        m.Item.Name,
			Description: m.Item.Description,
			Unit:        m.Item.Unit,
			MinStock:    m.Item.MinStock,
			MaxStock:    m.Item.MaxStock,
			IsActive:    m.Item.IsActive,
		}
	}

	return response
}

// @Summary Create a new stock movement
// @Description Create a new stock movement with the provided details
// @Tags StockMovement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param movement body CreateStockMovementRequest true "Stock Movement Data"
// @Success 201 {object} StockMovementResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-movements [post]
func CreateStockMovement(service *application.StockMovementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateStockMovementRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		movement := &stockmovement.StockMovement{
			StockMovement: models.StockMovement{
				ItemID:        req.ItemID,
				MovementType:  req.MovementType,
				Quantity:      req.Quantity,
				ReferenceType: req.ReferenceType,
				ReferenceID:   req.ReferenceID,
				Notes:         req.Notes,
			},
		}

		if err := service.Create(movement, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toStockMovementResponse(movement))
	}
}

// @Summary Get a stock movement by ID
// @Description Get stock movement details by ID
// @Tags StockMovement
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Movement ID"
// @Success 200 {object} StockMovementResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock movement not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-movements/{id} [get]
func GetStockMovement(service *application.StockMovementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock movement ID"})
			return
		}

		movement, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Stock movement not found"})
			return
		}

		c.JSON(http.StatusOK, toStockMovementResponse(movement))
	}
}

// @Summary Get all stock movements
// @Description Get all stock movements
// @Tags StockMovement
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} StockMovementResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-movements [get]
func GetAllStockMovements(service *application.StockMovementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		movements, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]StockMovementResponse, len(movements))
		for i, movement := range movements {
			response[i] = toStockMovementResponse(&movement)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get stock movements by item
// @Description Get all stock movements for a specific item
// @Tags StockMovement
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param item_id query int true "Item ID"
// @Success 200 {array} StockMovementResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-movements/by-item [get]
func GetStockMovementsByItem(service *application.StockMovementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID, err := strconv.Atoi(c.Query("item_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid item ID"})
			return
		}

		movements, err := service.FindByItemID(itemID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]StockMovementResponse, len(movements))
		for i, movement := range movements {
			response[i] = toStockMovementResponse(&movement)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get stock movements by reference
// @Description Get all stock movements for a specific reference
// @Tags StockMovement
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param reference_type query string true "Reference Type"
// @Param reference_id query int true "Reference ID"
// @Success 200 {array} StockMovementResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-movements/by-reference [get]
func GetStockMovementsByReference(service *application.StockMovementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		refType := c.Query("reference_type")
		refID, err := strconv.Atoi(c.Query("reference_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid reference ID"})
			return
		}

		movements, err := service.FindByReference(refType, refID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]StockMovementResponse, len(movements))
		for i, movement := range movements {
			response[i] = toStockMovementResponse(&movement)
		}

		c.JSON(http.StatusOK, response)
	}
}
