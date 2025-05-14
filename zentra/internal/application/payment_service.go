package application

import (
	"context"
	"fmt"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/order"
	"zentra/internal/domain/payment"
)

// PaymentService handles business logic for payment operations
type PaymentService struct {
	repo      payment.Repository
	orderRepo order.Repository
	auditSvc  *audit.Service
}

// NewPaymentService creates a new payment service instance
func NewPaymentService(repo payment.Repository, orderRepo order.Repository, auditSvc *audit.Service) *PaymentService {
	return &PaymentService{
		repo:      repo,
		orderRepo: orderRepo,
		auditSvc:  auditSvc,
	}
}

// Create creates a new payment and associated cash flow
func (s *PaymentService) Create(p *payment.Payment, ctx context.Context) error {
	// Get order to get office_id and order number
	order, err := s.orderRepo.FindByID(p.OrderID, ctx)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	// Create payment
	if err := s.repo.Create(p, ctx); err != nil {
		return fmt.Errorf("failed to create payment: %w", err)
	}

	// Create associated cash flow
	cashFlow := &payment.CashFlow{
		TransactionDate: p.PaymentDate,
		TransactionType: "income",
		CategoryID:      1, // Assuming 1 is the ID for the PAYMENT category
		Amount:          p.Amount,
		Description:     fmt.Sprintf("Payment %s for Order #%s", p.ReferenceNumber, order.OrderNumber),
		ReferenceNumber: p.ReferenceNumber,
		ReferenceType:   "payment",
		ReferenceID:     p.ID,
		PaymentID:       p.ID,
		OfficeID:        order.OfficeID,
		Status:          p.Status,
	}

	if err := s.repo.CreateCashFlow(cashFlow, ctx); err != nil {
		return fmt.Errorf("failed to create cash flow: %w", err)
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

// Update updates an existing payment and its cash flow
func (s *PaymentService) Update(p *payment.Payment, ctx context.Context) error {
	// Get old data for audit
	oldPayment, err := s.repo.FindByID(p.ID, ctx)
	if err != nil {
		return fmt.Errorf("failed to get old payment: %w", err)
	}

	// Update payment
	if err := s.repo.Update(p, ctx); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	// Update cash flow status if payment status changed
	if oldPayment.Status != p.Status {
		if err := s.repo.UpdateCashFlowStatus(p.ID, p.Status, ctx); err != nil {
			return fmt.Errorf("failed to update cash flow status: %w", err)
		}
	}

	// Log the update action
	return s.auditSvc.LogChange("payment", p.ID, audit.ActionUpdate, oldPayment, p, ctx)
}

// Delete deletes a payment and its associated cash flow
func (s *PaymentService) Delete(id int, ctx context.Context) error {
	// Get payment data for audit
	payment, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return fmt.Errorf("failed to get payment: %w", err)
	}

	// Delete payment (repository will handle deleting associated cash flow)
	if err := s.repo.Delete(id, ctx); err != nil {
		return fmt.Errorf("failed to delete payment: %w", err)
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
