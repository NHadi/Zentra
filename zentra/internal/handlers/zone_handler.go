package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/models"
	"zentra/internal/domain/region"
	"zentra/internal/domain/zone"

	"github.com/gin-gonic/gin"
)

// RegionInfo represents the region information in zone response
type RegionInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"North Region"`
	Description string `json:"description" example:"Northern region"`
}

// OfficeInfo represents the office information in zone response
type OfficeInfo struct {
	ID      int    `json:"id" example:"1"`
	Name    string `json:"name" example:"Main Office"`
	Code    string `json:"code" example:"OFF-001"`
	Address string `json:"address" example:"123 Main St"`
	Phone   string `json:"phone" example:"+1234567890"`
}

// ZoneResponse represents the zone response structure
// @Description Zone response model
type ZoneResponse struct {
	ID          int          `json:"id" example:"1"`
	Name        string       `json:"name" example:"North Zone"`
	RegionID    *int         `json:"region_id" example:"1"`
	Region      *RegionInfo  `json:"region,omitempty"`
	Description string       `json:"description" example:"Northern region zone"`
	CreatedAt   string       `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string       `json:"created_by" example:"admin"`
	UpdatedAt   string       `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string       `json:"updated_by" example:"admin"`
	TenantID    int          `json:"tenant_id" example:"1"`
	Offices     []OfficeInfo `json:"offices,omitempty"`
}

// CreateZoneRequest represents the request structure for creating a zone
// @Description Create zone request model
type CreateZoneRequest struct {
	Name        string `json:"name" binding:"required" example:"North Zone"`
	RegionID    *int   `json:"region_id" example:"1"`
	Description string `json:"description" example:"Northern region zone"`
}

// UpdateZoneRequest represents the request structure for updating a zone
// @Description Update zone request model
type UpdateZoneRequest struct {
	Name        string `json:"name" binding:"required" example:"North Zone"`
	RegionID    *int   `json:"region_id" example:"1"`
	Description string `json:"description" example:"Northern region zone"`
}

// AssignOfficesRequest represents the request structure for assigning offices to a zone
type AssignOfficesRequest struct {
	OfficeIDs []int `json:"office_ids" binding:"required"`
}

func toZoneResponse(z *zone.Zone, r *region.Region) ZoneResponse {
	response := ZoneResponse{
		ID:          z.ID,
		Name:        z.Name,
		RegionID:    z.RegionID,
		Description: z.Description,
		CreatedAt:   z.CreatedAt.String(),
		CreatedBy:   z.CreatedBy,
		UpdatedAt:   z.UpdatedAt.String(),
		UpdatedBy:   z.UpdatedBy,
		TenantID:    z.TenantID,
	}

	if r != nil {
		response.Region = &RegionInfo{
			ID:          r.ID,
			Name:        r.Name,
			Description: r.Description,
		}
	}

	// Convert offices to OfficeInfo
	if z.Offices != nil {
		response.Offices = make([]OfficeInfo, len(z.Offices))
		for i, office := range z.Offices {
			response.Offices[i] = OfficeInfo{
				ID:      office.ID,
				Name:    office.Name,
				Code:    office.Code,
				Address: office.Address,
				Phone:   office.Phone,
			}
		}
	}

	return response
}

// @Summary Create a new zone
// @Description Create a new zone with the provided details
// @Tags Zone
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param zone body CreateZoneRequest true "Zone Data"
// @Success 201 {object} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones [post]
func CreateZone(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateZoneRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		zone := &zone.Zone{
			Zone: models.Zone{
				Name:        req.Name,
				RegionID:    req.RegionID,
				Description: req.Description,
			},
		}

		if err := service.Create(zone, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created zone with region info
		createdZone, region, err := service.FindByID(zone.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created zone"})
			return
		}

		c.JSON(http.StatusCreated, toZoneResponse(createdZone, region))
	}
}

// @Summary Get a zone by ID
// @Description Get zone details by ID
// @Tags Zone
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Zone ID"
// @Success 200 {object} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Zone not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/{id} [get]
func GetZone(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		zone, region, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Zone not found"})
			return
		}

		c.JSON(http.StatusOK, toZoneResponse(zone, region))
	}
}

// @Summary Get all zones
// @Description Get all zones
// @Tags Zone
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones [get]
func GetAllZones(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		zones, regions, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ZoneResponse, len(zones))
		for i, z := range zones {
			response[i] = toZoneResponse(&z, regions[i])
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a zone
// @Description Update an existing zone with new details
// @Tags Zone
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Zone ID"
// @Param zone body UpdateZoneRequest true "Zone Data"
// @Success 200 {object} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Zone not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/{id} [put]
func UpdateZone(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		var req UpdateZoneRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		zone, _, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Zone not found"})
			return
		}

		zone.Name = req.Name
		zone.RegionID = req.RegionID
		zone.Description = req.Description

		if err := service.Update(zone, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated zone with region info
		updatedZone, region, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated zone"})
			return
		}

		c.JSON(http.StatusOK, toZoneResponse(updatedZone, region))
	}
}

// @Summary Delete a zone
// @Description Delete an existing zone
// @Tags Zone
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Zone ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Zone not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/{id} [delete]
func DeleteZone(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Zone deleted successfully"})
	}
}

// @Summary Get zones by region
// @Description Get all zones for a specific region
// @Tags Zone
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param region_id query int true "Region ID" example:"1"
// @Success 200 {array} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/by-region [get]
func GetZonesByRegion(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		regionID, err := strconv.Atoi(c.Query("region_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid region ID"})
			return
		}

		zones, regions, err := service.FindByRegionID(regionID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ZoneResponse, len(zones))
		for i, z := range zones {
			response[i] = toZoneResponse(&z, regions[i])
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Assign offices to a zone
// @Description Assign offices to an existing zone
// @Tags Zone
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Zone ID"
// @Param request body AssignOfficesRequest true "Office IDs"
// @Success 200 {object} ZoneResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Zone not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/{id}/offices [post]
func AssignOffices(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		var req AssignOfficesRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		zone, region, err := service.AssignOffices(id, req.OfficeIDs, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toZoneResponse(zone, region))
	}
}

// @Summary Remove offices from a zone
// @Description Remove offices from an existing zone
// @Tags Zone
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Zone ID"
// @Param request body AssignOfficesRequest true "Office IDs"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Zone not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /zones/{id}/offices [delete]
func RemoveOffices(service *application.ZoneService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid zone ID"})
			return
		}

		var req AssignOfficesRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.RemoveOffices(id, req.OfficeIDs, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Offices removed successfully"})
	}
}
