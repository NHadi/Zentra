package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupOrderRoutes initializes all order-related routes
func SetupOrderRoutes(router *gin.RouterGroup, service services.OrderService) {
	orders := router.Group("/orders")
	{
		orders.POST("", handlers.CreateOrder(service))
		orders.GET("", handlers.GetAllOrders(service))
		orders.GET("/:id", handlers.GetOrder(service))
		orders.PUT("/:id", handlers.UpdateOrder(service))
		orders.DELETE("/:id", handlers.DeleteOrder(service))
		orders.GET("/by-customer", handlers.GetOrdersByCustomerEmail(service))
		orders.GET("/by-status", handlers.GetOrdersByStatus(service))
		orders.GET("/by-payment-status", handlers.GetOrdersByPaymentStatus(service))
		orders.PUT("/:id/status", handlers.UpdateOrderStatus(service))
		orders.PUT("/bulk-status-update", handlers.BulkUpdateOrderStatus(service))
	}
}
