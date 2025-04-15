package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupStockMovementRoutes initializes stock movement-related routes
func SetupStockMovementRoutes(router *gin.RouterGroup, service *application.StockMovementService) {
	movements := router.Group("/stock-movements")
	{
		movements.POST("", handlers.CreateStockMovement(service))
		movements.GET("/:id", handlers.GetStockMovement(service))
		movements.GET("", handlers.GetAllStockMovements(service))
		movements.GET("/by-item", handlers.GetStockMovementsByItem(service))
		movements.GET("/by-reference", handlers.GetStockMovementsByReference(service))
	}
}
