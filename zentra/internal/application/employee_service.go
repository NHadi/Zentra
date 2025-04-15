package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/employee"
)

// EmployeeService handles business logic for employee operations
type EmployeeService struct {
	repo     employee.Repository
	auditSvc *audit.Service
}

// NewEmployeeService creates a new employee service instance
func NewEmployeeService(repo employee.Repository, auditSvc *audit.Service) *EmployeeService {
	return &EmployeeService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new employee
func (s *EmployeeService) Create(e *employee.Employee, ctx context.Context) error {
	if err := s.repo.Create(e, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("employee", e.ID, audit.ActionCreate, nil, e, ctx)
}

// FindByID retrieves an employee by its ID
func (s *EmployeeService) FindByID(id int, ctx context.Context) (*employee.Employee, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all employees
func (s *EmployeeService) FindAll(ctx context.Context) ([]employee.Employee, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing employee
func (s *EmployeeService) Update(e *employee.Employee, ctx context.Context) error {
	// Get old data for audit
	oldEmployee, err := s.repo.FindByID(e.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(e, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("employee", e.ID, audit.ActionUpdate, oldEmployee, e, ctx)
}

// Delete deletes an employee by its ID
func (s *EmployeeService) Delete(id int, ctx context.Context) error {
	// Get employee data for audit
	employee, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("employee", id, audit.ActionDelete, employee, nil, ctx)
}

// FindByDivisionID retrieves all employees for a given division ID
func (s *EmployeeService) FindByDivisionID(divisionID int, ctx context.Context) ([]employee.Employee, error) {
	return s.repo.FindByDivisionID(divisionID, ctx)
}

// FindByEmail retrieves an employee by email
func (s *EmployeeService) FindByEmail(email string, ctx context.Context) (*employee.Employee, error) {
	return s.repo.FindByEmail(email, ctx)
}
