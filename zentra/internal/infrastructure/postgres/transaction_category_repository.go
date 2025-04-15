package postgres

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type TransactionCategoryRepository struct {
	db *gorm.DB
}

func NewTransactionCategoryRepository(db *gorm.DB) accounting.TransactionCategoryRepository {
	return &TransactionCategoryRepository{db: db}
}

func (r *TransactionCategoryRepository) Create(category *accounting.TransactionCategory, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	category.TenantID = userCtx.TenantID
	category.CreatedBy = userCtx.Username
	category.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *TransactionCategoryRepository) FindByID(id int, ctx context.Context) (*accounting.TransactionCategory, error) {
	var category accounting.TransactionCategory
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&category)
	return &category, result.Error
}

func (r *TransactionCategoryRepository) FindAll(ctx context.Context) ([]accounting.TransactionCategory, error) {
	var categories []accounting.TransactionCategory
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&categories)
	return categories, result.Error
}

func (r *TransactionCategoryRepository) Update(category *accounting.TransactionCategory, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	category.TenantID = userCtx.TenantID
	category.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", category.ID, userCtx.TenantID).
		Updates(category).Error
}

func (r *TransactionCategoryRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.TransactionCategory{}).Error
}

func (r *TransactionCategoryRepository) FindByCode(code string, ctx context.Context) (*accounting.TransactionCategory, error) {
	var category accounting.TransactionCategory
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).
		First(&category)
	return &category, result.Error
}
