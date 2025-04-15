package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"
	"zentra/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupUserRoutes(router *gin.RouterGroup, userService *application.UserService) {
	users := router.Group("/users")
	{
		users.GET("", middleware.PermissionChecker("USER_VIEW"), handlers.GetUsers(userService))
		users.POST("", middleware.PermissionChecker("USER_MANAGE"), handlers.CreateUser(userService))
		users.GET("/:id", middleware.PermissionChecker("USER_VIEW"), handlers.GetUser(userService))
		users.PUT("/:id", middleware.PermissionChecker("USER_MANAGE"), handlers.UpdateUser(userService))
		users.DELETE("/:id", middleware.PermissionChecker("USER_DELETE"), handlers.DeleteUser(userService))
	}
}
