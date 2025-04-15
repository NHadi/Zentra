package application

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
	"zentra/internal/domain/product"
)

// Ensure ProductImageService implements product.ProductImageService
var _ product.ProductImageService = (*ProductImageService)(nil)

// ProductImageService handles business logic for product images
type ProductImageService struct {
	productImageRepo product.ProductImageRepository
	productRepo      product.ProductRepository
	uploadDir        string
}

// NewProductImageService creates a new product image service
func NewProductImageService(productImageRepo product.ProductImageRepository, productRepo product.ProductRepository) product.ProductImageService {
	return &ProductImageService{
		productImageRepo: productImageRepo,
		productRepo:      productRepo,
		uploadDir:        "uploads/products",
	}
}

// CreateProductImage creates a new product image
func (s *ProductImageService) CreateProductImage(ctx context.Context, image *product.ProductImage, file *multipart.FileHeader) error {
	// Verify product exists
	_, err := s.productRepo.FindByID(image.ProductID, ctx)
	if err != nil {
		return errors.New("product not found")
	}

	// Ensure upload directory exists
	if err := os.MkdirAll(s.uploadDir, 0755); err != nil {
		return fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate unique filename using proper string formatting
	filename := fmt.Sprintf("%d_%d%s",
		time.Now().UnixNano(),
		image.ProductID,
		filepath.Ext(file.Filename))

	// Create the file path using proper path handling
	filePath := filepath.Join(s.uploadDir, filename)

	log.Printf("Creating product image - product_id: %d, filename: %s, filepath: %s",
		image.ProductID,
		filename,
		filePath,
	)

	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer src.Close()

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %v", err)
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err = io.Copy(dst, src); err != nil {
		return fmt.Errorf("failed to save file: %v", err)
	}

	// Set the image URL with forward slashes for web URLs
	imageURL := "/" + strings.ReplaceAll(filePath, "\\", "/")
	image.ImageURL = imageURL

	log.Printf("Successfully saved product image - product_id: %d, image_url: %s",
		image.ProductID,
		image.ImageURL,
	)

	// Save to database
	return s.productImageRepo.Create(image, ctx)
}

// GetProductImage retrieves a product image by ID
func (s *ProductImageService) GetProductImage(ctx context.Context, id int) (*product.ProductImage, error) {
	return s.productImageRepo.FindByID(id, ctx)
}

// GetProductImages retrieves all images for a product
func (s *ProductImageService) GetProductImages(ctx context.Context, productID int) ([]product.ProductImage, error) {
	// Verify product exists
	_, err := s.productRepo.FindByID(productID, ctx)
	if err != nil {
		return nil, errors.New("product not found")
	}

	return s.productImageRepo.FindByProductID(productID, ctx)
}

// UpdateProductImage updates an existing product image
func (s *ProductImageService) UpdateProductImage(ctx context.Context, image *product.ProductImage) error {
	// Verify product exists
	_, err := s.productRepo.FindByID(image.ProductID, ctx)
	if err != nil {
		return errors.New("product not found")
	}

	return s.productImageRepo.Update(image, ctx)
}

// DeleteProductImage deletes a product image
func (s *ProductImageService) DeleteProductImage(ctx context.Context, id int) error {
	return s.productImageRepo.Delete(id, ctx)
}

// UpdateProductImageOrder updates the sort order of a product image
func (s *ProductImageService) UpdateProductImageOrder(ctx context.Context, id int, sortOrder int) error {
	return s.productImageRepo.UpdateSortOrder(id, sortOrder, ctx)
}

// SetPrimaryImage sets an image as primary and unsets all other primary images for the product
func (s *ProductImageService) SetPrimaryImage(ctx context.Context, imageID int, productID int) error {
	// Verify product exists
	_, err := s.productRepo.FindByID(productID, ctx)
	if err != nil {
		return errors.New("product not found")
	}

	return s.productImageRepo.SetPrimaryImage(imageID, productID, ctx)
}
