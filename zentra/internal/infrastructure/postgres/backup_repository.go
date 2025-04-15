package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/backup"

	"gorm.io/gorm"
)

type BackupRepository struct {
	db *gorm.DB
}

func NewBackupRepository(db *gorm.DB) backup.Repository {
	return &BackupRepository{db: db}
}

func (r *BackupRepository) Create(ctx context.Context, backup *backup.Backup) error {
	return r.db.WithContext(ctx).Create(backup).Error
}

func (r *BackupRepository) FindByID(ctx context.Context, id int) (*backup.Backup, error) {
	var b backup.Backup
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&b).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BackupRepository) FindAll(ctx context.Context) ([]backup.Backup, error) {
	var backups []backup.Backup
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Order("created_at DESC").
		Find(&backups).Error
	return backups, err
}

func (r *BackupRepository) Delete(ctx context.Context, id int) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&backup.Backup{}).Error
}
