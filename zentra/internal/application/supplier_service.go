package application

import (
	"context"
	"errors"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/supplier"
)

// SupplierService handles business logic for supplier operations
type SupplierService struct {
	repo     supplier.Repository
	auditSvc *audit.Service
}

// NewSupplierService creates a new supplier service instance
func NewSupplierService(repo supplier.Repository, auditSvc *audit.Service) *SupplierService {
	return &SupplierService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new supplier
func (s *SupplierService) Create(supplier *supplier.Supplier, ctx context.Context) error {
	// Check if supplier code already exists
	if existing, _ := s.repo.FindByCode(supplier.Code, ctx); existing != nil {
		return errors.New("supplier code already exists")
	}

	if err := s.repo.Create(supplier, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("supplier", supplier.ID, audit.ActionCreate, nil, supplier, ctx)
}

// FindByID retrieves a supplier by its ID
func (s *SupplierService) FindByID(id int, ctx context.Context) (*supplier.Supplier, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all suppliers
func (s *SupplierService) FindAll(ctx context.Context) ([]supplier.Supplier, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing supplier
func (s *SupplierService) Update(supplier *supplier.Supplier, ctx context.Context) error {
	// Check if supplier code already exists for a different supplier
	if existing, _ := s.repo.FindByCode(supplier.Code, ctx); existing != nil && existing.ID != supplier.ID {
		return errors.New("supplier code already exists")
	}

	// Get old data for audit
	oldSupplier, err := s.repo.FindByID(supplier.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(supplier, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("supplier", supplier.ID, audit.ActionUpdate, oldSupplier, supplier, ctx)
}

// Delete deletes a supplier by its ID
func (s *SupplierService) Delete(id int, ctx context.Context) error {
	// Get supplier data for audit
	supplier, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("supplier", id, audit.ActionDelete, supplier, nil, ctx)
}

// FindByCode retrieves a supplier by its code
func (s *SupplierService) FindByCode(code string, ctx context.Context) (*supplier.Supplier, error) {
	return s.repo.FindByCode(code, ctx)
}
