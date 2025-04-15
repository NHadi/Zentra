package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
)

// WorkOrderService handles business logic for work order (SPK) operations
type WorkOrderService struct {
	repo     accounting.WorkOrderRepository
	auditSvc *audit.Service
}

// NewWorkOrderService creates a new work order service instance
func NewWorkOrderService(repo accounting.WorkOrderRepository, auditSvc *audit.Service) *WorkOrderService {
	return &WorkOrderService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new work order
func (s *WorkOrderService) Create(workOrder *accounting.WorkOrder, ctx context.Context) error {
	if err := s.repo.Create(workOrder, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("work_order", workOrder.ID, audit.ActionCreate, nil, workOrder, ctx)
}

// FindByID retrieves a work order by its ID
func (s *WorkOrderService) FindByID(id int, ctx context.Context) (*accounting.WorkOrder, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all work orders
func (s *WorkOrderService) FindAll(ctx context.Context) ([]accounting.WorkOrder, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing work order
func (s *WorkOrderService) Update(workOrder *accounting.WorkOrder, ctx context.Context) error {
	// Get old data for audit
	oldWorkOrder, err := s.repo.FindByID(workOrder.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("work_order", workOrder.ID, audit.ActionUpdate, oldWorkOrder, workOrder, ctx)
}

// Delete deletes a work order by its ID
func (s *WorkOrderService) Delete(id int, ctx context.Context) error {
	// Get work order data for audit
	workOrder, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("work_order", id, audit.ActionDelete, workOrder, nil, ctx)
}

// FindByNumber retrieves a work order by its SPK number
func (s *WorkOrderService) FindByNumber(spkNumber string, ctx context.Context) (*accounting.WorkOrder, error) {
	return s.repo.FindByNumber(spkNumber, ctx)
}

// FindByStatus retrieves work orders by status
func (s *WorkOrderService) FindByStatus(status string, ctx context.Context) ([]accounting.WorkOrder, error) {
	return s.repo.FindByStatus(status, ctx)
}

// FindByDateRange retrieves work orders within a date range
func (s *WorkOrderService) FindByDateRange(startDate, endDate string, ctx context.Context) ([]accounting.WorkOrder, error) {
	return s.repo.FindByDateRange(startDate, endDate, ctx)
}

// Complete marks a work order as completed
func (s *WorkOrderService) Complete(id int, completionNotes string, actualCost float64, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	oldStatus := workOrder.Status
	workOrder.Status = "completed"
	workOrder.CompletionNotes = completionNotes
	workOrder.ActualCost = actualCost

	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	// Log the status change
	return s.auditSvc.LogChange("work_order", id, "status_change", oldStatus, workOrder.Status, ctx)
}

// Cancel cancels a work order
func (s *WorkOrderService) Cancel(id int, reason string, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	oldStatus := workOrder.Status
	workOrder.Status = "cancelled"
	workOrder.CompletionNotes = reason

	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	// Log the status change
	return s.auditSvc.LogChange("work_order", id, "status_change", oldStatus, workOrder.Status, ctx)
}

// CreateTask adds a new task to a work order
func (s *WorkOrderService) CreateTask(workOrderID int, task *accounting.WorkOrderTask, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	workOrder.Tasks = append(workOrder.Tasks, *task)
	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_task", task.ID, audit.ActionCreate, nil, task, ctx)
}

// UpdateTask updates an existing task in a work order
func (s *WorkOrderService) UpdateTask(workOrderID int, taskID int, task *accounting.WorkOrderTask, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	var oldTask *accounting.WorkOrderTask
	for i, t := range workOrder.Tasks {
		if t.ID == taskID {
			oldTask = &workOrder.Tasks[i]
			workOrder.Tasks[i] = *task
			break
		}
	}

	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_task", taskID, audit.ActionUpdate, oldTask, task, ctx)
}

// DeleteTask removes a task from a work order
func (s *WorkOrderService) DeleteTask(workOrderID int, taskID int, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	var oldTask *accounting.WorkOrderTask
	var newTasks []accounting.WorkOrderTask
	for _, t := range workOrder.Tasks {
		if t.ID == taskID {
			oldTask = &t
		} else {
			newTasks = append(newTasks, t)
		}
	}

	workOrder.Tasks = newTasks
	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_task", taskID, audit.ActionDelete, oldTask, nil, ctx)
}

// CreateItem adds a new item to a work order
func (s *WorkOrderService) CreateItem(workOrderID int, item *accounting.WorkOrderItem, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	workOrder.Items = append(workOrder.Items, *item)
	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_item", item.ID, audit.ActionCreate, nil, item, ctx)
}

// UpdateItem updates an existing item in a work order
func (s *WorkOrderService) UpdateItem(workOrderID int, itemID int, item *accounting.WorkOrderItem, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	var oldItem *accounting.WorkOrderItem
	for i, t := range workOrder.Items {
		if t.ID == itemID {
			oldItem = &workOrder.Items[i]
			workOrder.Items[i] = *item
			break
		}
	}

	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_item", itemID, audit.ActionUpdate, oldItem, item, ctx)
}

// DeleteItem removes an item from a work order
func (s *WorkOrderService) DeleteItem(workOrderID int, itemID int, ctx context.Context) error {
	workOrder, err := s.repo.FindByID(workOrderID, ctx)
	if err != nil {
		return err
	}

	var oldItem *accounting.WorkOrderItem
	var newItems []accounting.WorkOrderItem
	for _, t := range workOrder.Items {
		if t.ID == itemID {
			oldItem = &t
		} else {
			newItems = append(newItems, t)
		}
	}

	workOrder.Items = newItems
	if err := s.repo.Update(workOrder, ctx); err != nil {
		return err
	}

	return s.auditSvc.LogChange("work_order_item", itemID, audit.ActionDelete, oldItem, nil, ctx)
}
