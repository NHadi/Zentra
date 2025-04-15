package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
)

// CashFlowService handles business logic for cash flow operations
type CashFlowService struct {
	repo     accounting.CashFlowRepository
	auditSvc *audit.Service
}

// NewCashFlowService creates a new cash flow service instance
func NewCashFlowService(repo accounting.CashFlowRepository, auditSvc *audit.Service) *CashFlowService {
	return &CashFlowService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new cash flow record
func (s *CashFlowService) Create(cashFlow *accounting.CashFlow, ctx context.Context) error {
	if err := s.repo.Create(cashFlow, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("cash_flow", cashFlow.ID, audit.ActionCreate, nil, cashFlow, ctx)
}

// FindByID retrieves a cash flow record by its ID
func (s *CashFlowService) FindByID(id int, ctx context.Context) (*accounting.CashFlow, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all cash flow records
func (s *CashFlowService) FindAll(ctx context.Context) ([]accounting.CashFlow, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing cash flow record
func (s *CashFlowService) Update(cashFlow *accounting.CashFlow, ctx context.Context) error {
	// Get old data for audit
	oldCashFlow, err := s.repo.FindByID(cashFlow.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(cashFlow, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("cash_flow", cashFlow.ID, audit.ActionUpdate, oldCashFlow, cashFlow, ctx)
}

// Delete deletes a cash flow record by its ID
func (s *CashFlowService) Delete(id int, ctx context.Context) error {
	// Get cash flow data for audit
	cashFlow, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("cash_flow", id, audit.ActionDelete, cashFlow, nil, ctx)
}

// FindByDateRange retrieves cash flow records within a date range
func (s *CashFlowService) FindByDateRange(startDate, endDate string, ctx context.Context) ([]accounting.CashFlow, error) {
	return s.repo.FindByDateRange(startDate, endDate, ctx)
}
