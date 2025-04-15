package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupEmployeeRoutes(router *gin.RouterGroup, employeeService *application.EmployeeService, divisionService *application.DivisionService) {
	employees := router.Group("/employees")
	{
		employees.POST("", handlers.CreateEmployee(employeeService, divisionService))
		employees.PUT("/:id", handlers.UpdateEmployee(employeeService, divisionService))
		employees.DELETE("/:id", handlers.DeleteEmployee(employeeService))
		employees.GET("/:id", handlers.GetEmployee(employeeService, divisionService))
		employees.GET("", handlers.GetAllEmployees(employeeService, divisionService))

	}
}
