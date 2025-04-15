package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/stockopname"

	"gorm.io/gorm"
)

type StockOpnameRepository struct {
	db *gorm.DB
}

func NewStockOpnameRepository(db *gorm.DB) stockopname.Repository {
	return &StockOpnameRepository{db: db}
}

func (r *StockOpnameRepository) Create(opname *stockopname.StockOpname, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	opname.TenantID = userCtx.TenantID
	opname.CreatedBy = userCtx.Username
	opname.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(opname).Error
}

func (r *StockOpnameRepository) FindByID(id int, ctx context.Context) (*stockopname.StockOpname, error) {
	var opname stockopname.StockOpname
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Details.Item").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&opname)
	return &opname, result.Error
}

func (r *StockOpnameRepository) FindAll(ctx context.Context) ([]stockopname.StockOpname, error) {
	var opnames []stockopname.StockOpname
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Details.Item").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&opnames)
	return opnames, result.Error
}

func (r *StockOpnameRepository) Update(opname *stockopname.StockOpname, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	opname.TenantID = userCtx.TenantID
	opname.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", opname.ID, userCtx.TenantID).
		Updates(opname).Error
}

func (r *StockOpnameRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&stockopname.StockOpname{}).Error
}

func (r *StockOpnameRepository) FindByNumber(number string, ctx context.Context) (*stockopname.StockOpname, error) {
	var opname stockopname.StockOpname
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Details.Item").
		Where("opname_number = ? AND tenant_id = ?", number, userCtx.TenantID).
		First(&opname)
	return &opname, result.Error
}

func (r *StockOpnameRepository) AddDetail(detail *stockopname.StockOpnameDetail, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	detail.TenantID = userCtx.TenantID
	detail.CreatedBy = userCtx.Username
	detail.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(detail).Error
}

func (r *StockOpnameRepository) UpdateDetail(detail *stockopname.StockOpnameDetail, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	detail.TenantID = userCtx.TenantID
	detail.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", detail.ID, userCtx.TenantID).
		Updates(detail).Error
}

func (r *StockOpnameRepository) DeleteDetail(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&stockopname.StockOpnameDetail{}).Error
}

func (r *StockOpnameRepository) FindDetailsByOpnameID(opnameID int, ctx context.Context) ([]stockopname.StockOpnameDetail, error) {
	var details []stockopname.StockOpnameDetail
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Item").
		Where("stock_opname_id = ? AND tenant_id = ?", opnameID, userCtx.TenantID).
		Find(&details)
	return details, result.Error
}
