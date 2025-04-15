package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/employee"

	"gorm.io/gorm"
)

type employeeRepository struct {
	db *gorm.DB
}

// NewEmployeeRepository creates a new employee repository instance
func NewEmployeeRepository(db *gorm.DB) employee.Repository {
	return &employeeRepository{
		db: db,
	}
}

// Create creates a new employee
func (r *employeeRepository) Create(employee *employee.Employee, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	employee.TenantID = userCtx.TenantID
	employee.CreatedBy = userCtx.Username
	employee.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(employee).Error
}

// FindByID retrieves an employee by its ID
func (r *employeeRepository) FindByID(id int, ctx context.Context) (*employee.Employee, error) {
	var employee employee.Employee
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&employee).Error
	if err != nil {
		return nil, err
	}
	return &employee, nil
}

// FindAll retrieves all employees
func (r *employeeRepository) FindAll(ctx context.Context) ([]employee.Employee, error) {
	var employees []employee.Employee
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).Find(&employees).Error
	if err != nil {
		return nil, err
	}
	return employees, nil
}

// Update updates an existing employee
func (r *employeeRepository) Update(employee *employee.Employee, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	employee.TenantID = userCtx.TenantID
	employee.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", employee.ID, userCtx.TenantID).Updates(employee).Error
}

// Delete deletes an employee by its ID
func (r *employeeRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&employee.Employee{}).Error
}

// FindByDivisionID retrieves all employees for a given division ID
func (r *employeeRepository) FindByDivisionID(divisionID int, ctx context.Context) ([]employee.Employee, error) {
	var employees []employee.Employee
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("division_id = ? AND tenant_id = ?", divisionID, userCtx.TenantID).Find(&employees).Error
	if err != nil {
		return nil, err
	}
	return employees, nil
}

// FindByEmail retrieves an employee by email
func (r *employeeRepository) FindByEmail(email string, ctx context.Context) (*employee.Employee, error) {
	var employee employee.Employee
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("email = ? AND tenant_id = ?", email, userCtx.TenantID).First(&employee).Error
	if err != nil {
		return nil, err
	}
	return &employee, nil
}
