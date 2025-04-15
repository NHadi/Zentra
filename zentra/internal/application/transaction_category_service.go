package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
)

// TransactionCategoryService handles business logic for transaction category operations
type TransactionCategoryService struct {
	repo     accounting.TransactionCategoryRepository
	auditSvc *audit.Service
}

// NewTransactionCategoryService creates a new transaction category service instance
func NewTransactionCategoryService(repo accounting.TransactionCategoryRepository, auditSvc *audit.Service) *TransactionCategoryService {
	return &TransactionCategoryService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new transaction category
func (s *TransactionCategoryService) Create(category *accounting.TransactionCategory, ctx context.Context) error {
	if err := s.repo.Create(category, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("transaction_category", category.ID, audit.ActionCreate, nil, category, ctx)
}

// FindByID retrieves a transaction category by its ID
func (s *TransactionCategoryService) FindByID(id int, ctx context.Context) (*accounting.TransactionCategory, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all transaction categories
func (s *TransactionCategoryService) FindAll(ctx context.Context) ([]accounting.TransactionCategory, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing transaction category
func (s *TransactionCategoryService) Update(category *accounting.TransactionCategory, ctx context.Context) error {
	// Get old data for audit
	oldCategory, err := s.repo.FindByID(category.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(category, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("transaction_category", category.ID, audit.ActionUpdate, oldCategory, category, ctx)
}

// Delete deletes a transaction category by its ID
func (s *TransactionCategoryService) Delete(id int, ctx context.Context) error {
	// Get category data for audit
	category, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("transaction_category", id, audit.ActionDelete, category, nil, ctx)
}

// FindByCode retrieves a transaction category by its code
func (s *TransactionCategoryService) FindByCode(code string, ctx context.Context) (*accounting.TransactionCategory, error) {
	return s.repo.FindByCode(code, ctx)
}
