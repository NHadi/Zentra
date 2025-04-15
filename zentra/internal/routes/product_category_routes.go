package routes

import (
	"zentra/internal/application"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupProductCategoryRoutes sets up the product category routes
func SetupProductCategoryRoutes(router *gin.RouterGroup, categoryService *application.ProductCategoryService) {
	categoryGroup := router.Group("/product-categories")
	{
		categoryGroup.POST("", handlers.CreateProductCategory(categoryService))
		categoryGroup.GET("", handlers.GetAllProductCategories(categoryService))
		categoryGroup.GET("/:id", handlers.GetProductCategory(categoryService))
		categoryGroup.PUT("/:id", handlers.UpdateProductCategory(categoryService))
		categoryGroup.DELETE("/:id", handlers.DeleteProductCategory(categoryService))
	}
}
