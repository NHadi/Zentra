package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/permission"

	"github.com/gin-gonic/gin"
)

// PermissionResponse represents the permission response structure
// @Description Permission response model
type PermissionResponse struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"CREATE_USER"`
	Description string `json:"description" example:"Permission to create new users"`
	CreatedAt   string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string `json:"created_by" example:"admin"`
	UpdatedAt   string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string `json:"updated_by" example:"admin"`
	TenantID    int    `json:"tenant_id" example:"1"`
}

// CreatePermissionRequest represents the request structure for creating a permission
// @Description Create permission request model
type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required" example:"CREATE_USER"`
	Description string `json:"description" example:"Permission to create new users"`
}

// UpdatePermissionRequest represents the request structure for updating a permission
// @Description Update permission request model
type UpdatePermissionRequest struct {
	Name        string `json:"name" binding:"required" example:"CREATE_USER"`
	Description string `json:"description" example:"Permission to create new users"`
}

// AssignPermissionsRequest represents the request structure for assigning permissions to a role
// @Description Assign permissions request model
type AssignPermissionsRequest struct {
	PermissionIDs []int `json:"permission_ids" binding:"required" example:"1,2,3"`
}

func toPermissionResponse(p *permission.Permission) PermissionResponse {
	return PermissionResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		CreatedAt:   p.CreatedAt.String(),
		CreatedBy:   p.CreatedBy,
		UpdatedAt:   p.UpdatedAt.String(),
		UpdatedBy:   p.UpdatedBy,
		TenantID:    p.TenantID,
	}
}

// @Summary Create a new permission
// @Description Create a new permission with the provided details
// @Tags Permission
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param permission body CreatePermissionRequest true "Permission Data"
// @Success 201 {object} PermissionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /permissions [post]
func CreatePermission(service *application.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreatePermissionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		perm := &permission.Permission{
			Name:        req.Name,
			Description: req.Description,
		}

		if err := service.Create(perm, c.Request.Context()); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toPermissionResponse(perm))
	}
}

// @Summary Get a permission by ID
// @Description Get permission details by ID
// @Tags Permission
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Permission ID"
// @Success 200 {object} PermissionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Permission not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /permissions/{id} [get]
func GetPermission(service *application.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid permission ID"})
			return
		}

		perm, err := service.FindByID(id, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Permission not found"})
			return
		}

		c.JSON(http.StatusOK, toPermissionResponse(perm))
	}
}

// @Summary Get all permissions
// @Description Get all permissions
// @Tags Permission
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} PermissionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /permissions [get]
func GetAllPermissions(service *application.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		permissions, err := service.FindAll(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]PermissionResponse, len(permissions))
		for i, p := range permissions {
			perm := p // Create a new variable to avoid pointer issues
			response[i] = toPermissionResponse(&perm)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a permission
// @Description Update an existing permission with new details
// @Tags Permission
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Permission ID"
// @Param permission body UpdatePermissionRequest true "Permission Data"
// @Success 200 {object} PermissionResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Permission not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /permissions/{id} [put]
func UpdatePermission(service *application.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid permission ID"})
			return
		}

		var req UpdatePermissionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		perm, err := service.FindByID(id, c.Request.Context())
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Permission not found"})
			return
		}

		perm.Name = req.Name
		perm.Description = req.Description

		if err := service.Update(perm, c.Request.Context()); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toPermissionResponse(perm))
	}
}

// @Summary Delete a permission
// @Description Delete an existing permission
// @Tags Permission
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Permission ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Permission not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /permissions/{id} [delete]
func DeletePermission(service *application.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid permission ID"})
			return
		}

		if err := service.Delete(id, c.Request.Context()); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Permission deleted successfully"})
	}
}

// @Summary Assign permissions to a role
// @Description Assign a list of permissions to a specific role
// @Tags Permission
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Role ID"
// @Param permissions body AssignPermissionsRequest true "List of permission IDs"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Role not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /roles/{id}/permissions [post]
func AssignPermissionsToRole(service *application.RoleService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid role ID"})
			return
		}

		var req AssignPermissionsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.AssignPermissions(id, req.PermissionIDs, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Permissions assigned successfully"})
	}
}

// @Summary Remove permissions from a role
// @Description Remove a list of permissions from a specific role
// @Tags Permission
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Role ID"
// @Param permissions body AssignPermissionsRequest true "List of permission IDs"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Role not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /roles/{id}/permissions [delete]
func RemovePermissionsFromRole(service *application.RoleService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid role ID"})
			return
		}

		var req AssignPermissionsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		if err := service.RemovePermissions(id, req.PermissionIDs, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Permissions removed successfully"})
	}
}
