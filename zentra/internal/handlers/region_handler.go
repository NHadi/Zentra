package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/region"
	"zentra/internal/domain/zone"

	"github.com/gin-gonic/gin"
)

// RegionResponse represents the region response structure
// @Description Region response model
type RegionResponse struct {
	ID          int         `json:"id" example:"1"`
	Name        string      `json:"name" example:"North Region"`
	Description string      `json:"description" example:"Northern region"`
	CreatedAt   string      `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string      `json:"created_by" example:"admin"`
	UpdatedAt   string      `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string      `json:"updated_by" example:"admin"`
	TenantID    int         `json:"tenant_id" example:"1"`
	Zones       []zone.Zone `json:"zones,omitempty"`
}

// CreateRegionRequest represents the request structure for creating a region
// @Description Create region request model
type CreateRegionRequest struct {
	Name        string `json:"name" binding:"required" example:"North Region"`
	Description string `json:"description" example:"Northern region"`
}

// UpdateRegionRequest represents the request structure for updating a region
// @Description Update region request model
type UpdateRegionRequest struct {
	Name        string `json:"name" binding:"required" example:"North Region"`
	Description string `json:"description" example:"Northern region"`
}

// AssignZonesRequest represents the request structure for assigning zones to a region
// @Description Assign zones request model
type AssignZonesRequest struct {
	ZoneIDs []int `json:"zone_ids" binding:"required" example:"[1,2,3]"`
}

func toRegionResponse(r *region.Region) RegionResponse {
	return RegionResponse{
		ID:          r.ID,
		Name:        r.Name,
		Description: r.Description,
		CreatedAt:   r.CreatedAt.String(),
		CreatedBy:   r.CreatedBy,
		UpdatedAt:   r.UpdatedAt.String(),
		UpdatedBy:   r.UpdatedBy,
		TenantID:    r.TenantID,
		Zones:       r.Zones,
	}
}

// @Summary Create a new region
// @Description Create a new region with the provided details
// @Tags Region
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param region body CreateRegionRequest true "Region Data"
// @Success 201 {object} RegionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions [post]
func CreateRegion(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateRegionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		region := &region.Region{
			Name:        req.Name,
			Description: req.Description,
		}

		if err := service.Create(region, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toRegionResponse(region))
	}
}

// @Summary Get a region by ID
// @Description Get region details by ID
// @Tags Region
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Region ID"
// @Success 200 {object} RegionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Region not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions/{id} [get]
func GetRegion(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid region ID"})
			return
		}

		region, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Region not found"})
			return
		}

		c.JSON(http.StatusOK, toRegionResponse(region))
	}
}

// @Summary Get all regions
// @Description Get all regions
// @Tags Region
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} RegionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions [get]
func GetAllRegions(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		regions, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]RegionResponse, len(regions))
		for i, r := range regions {
			response[i] = toRegionResponse(&r)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a region
// @Description Update an existing region with new details
// @Tags Region
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Region ID"
// @Param region body UpdateRegionRequest true "Region Data"
// @Success 200 {object} RegionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Region not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions/{id} [put]
func UpdateRegion(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid region ID"})
			return
		}

		var req UpdateRegionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		region, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Region not found"})
			return
		}

		region.Name = req.Name
		region.Description = req.Description

		if err := service.Update(region, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toRegionResponse(region))
	}
}

// @Summary Delete a region
// @Description Delete an existing region
// @Tags Region
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Region ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Region not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions/{id} [delete]
func DeleteRegion(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid region ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Region deleted successfully"})
	}
}

// @Summary Assign zones to a region
// @Description Assign zones to a specific region
// @Tags Region
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Region ID"
// @Param request body AssignZonesRequest true "Zone IDs to assign"
// @Success 200 {object} RegionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Region not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /regions/{id}/zones [post]
func AssignZones(service *application.RegionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid region ID"})
			return
		}

		var req AssignZonesRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		region, err := service.AssignZones(id, req.ZoneIDs, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toRegionResponse(region))
	}
}
