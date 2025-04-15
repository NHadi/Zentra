package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/domain/audit"

	"github.com/gin-gonic/gin"
)

// AuditResponse represents the response structure for audit trail entries
// @Description Audit trail entry response model
type AuditResponse struct {
	ID         int         `json:"id" example:"1"`
	EntityType string      `json:"entity_type" example:"user"`
	EntityID   int         `json:"entity_id" example:"123"`
	Action     string      `json:"action" example:"create"`
	OldValues  interface{} `json:"old_values,omitempty"`
	NewValues  interface{} `json:"new_values,omitempty"`
	CreatedAt  string      `json:"created_at" example:"2024-01-01 12:00:00"`
	CreatedBy  string      `json:"created_by" example:"john.doe@example.com"`
	TenantID   int         `json:"tenant_id" example:"1"`
}

func toAuditResponse(audit audit.AuditTrail) AuditResponse {
	return AuditResponse{
		ID:         audit.ID,
		EntityType: audit.EntityType,
		EntityID:   audit.EntityID,
		Action:     string(audit.Action),
		OldValues:  audit.OldValues,
		NewValues:  audit.NewValues,
		CreatedAt:  audit.CreatedAt.Format("2006-01-02 15:04:05"),
		CreatedBy:  audit.CreatedBy,
		TenantID:   audit.TenantModel.TenantID,
	}
}

// @Summary Get entity audit history
// @Description Get audit history for a specific entity
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param type path string true "Entity Type" example:"user"
// @Param id path int true "Entity ID" example:"123"
// @Success 200 {array} AuditResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /audits/entity/{type}/{id} [get]
func GetEntityAuditHistory(service *audit.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		entityType := c.Param("type")
		entityID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid entity ID"})
			return
		}

		audits, err := service.GetEntityHistory(entityType, entityID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]AuditResponse, len(audits))
		for i, a := range audits {
			response[i] = toAuditResponse(a)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get tenant audit history
// @Description Get audit history for a specific tenant
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Tenant ID" example:"1"
// @Success 200 {array} AuditResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /audits/tenant/{id} [get]
func GetTenantAuditHistory(service *audit.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid tenant ID"})
			return
		}

		audits, err := service.GetTenantHistory(tenantID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]AuditResponse, len(audits))
		for i, a := range audits {
			response[i] = toAuditResponse(a)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get audit history by date range
// @Description Get audit history within a specific date range
// @Tags Audit
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param start_date query string true "Start Date (YYYY-MM-DD)" example:"2024-01-01"
// @Param end_date query string true "End Date (YYYY-MM-DD)" example:"2024-01-31"
// @Param entity_type query string false "Filter by Entity Type" example:"user"
// @Param action query string false "Filter by Action" example:"create"
// @Success 200 {array} AuditResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /audits/date-range [get]
func GetAuditHistoryByDateRange(service *audit.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")
		entityType := c.Query("entity_type")
		action := c.Query("action")

		if startDate == "" || endDate == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Start date and end date are required"})
			return
		}

		audits, err := service.GetHistoryByDateRange(startDate, endDate, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Apply filters if provided
		filteredAudits := audits
		if entityType != "" {
			var filtered []audit.AuditTrail
			for _, a := range filteredAudits {
				if a.EntityType == entityType {
					filtered = append(filtered, a)
				}
			}
			filteredAudits = filtered
		}

		if action != "" {
			var filtered []audit.AuditTrail
			for _, a := range filteredAudits {
				if string(a.Action) == action {
					filtered = append(filtered, a)
				}
			}
			filteredAudits = filtered
		}

		response := make([]AuditResponse, len(filteredAudits))
		for i, a := range filteredAudits {
			response[i] = toAuditResponse(a)
		}

		c.JSON(http.StatusOK, response)
	}
}
