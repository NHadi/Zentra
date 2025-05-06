package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/customer"

	"gorm.io/gorm"
)

type customerRepository struct {
	db *gorm.DB
}

// NewCustomerRepository creates a new customer repository instance
func NewCustomerRepository(db *gorm.DB) customer.Repository {
	return &customerRepository{
		db: db,
	}
}

// Create creates a new customer
func (r *customerRepository) Create(customer *customer.Customer, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	customer.TenantID = userCtx.TenantID
	customer.CreatedBy = userCtx.Username
	customer.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(customer).Error
}

// FindByID retrieves a customer by its ID
func (r *customerRepository) FindByID(id int, ctx context.Context) (*customer.Customer, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customer customer.Customer
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

// FindAll retrieves all customers with pagination
func (r *customerRepository) FindAll(page, perPage int, ctx context.Context) ([]customer.Customer, int64, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customers []customer.Customer
	var total int64

	// Calculate total count
	if err := r.db.WithContext(ctx).Model(&customer.Customer{}).
		Where("tenant_id = ?", userCtx.TenantID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Offset(offset).
		Limit(perPage).
		Order("name ASC").
		Find(&customers).Error

	if err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

// Update updates an existing customer
func (r *customerRepository) Update(customer *customer.Customer, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	customer.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", customer.ID, userCtx.TenantID).Updates(customer).Error
}

// Delete deletes a customer by its ID
func (r *customerRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&customer.Customer{}).Error
}

// FindByEmail retrieves a customer by email
func (r *customerRepository) FindByEmail(email string, ctx context.Context) (*customer.Customer, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customer customer.Customer
	err := r.db.WithContext(ctx).Where("email = ? AND tenant_id = ?", email, userCtx.TenantID).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

// FindByPhone retrieves a customer by phone number
func (r *customerRepository) FindByPhone(phone string, ctx context.Context) (*customer.Customer, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customer customer.Customer
	err := r.db.WithContext(ctx).Where("phone = ? AND tenant_id = ?", phone, userCtx.TenantID).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

// FindByCustomerNumber retrieves a customer by customer number
func (r *customerRepository) FindByCustomerNumber(customerNumber string, ctx context.Context) (*customer.Customer, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customer customer.Customer
	err := r.db.WithContext(ctx).Where("customer_number = ? AND tenant_id = ?", customerNumber, userCtx.TenantID).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

// Search searches for customers based on a query string and pagination parameters
func (r *customerRepository) Search(query string, page, perPage int, ctx context.Context) ([]customer.Customer, int64, error) {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	var customers []customer.Customer
	var total int64

	// Build the base query
	baseQuery := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Where("(name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR customer_number ILIKE ?)",
			"%"+query+"%", "%"+query+"%", "%"+query+"%", "%"+query+"%")

	// Get total count
	if err := baseQuery.Model(&customer.Customer{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * perPage
	err := baseQuery.
		Offset(offset).
		Limit(perPage).
		Order("name ASC").
		Find(&customers).Error

	if err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}
