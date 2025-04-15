package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/audit"

	"gorm.io/gorm"
)

type AuditRepository struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) Create(audit *audit.AuditTrail, ctx context.Context) error {
	return r.db.WithContext(ctx).Omit("UpdatedBy", "UpdatedAt").Create(audit).Error
}

func (r *AuditRepository) FindByEntityID(entityType string, entityID int, ctx context.Context) ([]audit.AuditTrail, error) {
	var audits []audit.AuditTrail
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("entity_type = ? AND entity_id = ? AND tenant_id = ?", entityType, entityID, userCtx.TenantID).
		Order("created_at DESC").
		Find(&audits).Error
	return audits, err
}

func (r *AuditRepository) FindByTenantID(tenantID int, ctx context.Context) ([]audit.AuditTrail, error) {
	var audits []audit.AuditTrail
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("created_at DESC").
		Find(&audits).Error
	return audits, err
}

func (r *AuditRepository) FindByDateRange(startDate, endDate string, ctx context.Context) ([]audit.AuditTrail, error) {
	var audits []audit.AuditTrail
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND created_at BETWEEN ? AND ?", userCtx.TenantID, startDate, endDate).
		Order("created_at DESC").
		Find(&audits).Error
	return audits, err
}
