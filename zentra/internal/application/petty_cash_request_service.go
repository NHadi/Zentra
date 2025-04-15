package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/employee"
	"zentra/internal/domain/repositories"
)

// PettyCashRequestService handles business logic for petty cash request operations
type PettyCashRequestService struct {
	repo         accounting.PettyCashRequestRepository
	auditSvc     *audit.Service
	categoryRepo accounting.TransactionCategoryRepository
	employeeRepo repositories.EmployeeRepository
}

// NewPettyCashRequestService creates a new petty cash request service instance
func NewPettyCashRequestService(repo accounting.PettyCashRequestRepository, auditSvc *audit.Service, categoryRepo accounting.TransactionCategoryRepository, employeeRepo repositories.EmployeeRepository) *PettyCashRequestService {
	return &PettyCashRequestService{
		repo:         repo,
		auditSvc:     auditSvc,
		categoryRepo: categoryRepo,
		employeeRepo: employeeRepo,
	}
}

// Create creates a new petty cash request
func (s *PettyCashRequestService) Create(request *accounting.PettyCashRequest, ctx context.Context) error {
	if err := s.repo.Create(request, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("petty_cash_request", request.ID, audit.ActionCreate, nil, request, ctx)
}

// FindByID retrieves a petty cash request by its ID
func (s *PettyCashRequestService) FindByID(id int, ctx context.Context) (*accounting.PettyCashRequest, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all petty cash requests
func (s *PettyCashRequestService) FindAll(ctx context.Context) ([]accounting.PettyCashRequest, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing petty cash request
func (s *PettyCashRequestService) Update(request *accounting.PettyCashRequest, ctx context.Context) error {
	// Get old data for audit
	oldRequest, err := s.repo.FindByID(request.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(request, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("petty_cash_request", request.ID, audit.ActionUpdate, oldRequest, request, ctx)
}

// Delete deletes a petty cash request by its ID
func (s *PettyCashRequestService) Delete(id int, ctx context.Context) error {
	// Get request data for audit
	request, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("petty_cash_request", id, audit.ActionDelete, request, nil, ctx)
}

// FindByStatus retrieves petty cash requests by status
func (s *PettyCashRequestService) FindByStatus(status string, ctx context.Context) ([]accounting.PettyCashRequest, error) {
	return s.repo.FindByStatus(status, ctx)
}

// Approve approves a petty cash request
func (s *PettyCashRequestService) Approve(id int, ctx context.Context) error {
	request, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	oldStatus := request.Status
	request.Status = "approved"

	if err := s.repo.Update(request, ctx); err != nil {
		return err
	}

	// Log the status change
	return s.auditSvc.LogChange("petty_cash_request", id, "status_change", oldStatus, request.Status, ctx)
}

// Reject rejects a petty cash request
func (s *PettyCashRequestService) Reject(id int, reason string, ctx context.Context) error {
	request, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	oldStatus := request.Status
	request.Status = "rejected"
	request.RejectionReason = &reason

	if err := s.repo.Update(request, ctx); err != nil {
		return err
	}

	// Log the status change
	return s.auditSvc.LogChange("petty_cash_request", id, "status_change", oldStatus, request.Status, ctx)
}

// GetCategory retrieves a transaction category by ID
func (s *PettyCashRequestService) GetCategory(id int, ctx context.Context) (*accounting.TransactionCategory, error) {
	return s.categoryRepo.FindByID(id, ctx)
}

// GetEmployee retrieves an employee by ID
func (s *PettyCashRequestService) GetEmployee(id int, ctx context.Context) (*employee.Employee, error) {
	return s.employeeRepo.FindByID(id, ctx)
}
