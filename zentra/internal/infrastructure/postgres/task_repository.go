package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/task"

	"gorm.io/gorm"
)

type taskRepository struct {
	db *gorm.DB
}

// NewTaskRepository creates a new task repository instance
func NewTaskRepository(db *gorm.DB) task.Repository {
	return &taskRepository{
		db: db,
	}
}

// Create creates a new task
func (r *taskRepository) Create(task *task.Task, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	task.TenantID = userCtx.TenantID
	task.CreatedBy = userCtx.Username
	task.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(task).Error
}

// FindByID retrieves a task by its ID
func (r *taskRepository) FindByID(id int, ctx context.Context) (*task.Task, error) {
	var task task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

// FindAll retrieves all tasks
func (r *taskRepository) FindAll(ctx context.Context) ([]task.Task, error) {
	var tasks []task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("tenant_id = ?", userCtx.TenantID).Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

// Update updates an existing task
func (r *taskRepository) Update(task *task.Task, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	task.TenantID = userCtx.TenantID
	task.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", task.ID, userCtx.TenantID).Updates(task).Error
}

// Delete deletes a task by its ID
func (r *taskRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&task.Task{}).Error
}

// FindByOrderItemID retrieves all tasks for a given order item ID
func (r *taskRepository) FindByOrderItemID(orderItemID int, ctx context.Context) ([]task.Task, error) {
	var tasks []task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("order_item_id = ? AND tenant_id = ?", orderItemID, userCtx.TenantID).Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

// FindByEmployeeID retrieves all tasks assigned to an employee
func (r *taskRepository) FindByEmployeeID(employeeID int, ctx context.Context) ([]task.Task, error) {
	var tasks []task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("employee_id = ? AND tenant_id = ?", employeeID, userCtx.TenantID).Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

// FindByStatus retrieves all tasks with a specific status
func (r *taskRepository) FindByStatus(status string, ctx context.Context) ([]task.Task, error) {
	var tasks []task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("status = ? AND tenant_id = ?", status, userCtx.TenantID).Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

// FindByTaskType retrieves all tasks of a specific type
func (r *taskRepository) FindByTaskType(taskType string, ctx context.Context) ([]task.Task, error) {
	var tasks []task.Task
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Preload("Employee").Where("task_type = ? AND tenant_id = ?", taskType, userCtx.TenantID).Find(&tasks).Error
	if err != nil {
		return nil, err
	}
	return tasks, nil
}
