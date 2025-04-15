package routes

import (
	"zentra/internal/application"
	"zentra/internal/domain/product"
	"zentra/internal/handlers"

	"github.com/gin-gonic/gin"
)

// SetupProductRoutes sets up the product routes
func SetupProductRoutes(router *gin.RouterGroup, productService *application.ProductService, categoryService *application.ProductCategoryService, productImageService product.ProductImageService) {
	productGroup := router.Group("/products")
	{
		productGroup.POST("", handlers.CreateProduct(productService, categoryService))
		productGroup.GET("", handlers.GetAllProducts(productService, categoryService))
		productGroup.GET("/:id", handlers.GetProduct(productService, categoryService))
		productGroup.PUT("/:id", handlers.UpdateProduct(productService, categoryService))
		productGroup.DELETE("/:id", handlers.DeleteProduct(productService))
		productGroup.GET("/category/:category_id", handlers.GetProductsByCategory(productService, categoryService))

		// Product Image routes
		productImageHandler := handlers.NewProductImageHandler(productImageService)
		productGroup.POST("/:id/images", productImageHandler.CreateProductImage)
		productGroup.GET("/:id/images", productImageHandler.GetProductImages)
		productGroup.GET("/images/:id", productImageHandler.GetProductImage)
		productGroup.PUT("/images/:id", productImageHandler.UpdateProductImage)
		productGroup.DELETE("/images/:id", productImageHandler.DeleteProductImage)
		productGroup.PUT("/images/:id/order", productImageHandler.UpdateProductImageOrder)
		productGroup.PUT("/:id/images/:imageId/primary", productImageHandler.SetPrimaryImage)
	}
}
