package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"
	"zentra/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupMenuRoutes(router *gin.RouterGroup, menuService *application.MenuService) {
	menus := router.Group("/menus")
	{
		menus.POST("", middleware.PermissionChecker("MENU_MANAGE"), handlers.CreateMenu(menuService))
		menus.PUT("/:id", middleware.PermissionChecker("MENU_MANAGE"), handlers.UpdateMenu(menuService))
		menus.DELETE("/:id", middleware.PermissionChecker("MENU_MANAGE"), handlers.DeleteMenu(menuService))
		menus.GET("/:id", middleware.PermissionChecker("MENU_VIEW"), handlers.GetMenu(menuService))
		menus.GET("", middleware.PermissionChecker("MENU_VIEW"), handlers.GetAllMenus(menuService))
		menus.GET("/by-role", middleware.PermissionChecker("MENU_VIEW"), handlers.GetMenusByRole(menuService))
		menus.GET("/by-user/:user_id", middleware.PermissionChecker("MENU_VIEW"), handlers.GetMenusByUser(menuService))
	}
}
