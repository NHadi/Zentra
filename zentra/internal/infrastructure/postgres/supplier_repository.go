package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/supplier"

	"gorm.io/gorm"
)

type supplierRepository struct {
	db *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) supplier.Repository {
	return &supplierRepository{db: db}
}

func (r *supplierRepository) Create(supplier *supplier.Supplier, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	supplier.TenantID = userCtx.TenantID
	supplier.CreatedBy = userCtx.Username
	supplier.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(supplier).Error
}

func (r *supplierRepository) FindByID(id int, ctx context.Context) (*supplier.Supplier, error) {
	var supplier supplier.Supplier
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&supplier).Error; err != nil {
		return nil, err
	}
	return &supplier, nil
}

func (r *supplierRepository) FindAll(ctx context.Context) ([]supplier.Supplier, error) {
	var suppliers []supplier.Supplier
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&suppliers).Error
	return suppliers, err
}

func (r *supplierRepository) Update(supplier *supplier.Supplier, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	supplier.TenantID = userCtx.TenantID
	supplier.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", supplier.ID, userCtx.TenantID).
		Updates(supplier).Error
}

func (r *supplierRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&supplier.Supplier{}).Error
}

func (r *supplierRepository) FindByCode(code string, ctx context.Context) (*supplier.Supplier, error) {
	var supplier supplier.Supplier
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).
		First(&supplier).Error; err != nil {
		return nil, err
	}
	return &supplier, nil
}
