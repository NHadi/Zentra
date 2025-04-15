package postgres

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type WorkOrderRepository struct {
	db *gorm.DB
}

func NewWorkOrderRepository(db *gorm.DB) accounting.WorkOrderRepository {
	return &WorkOrderRepository{db: db}
}

func (r *WorkOrderRepository) Create(workOrder *accounting.WorkOrder, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	workOrder.TenantID = userCtx.TenantID
	workOrder.CreatedBy = userCtx.Username
	workOrder.UpdatedBy = userCtx.Username

	tx := r.db.WithContext(ctx).Begin()
	if err := tx.Create(workOrder).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Create tasks
	for i := range workOrder.Tasks {
		workOrder.Tasks[i].WorkOrderID = workOrder.ID
		workOrder.Tasks[i].TenantID = userCtx.TenantID
		workOrder.Tasks[i].CreatedBy = userCtx.Username
		workOrder.Tasks[i].UpdatedBy = userCtx.Username
		if err := tx.Create(&workOrder.Tasks[i]).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// Create items
	for i := range workOrder.Items {
		workOrder.Items[i].WorkOrderID = workOrder.ID
		workOrder.Items[i].TenantID = userCtx.TenantID
		workOrder.Items[i].CreatedBy = userCtx.Username
		workOrder.Items[i].UpdatedBy = userCtx.Username
		if err := tx.Create(&workOrder.Items[i]).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (r *WorkOrderRepository) FindByID(id int, ctx context.Context) (*accounting.WorkOrder, error) {
	var workOrder accounting.WorkOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&workOrder).Error
	if err != nil {
		return nil, err
	}

	// Load tasks
	if err := r.db.WithContext(ctx).
		Where("work_order_id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Find(&workOrder.Tasks).Error; err != nil {
		return nil, err
	}

	// Load items
	if err := r.db.WithContext(ctx).
		Where("work_order_id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Find(&workOrder.Items).Error; err != nil {
		return nil, err
	}

	return &workOrder, nil
}

func (r *WorkOrderRepository) FindAll(ctx context.Context) ([]accounting.WorkOrder, error) {
	var workOrders []accounting.WorkOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("Employee").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&workOrders).Error
	if err != nil {
		return nil, err
	}

	// Load tasks and items for each work order
	for i := range workOrders {
		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Tasks).Error; err != nil {
			return nil, err
		}

		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Items).Error; err != nil {
			return nil, err
		}
	}

	return workOrders, nil
}

func (r *WorkOrderRepository) Update(workOrder *accounting.WorkOrder, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	workOrder.TenantID = userCtx.TenantID
	workOrder.UpdatedBy = userCtx.Username

	tx := r.db.WithContext(ctx).Begin()

	// Update work order
	if err := tx.Where("id = ? AND tenant_id = ?", workOrder.ID, userCtx.TenantID).
		Updates(workOrder).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Update tasks
	if err := tx.Where("work_order_id = ? AND tenant_id = ?", workOrder.ID, userCtx.TenantID).
		Delete(&accounting.WorkOrderTask{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	for i := range workOrder.Tasks {
		workOrder.Tasks[i].WorkOrderID = workOrder.ID
		workOrder.Tasks[i].TenantID = userCtx.TenantID
		workOrder.Tasks[i].UpdatedBy = userCtx.Username
		if err := tx.Create(&workOrder.Tasks[i]).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// Update items
	if err := tx.Where("work_order_id = ? AND tenant_id = ?", workOrder.ID, userCtx.TenantID).
		Delete(&accounting.WorkOrderItem{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	for i := range workOrder.Items {
		workOrder.Items[i].WorkOrderID = workOrder.ID
		workOrder.Items[i].TenantID = userCtx.TenantID
		workOrder.Items[i].UpdatedBy = userCtx.Username
		if err := tx.Create(&workOrder.Items[i]).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (r *WorkOrderRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	tx := r.db.WithContext(ctx).Begin()

	// Delete tasks
	if err := tx.Where("work_order_id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.WorkOrderTask{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete items
	if err := tx.Where("work_order_id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.WorkOrderItem{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Delete work order
	if err := tx.Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.WorkOrder{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (r *WorkOrderRepository) FindByNumber(spkNumber string, ctx context.Context) (*accounting.WorkOrder, error) {
	var workOrder accounting.WorkOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	err := r.db.WithContext(ctx).
		Where("spk_number = ? AND tenant_id = ?", spkNumber, userCtx.TenantID).
		First(&workOrder).Error
	if err != nil {
		return nil, err
	}

	// Load tasks
	if err := r.db.WithContext(ctx).
		Where("work_order_id = ? AND tenant_id = ?", workOrder.ID, userCtx.TenantID).
		Find(&workOrder.Tasks).Error; err != nil {
		return nil, err
	}

	// Load items
	if err := r.db.WithContext(ctx).
		Where("work_order_id = ? AND tenant_id = ?", workOrder.ID, userCtx.TenantID).
		Find(&workOrder.Items).Error; err != nil {
		return nil, err
	}

	return &workOrder, nil
}

func (r *WorkOrderRepository) FindByStatus(status string, ctx context.Context) ([]accounting.WorkOrder, error) {
	var workOrders []accounting.WorkOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	err := r.db.WithContext(ctx).
		Where("status = ? AND tenant_id = ?", status, userCtx.TenantID).
		Find(&workOrders).Error
	if err != nil {
		return nil, err
	}

	// Load tasks and items for each work order
	for i := range workOrders {
		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Tasks).Error; err != nil {
			return nil, err
		}

		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Items).Error; err != nil {
			return nil, err
		}
	}

	return workOrders, nil
}

func (r *WorkOrderRepository) FindByDateRange(startDate, endDate string, ctx context.Context) ([]accounting.WorkOrder, error) {
	var workOrders []accounting.WorkOrder
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND start_date >= ? AND end_date <= ?", userCtx.TenantID, startDate, endDate).
		Find(&workOrders).Error
	if err != nil {
		return nil, err
	}

	// Load tasks and items for each work order
	for i := range workOrders {
		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Tasks).Error; err != nil {
			return nil, err
		}

		if err := r.db.WithContext(ctx).
			Where("work_order_id = ? AND tenant_id = ?", workOrders[i].ID, userCtx.TenantID).
			Find(&workOrders[i].Items).Error; err != nil {
			return nil, err
		}
	}

	return workOrders, nil
}
