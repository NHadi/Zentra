package postgres

import (
	"context"
	"errors"
	"log"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/product"

	"gorm.io/gorm"
)

// ProductImageRepository implements the product.ProductImageRepository interface
type ProductImageRepository struct {
	db *gorm.DB
}

// NewProductImageRepository creates a new product image repository
func NewProductImageRepository(db *gorm.DB) *ProductImageRepository {
	return &ProductImageRepository{
		db: db,
	}
}

// Create creates a new product image
func (r *ProductImageRepository) Create(image *product.ProductImage, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	image.TenantID = userCtx.TenantID
	image.CreatedBy = userCtx.Username
	image.UpdatedBy = userCtx.Username

	log.Printf("Creating product image in database - id: %d, product_id: %d, tenant_id: %d",
		image.ID,
		image.ProductID,
		image.TenantID,
	)

	err := r.db.WithContext(ctx).Create(image).Error
	if err != nil {
		log.Printf("Failed to create product image in database: %v", err)
		return err
	}

	log.Printf("Successfully created product image in database - id: %d", image.ID)
	return nil
}

// FindByID finds a product image by ID
func (r *ProductImageRepository) FindByID(id int, ctx context.Context) (*product.ProductImage, error) {
	var image product.ProductImage
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&image).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("product image not found")
		}
		return nil, err
	}
	return &image, nil
}

// FindByProductID retrieves all images for a product
func (r *ProductImageRepository) FindByProductID(productID int, ctx context.Context) ([]product.ProductImage, error) {
	var images []product.ProductImage
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("product_id = ? AND tenant_id = ?", productID, userCtx.TenantID).Order("sort_order, id").Find(&images).Error; err != nil {
		return nil, err
	}
	return images, nil
}

// Update updates an existing product image
func (r *ProductImageRepository) Update(image *product.ProductImage, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	image.TenantID = userCtx.TenantID
	image.UpdatedBy = userCtx.Username
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", image.ID, userCtx.TenantID).Save(image)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("product image not found")
	}
	return nil
}

// Delete deletes a product image
func (r *ProductImageRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&product.ProductImage{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("product image not found")
	}
	return nil
}

// UpdateSortOrder updates the sort order of a product image
func (r *ProductImageRepository) UpdateSortOrder(id int, sortOrder int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).Model(&product.ProductImage{}).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Update("sort_order", sortOrder)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("product image not found")
	}
	return nil
}

// SetPrimaryImage sets an image as primary and unsets all other primary images for the product
func (r *ProductImageRepository) SetPrimaryImage(imageID int, productID int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Start a transaction
	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// First, set all images for this product to not primary
	if err := tx.Model(&product.ProductImage{}).
		Where("product_id = ? AND tenant_id = ?", productID, userCtx.TenantID).
		Update("is_primary", false).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Then, set the selected image as primary
	result := tx.Model(&product.ProductImage{}).
		Where("id = ? AND tenant_id = ?", imageID, userCtx.TenantID).
		Update("is_primary", true)
	if result.Error != nil {
		tx.Rollback()
		return result.Error
	}
	if result.RowsAffected == 0 {
		tx.Rollback()
		return errors.New("product image not found")
	}

	return tx.Commit().Error
}
