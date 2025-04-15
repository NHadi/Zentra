package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupStockOpnameRoutes initializes stock opname-related routes
func SetupStockOpnameRoutes(router *gin.RouterGroup, service *application.StockOpnameService) {
	opnames := router.Group("/stock-opnames")
	{
		opnames.POST("", handlers.CreateStockOpname(service))
		opnames.GET("/:id", handlers.GetStockOpname(service))
		opnames.GET("", handlers.GetAllStockOpnames(service))
		opnames.PUT("/:id", handlers.UpdateStockOpname(service))
		opnames.DELETE("/:id", handlers.DeleteStockOpname(service))

		// Detail routes
		opnames.POST("/:id/details", handlers.AddStockOpnameDetail(service))
		opnames.PUT("/:id/details/:detail_id", handlers.UpdateStockOpnameDetail(service))
		opnames.DELETE("/:id/details/:detail_id", handlers.DeleteStockOpnameDetail(service))
	}
}
