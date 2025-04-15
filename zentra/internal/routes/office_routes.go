package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupOfficeRoutes initializes office-related routes
func SetupOfficeRoutes(router *gin.RouterGroup, service *application.OfficeService) {
	offices := router.Group("/offices")
	{
		offices.POST("", handlers.CreateOffice(service))
		offices.GET("/:id", handlers.GetOffice(service))
		offices.GET("", handlers.GetAllOffices(service))
		offices.PUT("/:id", handlers.UpdateOffice(service))
		offices.DELETE("/:id", handlers.DeleteOffice(service))
		offices.GET("/by-zone", handlers.GetOfficesByZone(service))
		offices.POST("/:id/zone", handlers.AssignZone(service))
	}
}
