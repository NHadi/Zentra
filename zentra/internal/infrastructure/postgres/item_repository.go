package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/item"

	"gorm.io/gorm"
)

type ItemRepository struct {
	db *gorm.DB
}

func NewItemRepository(db *gorm.DB) item.Repository {
	return &ItemRepository{db: db}
}

func (r *ItemRepository) Create(item *item.Item, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	item.TenantID = userCtx.TenantID
	item.CreatedBy = userCtx.Username
	item.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *ItemRepository) FindByID(id int, ctx context.Context) (*item.Item, error) {
	var item item.Item
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&item)
	return &item, result.Error
}

func (r *ItemRepository) FindAll(ctx context.Context) ([]item.Item, error) {
	var items []item.Item
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&items)
	return items, result.Error
}

func (r *ItemRepository) Update(item *item.Item, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	item.TenantID = userCtx.TenantID
	item.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", item.ID, userCtx.TenantID).
		Updates(item).Error
}

func (r *ItemRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&item.Item{}).Error
}

func (r *ItemRepository) FindByCode(code string, ctx context.Context) (*item.Item, error) {
	var item item.Item
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).
		First(&item)
	return &item, result.Error
}
