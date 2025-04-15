package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/channel"

	"gorm.io/gorm"
)

type ChannelRepository struct {
	db *gorm.DB
}

func NewChannelRepository(db *gorm.DB) channel.Repository {
	return &ChannelRepository{db: db}
}

func (r *ChannelRepository) Create(channel *channel.Channel, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	channel.TenantID = userCtx.TenantID
	channel.CreatedBy = userCtx.Username
	channel.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(channel).Error
}

func (r *ChannelRepository) FindByID(id int, ctx context.Context) (*channel.Channel, error) {
	var channel channel.Channel
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&channel)
	return &channel, result.Error
}

func (r *ChannelRepository) FindAll(ctx context.Context) ([]channel.Channel, error) {
	var channels []channel.Channel
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&channels)
	return channels, result.Error
}

func (r *ChannelRepository) Update(channel *channel.Channel, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	channel.TenantID = userCtx.TenantID
	channel.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", channel.ID, userCtx.TenantID).
		Updates(channel).Error
}

func (r *ChannelRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&channel.Channel{}).Error
}

func (r *ChannelRepository) FindByCode(code string, ctx context.Context) (*channel.Channel, error) {
	var channel channel.Channel
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("code = ? AND tenant_id = ?", code, userCtx.TenantID).
		First(&channel)
	return &channel, result.Error
}
