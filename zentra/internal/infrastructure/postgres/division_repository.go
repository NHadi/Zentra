package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/division"
	"zentra/internal/domain/employee"

	"gorm.io/gorm"
)

type divisionRepository struct {
	db *gorm.DB
}

// NewDivisionRepository creates a new division repository instance
func NewDivisionRepository(db *gorm.DB) division.Repository {
	return &divisionRepository{
		db: db,
	}
}

// Create creates a new division
func (r *divisionRepository) Create(division *division.Division, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	division.TenantID = userCtx.TenantID
	division.CreatedBy = userCtx.Username
	division.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(division).Error
}

// FindByID retrieves a division by its ID
func (r *divisionRepository) FindByID(id int, ctx context.Context) (*division.Division, error) {
	var division division.Division
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Preload("Employees").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&division).Error
	if err != nil {
		return nil, err
	}
	return &division, nil
}

// FindAll retrieves all divisions
func (r *divisionRepository) FindAll(ctx context.Context) ([]division.Division, error) {
	var divisions []division.Division
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Preload("Employees").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&divisions).Error
	if err != nil {
		return nil, err
	}
	return divisions, nil
}

// Update updates an existing division
func (r *divisionRepository) Update(division *division.Division, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	division.TenantID = userCtx.TenantID
	division.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", division.ID, userCtx.TenantID).Updates(division).Error
}

// Delete deletes a division by its ID
func (r *divisionRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&division.Division{}).Error
}

// UpdateEmployees updates the employees assigned to a division
func (r *divisionRepository) UpdateEmployees(divisionID int, employeeIDs []int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Start a transaction
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// First, remove all existing employee associations
		if err := tx.Model(&employee.Employee{}).
			Where("division_id = ? AND tenant_id = ?", divisionID, userCtx.TenantID).
			Update("division_id", nil).Error; err != nil {
			return err
		}

		// Then, update the division_id for the specified employees
		if len(employeeIDs) > 0 {
			if err := tx.Model(&employee.Employee{}).
				Where("id IN ? AND tenant_id = ?", employeeIDs, userCtx.TenantID).
				Update("division_id", divisionID).Error; err != nil {
				return err
			}
		}

		return nil
	})
}
