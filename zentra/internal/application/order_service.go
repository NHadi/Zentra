package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/order"
)

// OrderService handles business logic for order operations
type OrderService struct {
	repo        order.Repository
	auditSvc    *audit.Service
	customerSvc *CustomerService
}

// NewOrderService creates a new order service instance
func NewOrderService(repo order.Repository, auditSvc *audit.Service, customerSvc *CustomerService) *OrderService {
	return &OrderService{
		repo:        repo,
		auditSvc:    auditSvc,
		customerSvc: customerSvc,
	}
}

// Create creates a new order
func (s *OrderService) Create(o *order.Order, ctx context.Context) error {
	if err := s.repo.Create(o, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("order", o.ID, audit.ActionCreate, nil, o, ctx)
}

// FindByID retrieves an order by its ID
func (s *OrderService) FindByID(id int, ctx context.Context) (*order.Order, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all orders
func (s *OrderService) FindAll(ctx context.Context) ([]order.Order, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing order
func (s *OrderService) Update(o *order.Order, ctx context.Context) error {
	// Get old data for audit
	oldOrder, err := s.repo.FindByID(o.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(o, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("order", o.ID, audit.ActionUpdate, oldOrder, o, ctx)
}

// Delete deletes an order by its ID
func (s *OrderService) Delete(id int, ctx context.Context) error {
	// Get order data for audit
	order, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("order", id, audit.ActionDelete, order, nil, ctx)
}

// FindByCustomerEmail retrieves all orders for a given customer email
func (s *OrderService) FindByCustomerEmail(email string, ctx context.Context) ([]order.Order, error) {
	// First find the customer by email
	customer, err := s.customerSvc.FindByEmail(email, ctx)
	if err != nil {
		return nil, err
	}

	// Then find orders by customer ID
	return s.repo.FindByCustomerID(customer.ID, ctx)
}

// FindByOrderNumber retrieves an order by order number
func (s *OrderService) FindByOrderNumber(orderNumber string, ctx context.Context) (*order.Order, error) {
	return s.repo.FindByOrderNumber(orderNumber, ctx)
}

// FindByStatus retrieves all orders with a specific status
func (s *OrderService) FindByStatus(status string, ctx context.Context) ([]order.Order, error) {
	return s.repo.FindByStatus(status, ctx)
}

// FindByPaymentStatus retrieves all orders with a specific payment status
func (s *OrderService) FindByPaymentStatus(status string, ctx context.Context) ([]order.Order, error) {
	return s.repo.FindByPaymentStatus(status, ctx)
}

// FindByCustomerID retrieves all orders for a given customer ID
func (s *OrderService) FindByCustomerID(customerID int, ctx context.Context) ([]order.Order, error) {
	return s.repo.FindByCustomerID(customerID, ctx)
}
