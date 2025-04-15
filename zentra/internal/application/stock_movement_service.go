package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/stockmovement"
)

// StockMovementService handles business logic for stock movement operations
type StockMovementService struct {
	repo     stockmovement.Repository
	auditSvc *audit.Service
}

// NewStockMovementService creates a new stock movement service instance
func NewStockMovementService(repo stockmovement.Repository, auditSvc *audit.Service) *StockMovementService {
	return &StockMovementService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new stock movement
func (s *StockMovementService) Create(movement *stockmovement.StockMovement, ctx context.Context) error {
	if err := s.repo.Create(movement, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("stock_movement", movement.ID, audit.ActionCreate, nil, movement, ctx)
}

// FindByID retrieves a stock movement by its ID
func (s *StockMovementService) FindByID(id int, ctx context.Context) (*stockmovement.StockMovement, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all stock movements
func (s *StockMovementService) FindAll(ctx context.Context) ([]stockmovement.StockMovement, error) {
	return s.repo.FindAll(ctx)
}

// FindByItemID retrieves all stock movements for a specific item
func (s *StockMovementService) FindByItemID(itemID int, ctx context.Context) ([]stockmovement.StockMovement, error) {
	return s.repo.FindByItemID(itemID, ctx)
}

// FindByReference retrieves all stock movements for a specific reference
func (s *StockMovementService) FindByReference(refType string, refID int, ctx context.Context) ([]stockmovement.StockMovement, error) {
	return s.repo.FindByReference(refType, refID, ctx)
}
