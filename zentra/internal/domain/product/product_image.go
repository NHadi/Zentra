package product

import (
	"context"
	"mime/multipart"
	"zentra/internal/domain/common"
)

// ProductImage represents a product image
type ProductImage struct {
	ID        int    `json:"id" gorm:"primaryKey"`
	ProductID int    `json:"product_id"`
	ImageURL  string `json:"image_url"`
	SortOrder int    `json:"sort_order"`
	IsPrimary bool   `json:"is_primary"`
	common.TenantModel
}

func (ProductImage) TableName() string {
	return "product_images"
}

// ProductImageService defines the interface for product image business logic
type ProductImageService interface {
	CreateProductImage(ctx context.Context, image *ProductImage, file *multipart.FileHeader) error
	GetProductImage(ctx context.Context, id int) (*ProductImage, error)
	GetProductImages(ctx context.Context, productID int) ([]ProductImage, error)
	UpdateProductImage(ctx context.Context, image *ProductImage) error
	DeleteProductImage(ctx context.Context, id int) error
	UpdateProductImageOrder(ctx context.Context, id int, sortOrder int) error
	SetPrimaryImage(ctx context.Context, imageID int, productID int) error
}

// ProductImageRepository defines the interface for product image data access
type ProductImageRepository interface {
	Create(image *ProductImage, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*ProductImage, error)
	FindByProductID(productID int, ctx context.Context) ([]ProductImage, error)
	Update(image *ProductImage, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	UpdateSortOrder(id int, sortOrder int, ctx context.Context) error
	SetPrimaryImage(imageID int, productID int, ctx context.Context) error
}
