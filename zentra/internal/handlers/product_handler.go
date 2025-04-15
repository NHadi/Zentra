package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/product"

	"github.com/gin-gonic/gin"
)

// ProductResponse represents the product response structure
// @Description Product response model
type ProductResponse struct {
	ID                   int             `json:"id" example:"1"`
	Name                 string          `json:"name" example:"Pro Soccer Jersey"`
	Code                 string          `json:"code" example:"PSJ001"`
	CategoryID           int             `json:"category_id" example:"1"`
	Category             *CategoryInfo   `json:"category,omitempty"`
	Description          string          `json:"description" example:"Professional grade soccer jersey"`
	Material             string          `json:"material" example:"Premium Polyester"`
	SizeAvailable        []string        `json:"size_available" example:"[\"S\", \"M\", \"L\", \"XL\", \"XXL\"]"`
	ColorOptions         []string        `json:"color_options" example:"[\"Red/White\", \"Blue/White\", \"Green/White\", \"Custom\"]"`
	CustomizationOptions map[string]bool `json:"customization_options" example:"name:true,number:true,team_logo:true,patches:true"`
	ProductionTime       int             `json:"production_time" example:"5"`
	MinOrderQuantity     int             `json:"min_order_quantity" example:"1"`
	BasePrice            float64         `json:"base_price" example:"49.99"`
	BulkDiscountRules    map[string]int  `json:"bulk_discount_rules" example:"10:5,20:10,50:15"`
	Weight               float64         `json:"weight" example:"180"`
	IsActive             bool            `json:"is_active" example:"true"`
	StockStatus          string          `json:"stock_status" example:"in_stock"`
	Images               []ImageInfo     `json:"images,omitempty"`
	CreatedAt            string          `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy            string          `json:"created_by" example:"admin"`
	UpdatedAt            string          `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy            string          `json:"updated_by" example:"admin"`
	TenantID             int             `json:"tenant_id" example:"1"`
}

