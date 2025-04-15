package handlers

import (
	"log"
	"net/http"
	"strconv"
	"zentra/internal/domain/product"

	"github.com/gin-gonic/gin"
)

// ProductImageHandler handles HTTP requests for product images
type ProductImageHandler struct {
	productImageService product.ProductImageService
}

// NewProductImageHandler creates a new product image handler
func NewProductImageHandler(productImageService product.ProductImageService) *ProductImageHandler {
	return &ProductImageHandler{
		productImageService: productImageService,
	}
}

// CreateProductImage handles the creation of a new product image
func (h *ProductImageHandler) CreateProductImage(c *gin.Context) {
	// Get product ID from path parameter
	productID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get the file from the request
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	// Log file details
	log.Printf("Received file upload - filename: %s, size: %d, content_type: %s",
		file.Filename,
		file.Size,
		file.Header.Get("Content-Type"),
	)

	// Validate file type
	if !isValidImageType(file.Header.Get("Content-Type")) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image type. Supported types: image/jpeg, image/png, image/gif"})
		return
	}

	// Create a new product image object
	image := &product.ProductImage{
		ProductID: productID,
		ImageURL:  "", // Will be set by the service
		SortOrder: 0,  // Default sort order
		IsPrimary: false,
	}

	// Pass both the image object and file to the service
	if err := h.productImageService.CreateProductImage(c.Request.Context(), image, file); err != nil {
		log.Printf("Failed to create product image: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, image)
}

// isValidImageType checks if the provided content type is a valid image type
func isValidImageType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
	}
	return validTypes[contentType]
}

// GetProductImage handles retrieving a product image by ID
func (h *ProductImageHandler) GetProductImage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	image, err := h.productImageService.GetProductImage(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, image)
}

// GetProductImages handles retrieving all images for a product
func (h *ProductImageHandler) GetProductImages(c *gin.Context) {
	productID, err := strconv.Atoi(c.Param("productId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	images, err := h.productImageService.GetProductImages(c.Request.Context(), productID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, images)
}

// UpdateProductImage handles updating an existing product image
func (h *ProductImageHandler) UpdateProductImage(c *gin.Context) {
	var image product.ProductImage
	if err := c.ShouldBindJSON(&image); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.productImageService.UpdateProductImage(c.Request.Context(), &image); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, image)
}

// DeleteProductImage handles deleting a product image
func (h *ProductImageHandler) DeleteProductImage(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	if err := h.productImageService.DeleteProductImage(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// UpdateProductImageOrder handles updating the sort order of a product image
func (h *ProductImageHandler) UpdateProductImageOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	var input struct {
		SortOrder int `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.productImageService.UpdateProductImageOrder(c.Request.Context(), id, input.SortOrder); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// SetPrimaryImage handles setting a product image as primary
func (h *ProductImageHandler) SetPrimaryImage(c *gin.Context) {
	imageID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	productID, err := strconv.Atoi(c.Param("productId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	if err := h.productImageService.SetPrimaryImage(c.Request.Context(), imageID, productID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
