package handlers

import (
	"net/http"
	"strconv"
	"time"
	"zentra/internal/application"
	"zentra/internal/domain/models"
	"zentra/internal/domain/stockopname"

	"github.com/gin-gonic/gin"
)

// StockOpnameDetailResponse represents the stock opname detail response structure
type StockOpnameDetailResponse struct {
	ID            int           `json:"id" example:"1"`
	StockOpnameID int           `json:"stock_opname_id" example:"1"`
	Item          *ItemResponse `json:"item,omitempty"`
	SystemQty     int           `json:"system_qty" example:"100"`
	ActualQty     int           `json:"actual_qty" example:"95"`
	DifferenceQty int           `json:"difference_qty" example:"-5"`
	Notes         string        `json:"notes" example:"Stock count mismatch"`
	CreatedAt     string        `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy     string        `json:"created_by" example:"admin"`
	UpdatedAt     string        `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy     string        `json:"updated_by" example:"admin"`
	TenantID      int           `json:"tenant_id" example:"1"`
}

// StockOpnameResponse represents the stock opname response structure
type StockOpnameResponse struct {
	ID           int                         `json:"id" example:"1"`
	OpnameNumber string                      `json:"opname_number" example:"OPN/2024/001"`
	OpnameDate   string                      `json:"opname_date" example:"2024-03-24T21:41:49Z"`
	Status       string                      `json:"status" example:"draft"`
	Notes        string                      `json:"notes" example:"Monthly stock count"`
	Details      []StockOpnameDetailResponse `json:"details,omitempty"`
	CreatedAt    string                      `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy    string                      `json:"created_by" example:"admin"`
	UpdatedAt    string                      `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy    string                      `json:"updated_by" example:"admin"`
	TenantID     int                         `json:"tenant_id" example:"1"`
}

// CreateStockOpnameRequest represents the request structure for creating a stock opname
type CreateStockOpnameRequest struct {
	OpnameNumber string    `json:"opname_number" binding:"required" example:"OPN/2024/001"`
	OpnameDate   time.Time `json:"opname_date" binding:"required" example:"2024-03-24T21:41:49Z"`
	Notes        string    `json:"notes" example:"Monthly stock count"`
}

// UpdateStockOpnameRequest represents the request structure for updating a stock opname
type UpdateStockOpnameRequest struct {
	OpnameDate time.Time `json:"opname_date" binding:"required" example:"2024-03-24T21:41:49Z"`
	Status     string    `json:"status" binding:"required" example:"in_progress"`
	Notes      string    `json:"notes" example:"Monthly stock count"`
}

// CreateStockOpnameDetailRequest represents the request structure for creating a stock opname detail
type CreateStockOpnameDetailRequest struct {
	ItemID    int    `json:"item_id" binding:"required" example:"1"`
	SystemQty int    `json:"system_qty" binding:"required" example:"100"`
	ActualQty int    `json:"actual_qty" binding:"required" example:"95"`
	Notes     string `json:"notes" example:"Stock count mismatch"`
}

// UpdateStockOpnameDetailRequest represents the request structure for updating a stock opname detail
type UpdateStockOpnameDetailRequest struct {
	ActualQty int    `json:"actual_qty" binding:"required" example:"95"`
	Notes     string `json:"notes" example:"Stock count mismatch"`
}

func toStockOpnameDetailResponse(d *stockopname.StockOpnameDetail) StockOpnameDetailResponse {
	response := StockOpnameDetailResponse{
		ID:            d.ID,
		StockOpnameID: d.StockOpnameID,
		SystemQty:     d.SystemQty,
		ActualQty:     d.ActualQty,
		DifferenceQty: d.DifferenceQty,
		Notes:         d.Notes,
		CreatedAt:     d.CreatedAt.String(),
		CreatedBy:     d.CreatedBy,
		UpdatedAt:     d.UpdatedAt.String(),
		UpdatedBy:     d.UpdatedBy,
		TenantID:      d.TenantID,
	}

	if d.Item != nil {
		response.Item = &ItemResponse{
			ID:          d.Item.ID,
			Code:        d.Item.Code,
			Name:        d.Item.Name,
			Description: d.Item.Description,
			Unit:        d.Item.Unit,
			MinStock:    d.Item.MinStock,
			MaxStock:    d.Item.MaxStock,
			IsActive:    d.Item.IsActive,
		}
	}

	return response
}

func toStockOpnameResponse(o *stockopname.StockOpname) StockOpnameResponse {
	response := StockOpnameResponse{
		ID:           o.ID,
		OpnameNumber: o.OpnameNumber,
		OpnameDate:   o.OpnameDate.String(),
		Status:       o.Status,
		Notes:        o.Notes,
		CreatedAt:    o.CreatedAt.String(),
		CreatedBy:    o.CreatedBy,
		UpdatedAt:    o.UpdatedAt.String(),
		UpdatedBy:    o.UpdatedBy,
		TenantID:     o.TenantID,
	}

	if o.Details != nil {
		response.Details = make([]StockOpnameDetailResponse, len(o.Details))
		for i, detail := range o.Details {
			response.Details[i] = toStockOpnameDetailResponse(&detail)
		}
	}

	return response
}

