package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupSupplierRoutes initializes supplier-related routes
func SetupSupplierRoutes(router *gin.RouterGroup, service *application.SupplierService) {
	suppliers := router.Group("/suppliers")
	{
		suppliers.POST("", handlers.CreateSupplier(service))
		suppliers.GET("/:id", handlers.GetSupplier(service))
		suppliers.GET("", handlers.GetAllSuppliers(service))
		suppliers.PUT("/:id", handlers.UpdateSupplier(service))
		suppliers.DELETE("/:id", handlers.DeleteSupplier(service))
	}
}
