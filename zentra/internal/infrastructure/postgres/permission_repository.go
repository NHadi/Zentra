package postgres

import (
	"context"
	"fmt"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/permission"

	"gorm.io/gorm"
)

type PermissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) *PermissionRepository {
	return &PermissionRepository{db: db}
}

func (r *PermissionRepository) FindAll(ctx context.Context) ([]permission.Permission, error) {
	var permissions []permission.Permission
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Debug log
	fmt.Printf("Fetching permissions for tenant_id: %d\n", userCtx.TenantID)

	err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).Find(&permissions).Error

	// Debug log
	fmt.Printf("Found %d permissions for tenant_id: %d\n", len(permissions), userCtx.TenantID)

	return permissions, err
}

func (r *PermissionRepository) FindByID(id int, ctx context.Context) (*permission.Permission, error) {
	var perm permission.Permission
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&perm).Error
	if err != nil {
		return nil, err
	}
	return &perm, nil
}

func (r *PermissionRepository) Create(perm *permission.Permission, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	perm.TenantID = userCtx.TenantID
	perm.CreatedBy = userCtx.Username
	perm.UpdatedBy = userCtx.Username

	return r.db.WithContext(ctx).Create(perm).Error
}

func (r *PermissionRepository) Update(perm *permission.Permission, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	perm.TenantID = userCtx.TenantID
	perm.UpdatedBy = userCtx.Username

	return r.db.WithContext(ctx).Save(perm).Error
}

func (r *PermissionRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&permission.Permission{}).Error
}

func (r *PermissionRepository) FindByName(name string) (*permission.Permission, error) {
	var perm permission.Permission
	err := r.db.Where("name = ?", name).First(&perm).Error
	if err != nil {
		return nil, err
	}
	return &perm, nil
}

func (r *PermissionRepository) FindByCode(code string) (*permission.Permission, error) {
	var perm permission.Permission
	err := r.db.Where("code = ?", code).First(&perm).Error
	if err != nil {
		return nil, err
	}
	return &perm, nil
}
