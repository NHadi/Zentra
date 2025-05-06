package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupCustomerRoutes initializes all customer-related routes
func SetupCustomerRoutes(router *gin.RouterGroup, service services.CustomerService) {
	customers := router.Group("/customers")
	{
		customers.POST("", handlers.CreateCustomer(service))
		customers.GET("", handlers.GetAllCustomers(service))
		customers.GET("/:id", handlers.GetCustomer(service))
		customers.PUT("/:id", handlers.UpdateCustomer(service))
		customers.DELETE("/:id", handlers.DeleteCustomer(service))
	}
}
