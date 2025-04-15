package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"
	"zentra/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoleRoutes(router *gin.RouterGroup, roleService *application.RoleService) {
	roles := router.Group("/roles")
	{
		roles.POST("", middleware.PermissionChecker("ROLE_MANAGE"), handlers.CreateRole(roleService))
		roles.GET("/:id", middleware.PermissionChecker("ROLE_VIEW"), handlers.GetRole(roleService))
		roles.PUT("/:id", middleware.PermissionChecker("ROLE_MANAGE"), handlers.UpdateRole(roleService))
		roles.DELETE("/:id", middleware.PermissionChecker("ROLE_DELETE"), handlers.DeleteRole(roleService))
		roles.POST("/:id/menus", middleware.PermissionChecker("ROLE_MANAGE"), handlers.AssignMenusToRole(roleService))
		roles.POST("/:id/permissions", middleware.PermissionChecker("ROLE_MANAGE"), handlers.AssignPermissionsToRole(roleService))
		roles.DELETE("/:id/permissions", middleware.PermissionChecker("ROLE_MANAGE"), handlers.RemovePermissionsFromRole(roleService))
		roles.GET("", middleware.PermissionChecker("ROLE_VIEW"), handlers.GetAllRoles(roleService))
	}
}
