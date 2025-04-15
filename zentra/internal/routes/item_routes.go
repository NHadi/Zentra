package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupItemRoutes initializes item-related routes
func SetupItemRoutes(router *gin.RouterGroup, service *application.ItemService) {
	items := router.Group("/items")
	{
		items.POST("", handlers.CreateItem(service))
		items.GET("/:id", handlers.GetItem(service))
		items.GET("", handlers.GetAllItems(service))
		items.PUT("/:id", handlers.UpdateItem(service))
		items.DELETE("/:id", handlers.DeleteItem(service))
	}
}
