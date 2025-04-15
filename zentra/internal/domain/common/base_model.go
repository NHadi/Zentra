package common

import (
	"context"
	"time"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type TenantModel struct {
	TenantID  int       `gorm:"not null" json:"tenant_id"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
	CreatedBy string    `gorm:"type:varchar(255)" json:"created_by"`
	UpdatedBy string    `gorm:"type:varchar(255)" json:"updated_by"`
}

// BeforeCreate GORM hook to set audit fields before creating a record
func (m *TenantModel) BeforeCreate(tx *gorm.DB) error {
	value, ok := tx.Statement.Context.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if ok && value != nil {
		m.CreatedBy = value.Username
		m.UpdatedBy = value.Username
		m.TenantID = value.TenantID
	}
	return nil
}

// BeforeUpdate GORM hook to set audit fields before updating a record
func (m *TenantModel) BeforeUpdate(tx *gorm.DB) error {
	value, ok := tx.Statement.Context.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if ok && value != nil {
		m.UpdatedBy = value.Username
	}
	return nil
}

// WithContext adds user context to database operations
func WithContext(ctx context.Context, db *gorm.DB) *gorm.DB {
	value, ok := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if ok && value != nil {
		return db.WithContext(ctx)
	}
	return db
}
