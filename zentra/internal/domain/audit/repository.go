package audit

import "context"

type Repository interface {
	Create(audit *AuditTrail, ctx context.Context) error
	FindByEntityID(entityType string, entityID int, ctx context.Context) ([]AuditTrail, error)
	FindByTenantID(tenantID int, ctx context.Context) ([]AuditTrail, error)
	FindByDateRange(startDate, endDate string, ctx context.Context) ([]AuditTrail, error)
}
