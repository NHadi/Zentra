package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"
	"zentra/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupPermissionRoutes(router *gin.RouterGroup, permissionService *application.PermissionService) {
	permissions := router.Group("/permissions")
	{
		permissions.POST("", middleware.PermissionChecker("PERMISSION_MANAGE"), handlers.CreatePermission(permissionService))
		permissions.GET("", middleware.PermissionChecker("PERMISSION_VIEW"), handlers.GetAllPermissions(permissionService))
		permissions.GET("/:id", middleware.PermissionChecker("PERMISSION_VIEW"), handlers.GetPermission(permissionService))
		permissions.PUT("/:id", middleware.PermissionChecker("PERMISSION_MANAGE"), handlers.UpdatePermission(permissionService))
		permissions.DELETE("/:id", middleware.PermissionChecker("PERMISSION_MANAGE"), handlers.DeletePermission(permissionService))
	}
}
