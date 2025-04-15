package postgres

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type CashFlowRepository struct {
	db *gorm.DB
}

func NewCashFlowRepository(db *gorm.DB) accounting.CashFlowRepository {
	return &CashFlowRepository{db: db}
}

func (r *CashFlowRepository) Create(cashFlow *accounting.CashFlow, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	cashFlow.TenantID = userCtx.TenantID
	cashFlow.CreatedBy = userCtx.Username
	cashFlow.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(cashFlow).Error
}

func (r *CashFlowRepository) FindByID(id int, ctx context.Context) (*accounting.CashFlow, error) {
	var cashFlow accounting.CashFlow
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&cashFlow)
	return &cashFlow, result.Error
}

func (r *CashFlowRepository) FindAll(ctx context.Context) ([]accounting.CashFlow, error) {
	var cashFlows []accounting.CashFlow
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&cashFlows)
	return cashFlows, result.Error
}

func (r *CashFlowRepository) Update(cashFlow *accounting.CashFlow, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	cashFlow.TenantID = userCtx.TenantID
	cashFlow.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", cashFlow.ID, userCtx.TenantID).
		Updates(cashFlow).Error
}

func (r *CashFlowRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.CashFlow{}).Error
}

func (r *CashFlowRepository) FindByDateRange(startDate, endDate string, ctx context.Context) ([]accounting.CashFlow, error) {
	var cashFlows []accounting.CashFlow
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ? AND transaction_date BETWEEN ? AND ?", userCtx.TenantID, startDate, endDate).
		Find(&cashFlows)
	return cashFlows, result.Error
}
