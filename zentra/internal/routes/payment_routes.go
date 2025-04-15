package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupPaymentRoutes initializes all payment-related routes
func SetupPaymentRoutes(router *gin.RouterGroup, service services.PaymentService) {
	payments := router.Group("/payments")
	{
		payments.POST("", handlers.CreatePayment(service))
		payments.GET("", handlers.GetAllPayments(service))
		payments.GET("/:id", handlers.GetPayment(service))
		payments.PUT("/:id", handlers.UpdatePayment(service))
		payments.DELETE("/:id", handlers.DeletePayment(service))
		payments.GET("/by-order", handlers.GetPaymentsByOrderID(service))
		payments.GET("/by-status", handlers.GetPaymentsByStatus(service))
	}
}
