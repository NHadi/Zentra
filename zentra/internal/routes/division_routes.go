package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupDivisionRoutes(router *gin.RouterGroup, divisionService *application.DivisionService) {
	divisions := router.Group("/divisions")
	{
		divisions.POST("", handlers.CreateDivision(divisionService))
		divisions.PUT("/:id", handlers.UpdateDivision(divisionService))
		divisions.DELETE("/:id", handlers.DeleteDivision(divisionService))
		divisions.GET("/:id", handlers.GetDivision(divisionService))
		divisions.GET("", handlers.GetAllDivisions(divisionService))
		divisions.POST("/:id/employees", handlers.UpdateDivisionEmployees(divisionService))
	}
}
