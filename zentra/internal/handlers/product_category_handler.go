package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/product"

	"github.com/gin-gonic/gin"
)

// ProductCategoryResponse represents the product category response structure
// @Description Product category response model
type ProductCategoryResponse struct {
	ID          int    `json:"id" example:"1"`
	Name        string `json:"name" example:"Soccer Jersey"`
	Code        string `json:"code" example:"SOCCER"`
	Description string `json:"description" example:"Soccer team jerseys and uniforms"`
	IsActive    bool   `json:"is_active" example:"true"`
	CreatedAt   string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string `json:"created_by" example:"admin"`
	UpdatedAt   string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string `json:"updated_by" example:"admin"`
	TenantID    int    `json:"tenant_id" example:"1"`
}

// CreateProductCategoryRequest represents the request structure for creating a product category
// @Description Create product category request model
type CreateProductCategoryRequest struct {
	Name        string `json:"name" binding:"required" example:"Soccer Jersey"`
	Code        string `json:"code" binding:"required" example:"SOCCER"`
	Description string `json:"description" example:"Soccer team jerseys and uniforms"`
}

// UpdateProductCategoryRequest represents the request structure for updating a product category
// @Description Update product category request model
type UpdateProductCategoryRequest struct {
	Name        string `json:"name" binding:"required" example:"Soccer Jersey"`
	Code        string `json:"code" binding:"required" example:"SOCCER"`
	Description string `json:"description" example:"Soccer team jerseys and uniforms"`
	IsActive    bool   `json:"is_active" example:"true"`
}

func toProductCategoryResponse(c *product.Category) ProductCategoryResponse {
	return ProductCategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Code:        c.Code,
		Description: c.Description,
		IsActive:    c.IsActive,
		CreatedAt:   c.CreatedAt.String(),
		CreatedBy:   c.CreatedBy,
		UpdatedAt:   c.UpdatedAt.String(),
		UpdatedBy:   c.UpdatedBy,
		TenantID:    c.TenantID,
	}
}

// @Summary Create a new product category
// @Description Create a new product category with the provided details
// @Tags Product Category
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param category body CreateProductCategoryRequest true "Product Category Data"
// @Success 201 {object} ProductCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /product-categories [post]
func CreateProductCategory(service *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateProductCategoryRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if code already exists
		existing, err := service.FindByCode(req.Code, c)
		if err == nil && existing != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Category code already exists"})
			return
		}

		category := &product.Category{
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			IsActive:    true,
		}

		if err := service.Create(category, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created category
		createdCategory, err := service.FindByID(category.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created category"})
			return
		}

		c.JSON(http.StatusCreated, toProductCategoryResponse(createdCategory))
	}
}

// @Summary Get a product category by ID
// @Description Get product category details by ID
// @Tags Product Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product Category ID"
// @Success 200 {object} ProductCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /product-categories/{id} [get]
func GetProductCategory(service *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		category, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Product category not found"})
			return
		}

		c.JSON(http.StatusOK, toProductCategoryResponse(category))
	}
}

// @Summary Get all product categories
// @Description Get all product categories
// @Tags Product Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} ProductCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /product-categories [get]
func GetAllProductCategories(service *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		categories, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]ProductCategoryResponse, len(categories))
		for i, c := range categories {
			response[i] = toProductCategoryResponse(&c)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a product category
// @Description Update an existing product category with new details
// @Tags Product Category
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product Category ID"
// @Param category body UpdateProductCategoryRequest true "Product Category Data"
// @Success 200 {object} ProductCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /product-categories/{id} [put]
func UpdateProductCategory(service *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		var req UpdateProductCategoryRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if code already exists for a different category
		existing, err := service.FindByCode(req.Code, c)
		if err == nil && existing != nil && existing.ID != id {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Category code already exists"})
			return
		}

		category := &product.Category{
			ID:          id,
			Name:        req.Name,
			Code:        req.Code,
			Description: req.Description,
			IsActive:    req.IsActive,
		}

		if err := service.Update(category, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated category
		updatedCategory, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated category"})
			return
		}

		c.JSON(http.StatusOK, toProductCategoryResponse(updatedCategory))
	}
}

// @Summary Delete a product category
// @Description Delete an existing product category
// @Tags Product Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Product Category ID"
// @Success 204 "No Content"
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Product category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /product-categories/{id} [delete]
func DeleteProductCategory(service *application.ProductCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid category ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.Status(http.StatusNoContent)
	}
}
