package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/payment"
)

// PaymentService handles business logic for payment operations
type PaymentService struct {
	repo     payment.Repository
	auditSvc *audit.Service
}

// NewPaymentService creates a new payment service instance
func NewPaymentService(repo payment.Repository, auditSvc *audit.Service) *PaymentService {
	return &PaymentService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new payment
func (s *PaymentService) Create(p *payment.Payment, ctx context.Context) error {
	if err := s.repo.Create(p, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("payment", p.ID, audit.ActionCreate, nil, p, ctx)
}

// FindByID retrieves a payment by its ID
func (s *PaymentService) FindByID(id int, ctx context.Context) (*payment.Payment, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all payments
func (s *PaymentService) FindAll(ctx context.Context) ([]payment.Payment, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing payment
func (s *PaymentService) Update(p *payment.Payment, ctx context.Context) error {
	// Get old data for audit
	oldPayment, err := s.repo.FindByID(p.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(p, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("payment", p.ID, audit.ActionUpdate, oldPayment, p, ctx)
}

// Delete deletes a payment by its ID
func (s *PaymentService) Delete(id int, ctx context.Context) error {
	// Get payment data for audit
	payment, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("payment", id, audit.ActionDelete, payment, nil, ctx)
}

// FindByOrderID retrieves all payments for a given order ID
func (s *PaymentService) FindByOrderID(orderID int, ctx context.Context) ([]payment.Payment, error) {
	return s.repo.FindByOrderID(orderID, ctx)
}

// FindByReferenceNumber retrieves a payment by reference number
func (s *PaymentService) FindByReferenceNumber(referenceNumber string, ctx context.Context) (*payment.Payment, error) {
	return s.repo.FindByReferenceNumber(referenceNumber, ctx)
}

// FindByStatus retrieves all payments with a specific status
func (s *PaymentService) FindByStatus(status string, ctx context.Context) ([]payment.Payment, error) {
	return s.repo.FindByStatus(status, ctx)
}
