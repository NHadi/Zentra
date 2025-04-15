package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupZoneRoutes initializes zone-related routes
func SetupZoneRoutes(router *gin.RouterGroup, service *application.ZoneService) {
	zones := router.Group("/zones")
	{
		zones.POST("", handlers.CreateZone(service))
		zones.GET("/:id", handlers.GetZone(service))
		zones.GET("", handlers.GetAllZones(service))
		zones.PUT("/:id", handlers.UpdateZone(service))
		zones.DELETE("/:id", handlers.DeleteZone(service))
		zones.GET("/by-region", handlers.GetZonesByRegion(service))
	}
}
