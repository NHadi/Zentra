package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/item"
	"zentra/internal/domain/supplier"
)

// PurchaseOrderService handles business logic for purchase order operations
type PurchaseOrderService struct {
	repo        accounting.PurchaseOrderRepository
	supplierSvc *SupplierService
	itemSvc     *ItemService
	auditSvc    *audit.Service
}

// NewPurchaseOrderService creates a new purchase order service instance
func NewPurchaseOrderService(repo accounting.PurchaseOrderRepository, supplierSvc *SupplierService, itemSvc *ItemService, auditSvc *audit.Service) *PurchaseOrderService {
	return &PurchaseOrderService{
		repo:        repo,
		supplierSvc: supplierSvc,
		itemSvc:     itemSvc,
		auditSvc:    auditSvc,
	}
}

// Create creates a new purchase order
func (s *PurchaseOrderService) Create(order *accounting.PurchaseOrder, ctx context.Context) error {
	if err := s.repo.Create(order, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("purchase_order", order.ID, audit.ActionCreate, nil, order, ctx)
}

// FindByID retrieves a purchase order by its ID
func (s *PurchaseOrderService) FindByID(id int, ctx context.Context) (*accounting.PurchaseOrder, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all purchase orders
func (s *PurchaseOrderService) FindAll(ctx context.Context) ([]accounting.PurchaseOrder, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing purchase order
func (s *PurchaseOrderService) Update(order *accounting.PurchaseOrder, ctx context.Context) error {
	// Get old data for audit
	oldOrder, err := s.repo.FindByID(order.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(order, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("purchase_order", order.ID, audit.ActionUpdate, oldOrder, order, ctx)
}

// Delete deletes a purchase order by its ID
func (s *PurchaseOrderService) Delete(id int, ctx context.Context) error {
	// Get order data for audit
	order, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("purchase_order", id, audit.ActionDelete, order, nil, ctx)
}

// FindByNumber retrieves a purchase order by its number
func (s *PurchaseOrderService) FindByNumber(poNumber string, ctx context.Context) (*accounting.PurchaseOrder, error) {
	return s.repo.FindByNumber(poNumber, ctx)
}

// GetSupplier retrieves supplier details for a purchase order
func (s *PurchaseOrderService) GetSupplier(supplierID int, ctx context.Context) (*supplier.Supplier, error) {
	return s.supplierSvc.FindByID(supplierID, ctx)
}

// GetItem retrieves item details for a purchase order item
func (s *PurchaseOrderService) GetItem(itemID int, ctx context.Context) (*item.Item, error) {
	return s.itemSvc.FindByID(itemID, ctx)
}
