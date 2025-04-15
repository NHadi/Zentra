package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/item"
)

// ItemService handles business logic for item operations
type ItemService struct {
	repo     item.Repository
	auditSvc *audit.Service
}

// NewItemService creates a new item service instance
func NewItemService(repo item.Repository, auditSvc *audit.Service) *ItemService {
	return &ItemService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new item
func (s *ItemService) Create(item *item.Item, ctx context.Context) error {
	if err := s.repo.Create(item, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("item", item.ID, audit.ActionCreate, nil, item, ctx)
}

// FindByID retrieves an item by its ID
func (s *ItemService) FindByID(id int, ctx context.Context) (*item.Item, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all items
func (s *ItemService) FindAll(ctx context.Context) ([]item.Item, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing item
func (s *ItemService) Update(item *item.Item, ctx context.Context) error {
	// Get old data for audit
	oldItem, err := s.repo.FindByID(item.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(item, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("item", item.ID, audit.ActionUpdate, oldItem, item, ctx)
}

// Delete deletes an item by its ID
func (s *ItemService) Delete(id int, ctx context.Context) error {
	// Get item data for audit
	item, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("item", id, audit.ActionDelete, item, nil, ctx)
}

// FindByCode retrieves an item by its code
func (s *ItemService) FindByCode(code string, ctx context.Context) (*item.Item, error) {
	return s.repo.FindByCode(code, ctx)
}
