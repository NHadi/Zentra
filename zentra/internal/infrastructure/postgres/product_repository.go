package postgres

import (
	"context"
	"errors"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/product"

	"gorm.io/gorm"
)

// ProductRepository implements the product.ProductRepository interface
type ProductRepository struct {
	db *gorm.DB
}

// NewProductRepository creates a new product repository
func NewProductRepository(db *gorm.DB) *ProductRepository {
	return &ProductRepository{
		db: db,
	}
}

// Create creates a new product
func (r *ProductRepository) Create(product *product.Product, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	product.TenantID = userCtx.TenantID
	product.CreatedBy = userCtx.Username
	product.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(product).Error
}

// FindByID finds a product by ID
func (r *ProductRepository) FindByID(id int, ctx context.Context) (*product.Product, error) {
	var product product.Product
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order, id")
		}).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("product not found")
		}
		return nil, err
	}
	return &product, nil
}

// FindByCode finds a product by code
func (r *ProductRepository) FindByCode(code string, ctx context.Context) (*product.Product, error) {
	var product product.Product
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).First(&product).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &product, nil
}

// FindAll retrieves all products
func (r *ProductRepository) FindAll(ctx context.Context) ([]product.Product, error) {
	var products []product.Product
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Preload("Images", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order, id")
		}).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

// FindByCategoryID retrieves all products in a category
func (r *ProductRepository) FindByCategoryID(categoryID int, ctx context.Context) ([]product.Product, error) {
	var products []product.Product
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("category_id = ? AND tenant_id = ?", categoryID, userCtx.TenantID).Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

// Update updates an existing product
func (r *ProductRepository) Update(product *product.Product, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	product.TenantID = userCtx.TenantID
	product.UpdatedBy = userCtx.Username
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", product.ID, userCtx.TenantID).Save(product)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("product not found")
	}
	return nil
}

// Delete deletes a product
func (r *ProductRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&product.Product{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("product not found")
	}
	return nil
}
