package postgres

import (
	"context"
	"errors"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/product"

	"gorm.io/gorm"
)

// ProductCategoryRepository implements the product.CategoryRepository interface
type ProductCategoryRepository struct {
	db *gorm.DB
}

// NewProductCategoryRepository creates a new product category repository
func NewProductCategoryRepository(db *gorm.DB) *ProductCategoryRepository {
	return &ProductCategoryRepository{
		db: db,
	}
}

// Create creates a new product category
func (r *ProductCategoryRepository) Create(category *product.Category, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	category.TenantID = userCtx.TenantID
	category.CreatedBy = userCtx.Username
	category.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(category).Error
}

// FindByID finds a product category by ID
func (r *ProductCategoryRepository) FindByID(id int, ctx context.Context) (*product.Category, error) {
	var category product.Category
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("category not found")
		}
		return nil, err
	}
	return &category, nil
}

// FindByCode finds a product category by code
func (r *ProductCategoryRepository) FindByCode(code string, ctx context.Context) (*product.Category, error) {
	var category product.Category
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).First(&category).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &category, nil
}

// FindAll retrieves all product categories
func (r *ProductCategoryRepository) FindAll(ctx context.Context) ([]product.Category, error) {
	var categories []product.Category
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// Update updates an existing product category
func (r *ProductCategoryRepository) Update(category *product.Category, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	category.TenantID = userCtx.TenantID
	category.UpdatedBy = userCtx.Username
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", category.ID, userCtx.TenantID).Save(category)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("category not found")
	}
	return nil
}

// Delete deletes a product category
func (r *ProductCategoryRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&product.Category{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("category not found")
	}
	return nil
}
