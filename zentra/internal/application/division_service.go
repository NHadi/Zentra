package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/division"
)

// DivisionService handles business logic for division operations
type DivisionService struct {
	repo     division.Repository
	auditSvc *audit.Service
}

// NewDivisionService creates a new division service instance
func NewDivisionService(repo division.Repository, auditSvc *audit.Service) *DivisionService {
	return &DivisionService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new division
func (s *DivisionService) Create(d *division.Division, ctx context.Context) error {
	if err := s.repo.Create(d, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("division", d.ID, audit.ActionCreate, nil, d, ctx)
}

// FindByID retrieves a division by its ID
func (s *DivisionService) FindByID(id int, ctx context.Context) (*division.Division, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all divisions
func (s *DivisionService) FindAll(ctx context.Context) ([]division.Division, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing division
func (s *DivisionService) Update(d *division.Division, ctx context.Context) error {
	// Get old data for audit
	oldDivision, err := s.repo.FindByID(d.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(d, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("division", d.ID, audit.ActionUpdate, oldDivision, d, ctx)
}

// Delete deletes a division by its ID
func (s *DivisionService) Delete(id int, ctx context.Context) error {
	// Get division data for audit
	division, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("division", id, audit.ActionDelete, division, nil, ctx)
}

// UpdateEmployees updates the employees assigned to a division
func (s *DivisionService) UpdateEmployees(divisionID int, employeeIDs []int, ctx context.Context) error {
	// Get old data for audit
	oldDivision, err := s.repo.FindByID(divisionID, ctx)
	if err != nil {
		return err
	}

	// Update employees
	if err := s.repo.UpdateEmployees(divisionID, employeeIDs, ctx); err != nil {
		return err
	}

	// Get updated data for audit
	updatedDivision, err := s.repo.FindByID(divisionID, ctx)
	if err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("division", divisionID, audit.ActionUpdate, oldDivision, updatedDivision, ctx)
}