// @Summary Create a new stock opname
// @Description Create a new stock opname with the provided details
// @Tags StockOpname
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param opname body CreateStockOpnameRequest true "Stock Opname Data"
// @Success 201 {object} StockOpnameResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames [post]
func CreateStockOpname(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateStockOpnameRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		opname := &stockopname.StockOpname{
			StockOpname: models.StockOpname{
				OpnameNumber: req.OpnameNumber,
				OpnameDate:   req.OpnameDate,
				Status:       "draft",
				Notes:        req.Notes,
			},
		}

		if err := service.Create(opname, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toStockOpnameResponse(opname))
	}
}

// @Summary Get a stock opname by ID
// @Description Get stock opname details by ID
// @Tags StockOpname
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Success 200 {object} StockOpnameResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id} [get]
func GetStockOpname(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock opname ID"})
			return
		}

		opname, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Stock opname not found"})
			return
		}

		c.JSON(http.StatusOK, toStockOpnameResponse(opname))
	}
}

// @Summary Get all stock opnames
// @Description Get all stock opnames
// @Tags StockOpname
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} StockOpnameResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames [get]
func GetAllStockOpnames(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		opnames, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]StockOpnameResponse, len(opnames))
		for i, opname := range opnames {
			response[i] = toStockOpnameResponse(&opname)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a stock opname
// @Description Update an existing stock opname with new details
// @Tags StockOpname
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Param opname body UpdateStockOpnameRequest true "Stock Opname Data"
// @Success 200 {object} StockOpnameResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id} [put]
func UpdateStockOpname(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock opname ID"})
			return
		}

		var req UpdateStockOpnameRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		opname := &stockopname.StockOpname{
			StockOpname: models.StockOpname{
				ID:         id,
				OpnameDate: req.OpnameDate,
				Status:     req.Status,
				Notes:      req.Notes,
			},
		}

		if err := service.Update(opname, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toStockOpnameResponse(opname))
	}
}

// @Summary Delete a stock opname
// @Description Delete an existing stock opname
// @Tags StockOpname
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id} [delete]
func DeleteStockOpname(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock opname ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Stock opname deleted successfully"})
	}
}

// @Summary Add detail to stock opname
// @Description Add a new detail to an existing stock opname
// @Tags StockOpname
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Param detail body CreateStockOpnameDetailRequest true "Stock Opname Detail Data"
// @Success 200 {object} StockOpnameDetailResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id}/details [post]
func AddStockOpnameDetail(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		opnameID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock opname ID"})
			return
		}

		var req CreateStockOpnameDetailRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		detail := &stockopname.StockOpnameDetail{
			StockOpnameDetail: models.StockOpnameDetail{
				StockOpnameID: opnameID,
				ItemID:        req.ItemID,
				SystemQty:     req.SystemQty,
				ActualQty:     req.ActualQty,
				DifferenceQty: req.ActualQty - req.SystemQty,
				Notes:         req.Notes,
			},
		}

		if err := service.AddDetail(detail, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toStockOpnameDetailResponse(detail))
	}
}

// @Summary Update stock opname detail
// @Description Update an existing stock opname detail
// @Tags StockOpname
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Param detail_id path int true "Detail ID"
// @Param detail body UpdateStockOpnameDetailRequest true "Stock Opname Detail Data"
// @Success 200 {object} StockOpnameDetailResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname detail not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id}/details/{detail_id} [put]
func UpdateStockOpnameDetail(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		opnameID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid stock opname ID"})
			return
		}

		detailID, err := strconv.Atoi(c.Param("detail_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid detail ID"})
			return
		}

		var req UpdateStockOpnameDetailRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		details, err := service.FindDetailsByOpnameID(opnameID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		var detail *stockopname.StockOpnameDetail
		for _, d := range details {
			if d.ID == detailID {
				detail = &d
				break
			}
		}

		if detail == nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Stock opname detail not found"})
			return
		}

		detail.ActualQty = req.ActualQty
		detail.DifferenceQty = req.ActualQty - detail.SystemQty
		detail.Notes = req.Notes

		if err := service.UpdateDetail(detail, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toStockOpnameDetailResponse(detail))
	}
}

// @Summary Delete stock opname detail
// @Description Delete an existing stock opname detail
// @Tags StockOpname
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Stock Opname ID"
// @Param detail_id path int true "Detail ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Stock opname detail not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /stock-opnames/{id}/details/{detail_id} [delete]
func DeleteStockOpnameDetail(service *application.StockOpnameService) gin.HandlerFunc {
	return func(c *gin.Context) {
		detailID, err := strconv.Atoi(c.Param("detail_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid detail ID"})
			return
		}

		if err := service.DeleteDetail(detailID, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Stock opname detail deleted successfully"})
	}
}