// CategoryInfo represents the category information in product response
type CategoryInfo struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"Soccer Jersey"`
	Code        string `json:"code" example:"SOCCER"`
	Description string `json:"description" example:"Soccer team jerseys and uniforms"`
}

// ImageInfo represents the image information in product response
type ImageInfo struct {
	ID        int    `json:"id" example:"1"`
	ProductID int    `json:"product_id" example:"1"`
	ImageURL  string `json:"image_url" example:"/uploads/products/image.jpg"`
	SortOrder int    `json:"sort_order" example:"1"`
	IsPrimary bool   `json:"is_primary" example:"true"`
}

// CreateProductRequest represents the request structure for creating a product
// @Description Create product request model
type CreateProductRequest struct {
	Name                 string          `json:"name" binding:"required" example:"Pro Soccer Jersey"`
	Code                 string          `json:"code" binding:"required" example:"PSJ001"`
	CategoryID           int             `json:"category_id" binding:"required" example:"1"`
	Description          string          `json:"description" example:"Professional grade soccer jersey"`
	Material             string          `json:"material" example:"Premium Polyester"`
	SizeAvailable        []string        `json:"size_available" example:"[\"S\", \"M\", \"L\", \"XL\", \"XXL\"]"`
	ColorOptions         []string        `json:"color_options" example:"[\"Red/White\", \"Blue/White\", \"Green/White\", \"Custom\"]"`
	CustomizationOptions map[string]bool `json:"customization_options" example:"name:true,number:true,team_logo:true,patches:true"`
	ProductionTime       int             `json:"production_time" example:"5"`
	MinOrderQuantity     int             `json:"min_order_quantity" binding:"required,min=1" example:"1"`
	BasePrice            float64         `json:"base_price" binding:"required,min=0" example:"49.99"`
	BulkDiscountRules    map[string]int  `json:"bulk_discount_rules" example:"10:5,20:10,50:15"`
	Weight               float64         `json:"weight" example:"180"`
}

// UpdateProductRequest represents the request structure for updating a product
// @Description Update product request model
type UpdateProductRequest struct {
	Name                 string          `json:"name" binding:"required" example:"Pro Soccer Jersey"`
	Code                 string          `json:"code" binding:"required" example:"PSJ001"`
	CategoryID           int             `json:"category_id" binding:"required" example:"1"`
	Description          string          `json:"description" example:"Professional grade soccer jersey"`
	Material             string          `json:"material" example:"Premium Polyester"`
	SizeAvailable        []string        `json:"size_available" example:"[\"S\", \"M\", \"L\", \"XL\", \"XXL\"]"`
	ColorOptions         []string        `json:"color_options" example:"[\"Red/White\", \"Blue/White\", \"Green/White\", \"Custom\"]"`
	CustomizationOptions map[string]bool `json:"customization_options" example:"name:true,number:true,team_logo:true,patches:true"`
	ProductionTime       int             `json:"production_time" example:"5"`
	MinOrderQuantity     int             `json:"min_order_quantity" binding:"required,min=1" example:"1"`
	BasePrice            float64         `json:"base_price" binding:"required,min=0" example:"49.99"`
	BulkDiscountRules    map[string]int  `json:"bulk_discount_rules" example:"10:5,20:10,50:15"`
	Weight               float64         `json:"weight" example:"180"`
	IsActive             bool            `json:"is_active" example:"true"`
	StockStatus          string          `json:"stock_status" example:"in_stock"`
}

func toProductResponse(p *product.Product, c *product.Category) ProductResponse {
	response := ProductResponse{
		ID:                   p.ID,
		Name:                 p.Name,
		Code:                 p.Code,
		CategoryID:           p.CategoryID,
		Description:          p.Description,
		Material:             p.Material,
		SizeAvailable:        p.SizeAvailable,
		ColorOptions:         p.ColorOptions,
		CustomizationOptions: p.CustomizationOptions,
		ProductionTime:       p.ProductionTime,
		MinOrderQuantity:     p.MinOrderQuantity,
		BasePrice:            p.BasePrice,
		BulkDiscountRules:    p.BulkDiscountRules,
		Weight:               p.Weight,
		IsActive:             p.IsActive,
		StockStatus:          p.StockStatus,
		CreatedAt:            p.CreatedAt.String(),
		CreatedBy:            p.CreatedBy,
		UpdatedAt:            p.UpdatedAt.String(),
		UpdatedBy:            p.UpdatedBy,
		TenantID:             p.TenantID,
	}

	if c != nil {
		response.Category = &CategoryInfo{
			ID:          c.ID,
			Name:        c.Name,
			Code:        c.Code,
			Description: c.Description,
		}
	}

	// Add images to response
	if len(p.Images) > 0 {
		response.Images = make([]ImageInfo, len(p.Images))
		for i, img := range p.Images {
			response.Images[i] = ImageInfo{
				ID:        img.ID,
				ProductID: img.ProductID,
				ImageURL:  img.ImageURL,
				SortOrder: img.SortOrder,
				IsPrimary: img.IsPrimary,
			}
		}
	}

	return response
}

// @Summary Create a new product
// @Description Create a new product with the provided details
// @Tags Product
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param product body CreateProductRequest true "Product Data"
// @Success 201 {object} ProductResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products [post]
func CreateProduct(service *application.ProductService, categoryService *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateProductRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if code already exists
		existing, err := service.FindByCode(req.Code, c)
		if err == nil && existing != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Product code already exists"})
			return
		}

		// Check if category exists
		category, err := categoryService.FindByID(req.CategoryID, c)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		product := &product.Product{
			Name:                 req.Name,
			Code:                 req.Code,
			CategoryID:           req.CategoryID,
			Description:          req.Description,
			Material:             req.Material,
			SizeAvailable:        req.SizeAvailable,
			ColorOptions:         req.ColorOptions,
			CustomizationOptions: req.CustomizationOptions,
			ProductionTime:       req.ProductionTime,
			MinOrderQuantity:     req.MinOrderQuantity,
			BasePrice:            req.BasePrice,
			BulkDiscountRules:    req.BulkDiscountRules,
			Weight:               req.Weight,
			IsActive:             true,
			StockStatus:          "in_stock",
		}

		if err := service.Create(product, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created product
		createdProduct, err := service.FindByID(product.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created product"})
			return
		}

		c.JSON(http.StatusCreated, toProductResponse(createdProduct, category))
	}
}

// @Summary Get a product by ID
// @Description Get product details by ID
// @Tags Product
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product ID"
// @Success 200 {object} ProductResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products/{id} [get]
func GetProduct(service *application.ProductService, categoryService *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid product ID"})
			return
		}

		product, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Product not found"})
			return
		}

		category, err := categoryService.FindByID(product.CategoryID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch category details"})
			return
		}

		c.JSON(http.StatusOK, toProductResponse(product, category))
	}
}

// @Summary Get all products
// @Description Get all products
// @Tags Product
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} ProductResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products [get]
func GetAllProducts(service *application.ProductService, categoryService *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		products, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ProductResponse, len(products))
		for i, p := range products {
			category, err := categoryService.FindByID(p.CategoryID, c)
			if err != nil {
				c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch category details"})
				return
			}
			response[i] = toProductResponse(&p, category)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a product
// @Description Update an existing product with new details
// @Tags Product
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product ID"
// @Param product body UpdateProductRequest true "Product Data"
// @Success 200 {object} ProductResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products/{id} [put]
func UpdateProduct(service *application.ProductService, categoryService *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid product ID"})
			return
		}

		var req UpdateProductRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if code already exists for a different product
		existing, err := service.FindByCode(req.Code, c)
		if err == nil && existing != nil && existing.ID != id {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Product code already exists"})
			return
		}

		// Check if category exists
		category, err := categoryService.FindByID(req.CategoryID, c)
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		product := &product.Product{
			ID:                   id,
			Name:                 req.Name,
			Code:                 req.Code,
			CategoryID:           req.CategoryID,
			Description:          req.Description,
			Material:             req.Material,
			SizeAvailable:        req.SizeAvailable,
			ColorOptions:         req.ColorOptions,
			CustomizationOptions: req.CustomizationOptions,
			ProductionTime:       req.ProductionTime,
			MinOrderQuantity:     req.MinOrderQuantity,
			BasePrice:            req.BasePrice,
			BulkDiscountRules:    req.BulkDiscountRules,
			Weight:               req.Weight,
			IsActive:             req.IsActive,
			StockStatus:          req.StockStatus,
		}

		if err := service.Update(product, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated product
		updatedProduct, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated product"})
			return
		}

		c.JSON(http.StatusOK, toProductResponse(updatedProduct, category))
	}
}

// @Summary Delete a product
// @Description Delete an existing product
// @Tags Product
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products/{id} [delete]
func DeleteProduct(service *application.ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid product ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	}
}

// @Summary Get products by category
// @Description Get all products belonging to a specific category
// @Tags Product
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param category_id path int true "Category ID"
// @Success 200 {array} ProductResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /products/category/{category_id} [get]
func GetProductsByCategory(service *application.ProductService, categoryService *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		categoryID, err := strconv.Atoi(c.Param("category_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		// Check if category exists
		category, err := categoryService.FindByID(categoryID, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Category not found"})
			return
		}

		products, err := service.FindByCategoryID(categoryID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ProductResponse, len(products))
		for i, p := range products {
			response[i] = toProductResponse(&p, category)
		}

		c.JSON(http.StatusOK, response)
	}
}
