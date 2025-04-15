package postgres

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type PurchaseOrderRepository struct {
	db *gorm.DB
}

func NewPurchaseOrderRepository(db *gorm.DB) accounting.PurchaseOrderRepository {
	return &PurchaseOrderRepository{db: db}
}

func (r *PurchaseOrderRepository) Create(order *accounting.PurchaseOrder, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	order.TenantID = userCtx.TenantID
	order.CreatedBy = userCtx.Username
	order.UpdatedBy = userCtx.Username

	// Start transaction to handle order and items
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create order
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// Create order items
		for i := range order.Items {
			order.Items[i].PurchaseOrderID = order.ID
			order.Items[i].TenantID = userCtx.TenantID
			order.Items[i].CreatedBy = userCtx.Username
			order.Items[i].UpdatedBy = userCtx.Username
			if err := tx.Create(&order.Items[i]).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PurchaseOrderRepository) FindByID(id int, ctx context.Context) (*accounting.PurchaseOrder, error) {
	var order accounting.PurchaseOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Items").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&order)
	return &order, result.Error
}

func (r *PurchaseOrderRepository) FindAll(ctx context.Context) ([]accounting.PurchaseOrder, error) {
	var orders []accounting.PurchaseOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Items").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&orders)
	return orders, result.Error
}

func (r *PurchaseOrderRepository) Update(order *accounting.PurchaseOrder, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	order.TenantID = userCtx.TenantID
	order.UpdatedBy = userCtx.Username

	// Start transaction to handle order and items update
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update order
		if err := tx.Where("id = ? AND tenant_id = ?", order.ID, userCtx.TenantID).
			Updates(order).Error; err != nil {
			return err
		}

		// Delete existing items
		if err := tx.Where("purchase_order_id = ?", order.ID).
			Delete(&accounting.PurchaseOrderItem{}).Error; err != nil {
			return err
		}

		// Create new items
		for i := range order.Items {
			order.Items[i].PurchaseOrderID = order.ID
			order.Items[i].TenantID = userCtx.TenantID
			order.Items[i].CreatedBy = userCtx.Username
			order.Items[i].UpdatedBy = userCtx.Username
			if err := tx.Create(&order.Items[i]).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *PurchaseOrderRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete items first
		if err := tx.Where("purchase_order_id = ?", id).
			Delete(&accounting.PurchaseOrderItem{}).Error; err != nil {
			return err
		}

		// Delete order
		return tx.Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
			Delete(&accounting.PurchaseOrder{}).Error
	})
}

func (r *PurchaseOrderRepository) FindByNumber(poNumber string, ctx context.Context) (*accounting.PurchaseOrder, error) {
	var order accounting.PurchaseOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Items").
		Where("po_number = ? AND tenant_id = ?", poNumber, userCtx.TenantID).
		First(&order)
	return &order, result.Error
}
