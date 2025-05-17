package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/task"
)

// TaskService handles business logic for task operations
type TaskService struct {
	repo     task.Repository
	auditSvc *audit.Service
}

// NewTaskService creates a new task service instance
func NewTaskService(repo task.Repository, auditSvc *audit.Service) *TaskService {
	return &TaskService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new task
func (s *TaskService) Create(t *task.Task, ctx context.Context) error {
	if err := s.repo.Create(t, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("task", t.ID, audit.ActionCreate, nil, t, ctx)
}

// FindByID retrieves a task by its ID
func (s *TaskService) FindByID(id int, ctx context.Context) (*task.Task, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all tasks
func (s *TaskService) FindAll(ctx context.Context) ([]task.Task, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing task
func (s *TaskService) Update(t *task.Task, ctx context.Context) error {
	// Get old data for audit
	oldTask, err := s.repo.FindByID(t.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(t, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("task", t.ID, audit.ActionUpdate, oldTask, t, ctx)
}

// Delete deletes a task by its ID
func (s *TaskService) Delete(id int, ctx context.Context) error {
	// Get task data for audit
	task, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("task", id, audit.ActionDelete, task, nil, ctx)
}

// FindByOrderItemID retrieves all tasks for a given order item ID
func (s *TaskService) FindByOrderItemID(orderItemID int, ctx context.Context) ([]task.Task, error) {
	return s.repo.FindByOrderItemID(orderItemID, ctx)
}

// FindByEmployeeID retrieves all tasks assigned to an employee
func (s *TaskService) FindByEmployeeID(employeeID int, ctx context.Context) ([]task.Task, error) {
	return s.repo.FindByEmployeeID(employeeID, ctx)
}

// FindByStatus retrieves all tasks with a specific status
func (s *TaskService) FindByStatus(status string, ctx context.Context) ([]task.Task, error) {
	return s.repo.FindByStatus(status, ctx)
}

// FindByTaskType retrieves all tasks of a specific type
func (s *TaskService) FindByTaskType(taskType string, ctx context.Context) ([]task.Task, error) {
	return s.repo.FindByTaskType(taskType, ctx)
}

// FindByIDWithRelations retrieves a task by its ID with all related data
func (s *TaskService) FindByIDWithRelations(id int, ctx context.Context) (*task.Task, error) {
	return s.repo.FindByIDWithRelations(id, ctx)
}

// FindAllWithRelations retrieves all tasks with related data
func (s *TaskService) FindAllWithRelations(ctx context.Context) ([]task.Task, error) {
	return s.repo.FindAllWithRelations(ctx)
}
