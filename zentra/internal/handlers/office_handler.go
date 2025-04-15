package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/office"

	"github.com/gin-gonic/gin"
)

// OfficeResponse represents the office response structure
// @Description Office response model
type OfficeResponse struct {
	ID        int       `json:"id" example:"1"`
	Name      string    `json:"name" example:"Main Office"`
	Code      string    `json:"code" example:"MO001"`
	Address   string    `json:"address" example:"123 Main St"`
	Phone     string    `json:"phone" example:"+1234567890"`
	Email     string    `json:"email" example:"main@office.com"`
	ZoneID    *int      `json:"zone_id" example:"1"`
	Zone      *ZoneInfo `json:"zone,omitempty"`
	CreatedAt string    `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy string    `json:"created_by" example:"admin"`
	UpdatedAt string    `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy string    `json:"updated_by" example:"admin"`
	TenantID  int       `json:"tenant_id" example:"1"`
}

// ZoneInfo represents the zone information in office response
type ZoneInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"North Zone"`
	Description string `json:"description" example:"Northern zone"`
}

// CreateOfficeRequest represents the request structure for creating an office
// @Description Create office request model
type CreateOfficeRequest struct {
	Name    string `json:"name" binding:"required" example:"Main Office"`
	Code    string `json:"code" binding:"required" example:"MO001"`
	Address string `json:"address" example:"123 Main St"`
	Phone   string `json:"phone" example:"+1234567890"`
	Email   string `json:"email" binding:"required,email" example:"main@office.com"`
	ZoneID  *int   `json:"zone_id" example:"1"`
}

// UpdateOfficeRequest represents the request structure for updating an office
// @Description Update office request model
type UpdateOfficeRequest struct {
	Name    string `json:"name" binding:"required" example:"Main Office"`
	Code    string `json:"code" binding:"required" example:"MO001"`
	Address string `json:"address" example:"123 Main St"`
	Phone   string `json:"phone" example:"+1234567890"`
	Email   string `json:"email" binding:"required,email" example:"main@office.com"`
	ZoneID  *int   `json:"zone_id" example:"1"`
}

// AssignZoneRequest represents the request structure for assigning a zone to an office
type AssignZoneRequest struct {
	ZoneID int `json:"zone_id" binding:"required" example:"1"`
}

func toOfficeResponse(o *office.Office) OfficeResponse {
	response := OfficeResponse{
		ID:        o.ID,
		Name:      o.Name,
		Code:      o.Code,
		Address:   o.Address,
		Phone:     o.Phone,
		Email:     o.Email,
		ZoneID:    o.ZoneID,
		CreatedAt: o.CreatedAt.String(),
		CreatedBy: o.CreatedBy,
		UpdatedAt: o.UpdatedAt.String(),
		UpdatedBy: o.UpdatedBy,
		TenantID:  o.TenantID,
	}

	if o.Zone != nil {
		response.Zone = &ZoneInfo{
			ID:          o.Zone.ID,
			Name:        o.Zone.Name,
			Description: o.Zone.Description,
		}
	}

	return response
}

// @Summary Create a new office
// @Description Create a new office with the provided details
// @Tags Office
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param office body CreateOfficeRequest true "Office Data"
// @Success 201 {object} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices [post]
func CreateOffice(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateOfficeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		office := &office.Office{
			Name:    req.Name,
			Code:    req.Code,
			Address: req.Address,
			Phone:   req.Phone,
			Email:   req.Email,
			ZoneID:  req.ZoneID,
		}

		if err := service.Create(office, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toOfficeResponse(office))
	}
}

// @Summary Get an office by ID
// @Description Get office details by ID
// @Tags Office
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Office ID"
// @Success 200 {object} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Office not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices/{id} [get]
func GetOffice(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid office ID"})
			return
		}

		office, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Office not found"})
			return
		}

		c.JSON(http.StatusOK, toOfficeResponse(office))
	}
}

// @Summary Get all offices
// @Description Get all offices
// @Tags Office
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices [get]
func GetAllOffices(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		offices, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OfficeResponse, len(offices))
		for i, o := range offices {
			response[i] = toOfficeResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update an office
// @Description Update an existing office with new details
// @Tags Office
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Office ID"
// @Param office body UpdateOfficeRequest true "Office Data"
// @Success 200 {object} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Office not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices/{id} [put]
func UpdateOffice(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid office ID"})
			return
		}

		var req UpdateOfficeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		office, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Office not found"})
			return
		}

		office.Name = req.Name
		office.Code = req.Code
		office.Address = req.Address
		office.Phone = req.Phone
		office.Email = req.Email
		office.ZoneID = req.ZoneID

		if err := service.Update(office, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toOfficeResponse(office))
	}
}

// @Summary Delete an office
// @Description Delete an existing office
// @Tags Office
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Office ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Office not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices/{id} [delete]
func DeleteOffice(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid office ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Office deleted successfully"})
	}
}

// @Summary Get offices by zone
// @Description Get all offices for a specific zone
// @Tags Office
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param zone_id query int true "Zone ID" example:"1"
// @Success 200 {array} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices/by-zone [get]
func GetOfficesByZone(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		zoneID, err := strconv.Atoi(c.Query("zone_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		offices, err := service.FindByZoneID(zoneID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OfficeResponse, len(offices))
		for i, o := range offices {
			response[i] = toOfficeResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Assign zone to an office
// @Description Assign a zone to an existing office
// @Tags Office
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Office ID"
// @Param request body AssignZoneRequest true "Zone ID"
// @Success 200 {object} OfficeResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Office not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /offices/{id}/zone [post]
func AssignZone(service *application.OfficeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid office ID"})
			return
		}

		var req AssignZoneRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		office, err := service.AssignZone(id, req.ZoneID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toOfficeResponse(office))
	}
}
