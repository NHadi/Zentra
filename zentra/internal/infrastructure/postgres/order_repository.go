package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/order"

	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

// NewOrderRepository creates a new order repository instance
func NewOrderRepository(db *gorm.DB) order.Repository {
	return &orderRepository{
		db: db,
	}
}

// Create creates a new order
func (r *orderRepository) Create(order *order.Order, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	order.TenantID = userCtx.TenantID
	order.CreatedBy = userCtx.Username
	order.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(order).Error
}

// FindByID retrieves an order by its ID
func (r *orderRepository) FindByID(id int, ctx context.Context) (*order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var order order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// FindAll retrieves all orders
func (r *orderRepository) FindAll(ctx context.Context) ([]order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var orders []order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("tenant_id = ?", userCtx.TenantID).Find(&orders).Error
	if err != nil {
		return nil, err
	}
	return orders, nil
}

// Update updates an existing order
func (r *orderRepository) Update(order *order.Order, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	order.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", order.ID, userCtx.TenantID).Updates(order).Error
}

// Delete deletes an order by its ID
func (r *orderRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&order.Order{}).Error
}

// FindByCustomerID retrieves all orders for a given customer ID
func (r *orderRepository) FindByCustomerID(customerID int, ctx context.Context) ([]order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var orders []order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("customer_id = ? AND tenant_id = ?", customerID, userCtx.TenantID).Find(&orders).Error
	if err != nil {
		return nil, err
	}
	return orders, nil
}

// FindByOrderNumber retrieves an order by order number
func (r *orderRepository) FindByOrderNumber(orderNumber string, ctx context.Context) (*order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var order order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("order_number = ? AND tenant_id = ?", orderNumber, userCtx.TenantID).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// FindByStatus retrieves all orders with a specific status
func (r *orderRepository) FindByStatus(status string, ctx context.Context) ([]order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var orders []order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("status = ? AND tenant_id = ?", status, userCtx.TenantID).Find(&orders).Error
	if err != nil {
		return nil, err
	}
	return orders, nil
}

// FindByPaymentStatus retrieves all orders with a specific payment status
func (r *orderRepository) FindByPaymentStatus(status string, ctx context.Context) ([]order.Order, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var orders []order.Order
	err := r.db.Preload("Customer").Preload("OrderItems.Product.Images").Preload("OrderItems.Tasks.Employee").Where("payment_status = ? AND tenant_id = ?", status, userCtx.TenantID).Find(&orders).Error
	if err != nil {
		return nil, err
	}
	return orders, nil
}
