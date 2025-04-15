package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/payment"

	"gorm.io/gorm"
)

type paymentRepository struct {
	db *gorm.DB
}

// NewPaymentRepository creates a new payment repository instance
func NewPaymentRepository(db *gorm.DB) payment.Repository {
	return &paymentRepository{
		db: db,
	}
}

// Create creates a new payment
func (r *paymentRepository) Create(payment *payment.Payment, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	payment.TenantID = userCtx.TenantID
	payment.CreatedBy = userCtx.Username
	payment.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(payment).Error
}

// FindByID retrieves a payment by its ID
func (r *paymentRepository) FindByID(id int, ctx context.Context) (*payment.Payment, error) {
	var payment payment.Payment
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&payment).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

// FindAll retrieves all payments
func (r *paymentRepository) FindAll(ctx context.Context) ([]payment.Payment, error) {
	var payments []payment.Payment
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).Find(&payments).Error
	if err != nil {
		return nil, err
	}
	return payments, nil
}

// Update updates an existing payment
func (r *paymentRepository) Update(payment *payment.Payment, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	payment.TenantID = userCtx.TenantID
	payment.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", payment.ID, userCtx.TenantID).Updates(payment).Error
}

// Delete deletes a payment by its ID
func (r *paymentRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&payment.Payment{}).Error
}

// FindByOrderID retrieves all payments for a given order ID
func (r *paymentRepository) FindByOrderID(orderID int, ctx context.Context) ([]payment.Payment, error) {
	var payments []payment.Payment
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("order_id = ? AND tenant_id = ?", orderID, userCtx.TenantID).Find(&payments).Error
	if err != nil {
		return nil, err
	}
	return payments, nil
}

// FindByReferenceNumber retrieves a payment by reference number
func (r *paymentRepository) FindByReferenceNumber(referenceNumber string, ctx context.Context) (*payment.Payment, error) {
	var payment payment.Payment
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("reference_number = ? AND tenant_id = ?", referenceNumber, userCtx.TenantID).First(&payment).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

// FindByStatus retrieves all payments with a specific status
func (r *paymentRepository) FindByStatus(status string, ctx context.Context) ([]payment.Payment, error) {
	var payments []payment.Payment
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("status = ? AND tenant_id = ?", status, userCtx.TenantID).Find(&payments).Error
	if err != nil {
		return nil, err
	}
	return payments, nil
}
