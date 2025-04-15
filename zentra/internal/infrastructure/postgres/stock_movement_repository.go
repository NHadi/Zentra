package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/stockmovement"

	"gorm.io/gorm"
)

type StockMovementRepository struct {
	db *gorm.DB
}

func NewStockMovementRepository(db *gorm.DB) stockmovement.Repository {
	return &StockMovementRepository{db: db}
}

func (r *StockMovementRepository) Create(movement *stockmovement.StockMovement, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	movement.TenantID = userCtx.TenantID
	movement.CreatedBy = userCtx.Username
	movement.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(movement).Error
}

func (r *StockMovementRepository) FindByID(id int, ctx context.Context) (*stockmovement.StockMovement, error) {
	var movement stockmovement.StockMovement
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Item").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&movement)
	return &movement, result.Error
}

func (r *StockMovementRepository) FindAll(ctx context.Context) ([]stockmovement.StockMovement, error) {
	var movements []stockmovement.StockMovement
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Item").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&movements)
	return movements, result.Error
}

func (r *StockMovementRepository) FindByItemID(itemID int, ctx context.Context) ([]stockmovement.StockMovement, error) {
	var movements []stockmovement.StockMovement
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Item").
		Where("item_id = ? AND tenant_id = ?", itemID, userCtx.TenantID).
		Find(&movements)
	return movements, result.Error
}

func (r *StockMovementRepository) FindByReference(refType string, refID int, ctx context.Context) ([]stockmovement.StockMovement, error) {
	var movements []stockmovement.StockMovement
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Item").
		Where("reference_type = ? AND reference_id = ? AND tenant_id = ?", refType, refID, userCtx.TenantID).
		Find(&movements)
	return movements, result.Error
}
