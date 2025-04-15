package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/order"

	"gorm.io/gorm"
)

type orderItemRepository struct {
	db *gorm.DB
}

// NewOrderItemRepository creates a new order item repository instance
func NewOrderItemRepository(db *gorm.DB) order.OrderItemRepository {
	return &orderItemRepository{
		db: db,
	}
}

// Create creates a new order item
func (r *orderItemRepository) Create(item *order.OrderItem, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	item.TenantID = userCtx.TenantID
	item.CreatedBy = userCtx.Username
	item.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(item).Error
}

// FindByID retrieves an order item by its ID
func (r *orderItemRepository) FindByID(id int, ctx context.Context) (*order.OrderItem, error) {
	var item order.OrderItem
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// FindByOrderID retrieves all order items for a given order ID
func (r *orderItemRepository) FindByOrderID(orderID int, ctx context.Context) ([]order.OrderItem, error) {
	var items []order.OrderItem
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("order_id = ? AND tenant_id = ?", orderID, userCtx.TenantID).Find(&items).Error
	if err != nil {
		return nil, err
	}
	return items, nil
}

// Update updates an existing order item
func (r *orderItemRepository) Update(item *order.OrderItem, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	item.TenantID = userCtx.TenantID
	item.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", item.ID, userCtx.TenantID).Updates(item).Error
}

// Delete deletes an order item by its ID
func (r *orderItemRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&order.OrderItem{}).Error
}
