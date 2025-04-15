package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/zone"

	"gorm.io/gorm"
)

type ZoneRepository struct {
	db *gorm.DB
}

func NewZoneRepository(db *gorm.DB) zone.Repository {
	return &ZoneRepository{db: db}
}

func (r *ZoneRepository) Create(z *zone.Zone, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	z.TenantID = userCtx.TenantID
	z.CreatedBy = userCtx.Username
	z.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(z).Error
}

func (r *ZoneRepository) FindByID(id int, ctx context.Context) (*zone.Zone, error) {
	var zone zone.Zone
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Offices").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&zone)
	return &zone, result.Error
}

func (r *ZoneRepository) FindAll(ctx context.Context) ([]zone.Zone, error) {
	var zones []zone.Zone
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Offices").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&zones)
	return zones, result.Error
}

func (r *ZoneRepository) Update(z *zone.Zone, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	z.TenantID = userCtx.TenantID
	z.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", z.ID, userCtx.TenantID).
		Updates(z).Error
}

func (r *ZoneRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&zone.Zone{}).Error
}

func (r *ZoneRepository) FindByRegionID(regionID int, ctx context.Context) ([]zone.Zone, error) {
	var zones []zone.Zone
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Preload("Offices").
		Where("region_id = ? AND tenant_id = ?", regionID, userCtx.TenantID).
		Find(&zones)
	return zones, result.Error
}
