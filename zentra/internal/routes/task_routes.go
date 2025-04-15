package routes

import (
	"zentra/internal/handlers"
	"zentra/internal/services"

	"github.com/gin-gonic/gin"
)

// SetupTaskRoutes initializes all task-related routes
func SetupTaskRoutes(router *gin.RouterGroup, service services.TaskService) {
	tasks := router.Group("/tasks")
	{
		tasks.POST("", handlers.CreateTask(service))
		tasks.GET("", handlers.GetAllTasks(service))
		tasks.GET("/:id", handlers.GetTask(service))
		tasks.PUT("/:id", handlers.UpdateTask(service))
		tasks.DELETE("/:id", handlers.DeleteTask(service))
		tasks.GET("/by-order-item", handlers.GetTasksByOrderItemID(service))
		tasks.GET("/by-employee", handlers.GetTasksByEmployeeID(service))
		tasks.GET("/by-status", handlers.GetTasksByStatus(service))
		tasks.GET("/by-type", handlers.GetTasksByTaskType(service))
	}
}
