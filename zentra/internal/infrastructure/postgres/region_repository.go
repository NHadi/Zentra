package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/region"

	"gorm.io/gorm"
)

type RegionRepository struct {
	db *gorm.DB
}

func NewRegionRepository(db *gorm.DB) region.Repository {
	return &RegionRepository{db: db}
}

func (r *RegionRepository) Create(reg *region.Region, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	reg.TenantID = userCtx.TenantID
	reg.CreatedBy = userCtx.Username
	reg.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(reg).Error
}

func (r *RegionRepository) FindByID(id int, ctx context.Context) (*region.Region, error) {
	var region region.Region
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Preload("Zones").
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&region).Error; err != nil {
		return nil, err
	}
	return &region, nil
}

func (r *RegionRepository) FindAll(ctx context.Context) ([]region.Region, error) {
	var regions []region.Region
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).
		Preload("Zones").
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&regions).Error; err != nil {
		return nil, err
	}
	return regions, nil
}

func (r *RegionRepository) Update(reg *region.Region, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	reg.TenantID = userCtx.TenantID
	reg.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", reg.ID, userCtx.TenantID).
		Updates(reg).Error
}

func (r *RegionRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&region.Region{}).Error
}
