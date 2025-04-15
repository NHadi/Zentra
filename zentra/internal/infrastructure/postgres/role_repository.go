package postgres

import (
	"context"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/menu"
	"zentra/internal/domain/permission"
	"zentra/internal/domain/role"

	"gorm.io/gorm"
)

type RoleRepository struct {
	db *gorm.DB
}

func NewRoleRepository(db *gorm.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) Create(role *role.Role, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	role.TenantID = userCtx.TenantID
	role.CreatedBy = userCtx.Username
	role.UpdatedBy = userCtx.Username

	return r.db.WithContext(ctx).Create(role).Error
}

func (r *RoleRepository) FindByID(id int, ctx context.Context) (*role.Role, error) {
	var role role.Role
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) FindByName(name string, ctx context.Context) (*role.Role, error) {
	var role role.Role
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("name = ? AND tenant_id = ?", name, userCtx.TenantID).
		First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) FindAll(ctx context.Context) ([]role.Role, error) {
	var roles []role.Role
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Find(&roles).Error
	return roles, err
}

func (r *RoleRepository) Update(role *role.Role, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	role.TenantID = userCtx.TenantID
	role.UpdatedBy = userCtx.Username

	return r.db.WithContext(ctx).Save(role).Error
}

func (r *RoleRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&role.Role{}).Error
}

func (r *RoleRepository) AssignMenus(roleID int, menuIDs []int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("role_id = ? AND tenant_id = ?", roleID, userCtx.TenantID).
		Delete(&role.RoleMenu{}).
		Error
}

func (r *RoleRepository) RemoveMenus(roleID int, menuIDs []int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("role_id = ? AND menu_id IN ? AND tenant_id = ?", roleID, menuIDs, userCtx.TenantID).
		Delete(&role.RoleMenu{}).
		Error
}

func (r *RoleRepository) GetRoleMenus(roleID int, ctx context.Context) ([]menu.Menu, error) {
	var menus []menu.Menu
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Table("master_menu").
		Joins("JOIN role_menus ON master_menu.id = role_menus.menu_id").
		Where("role_menus.role_id = ? AND master_menu.tenant_id = ?", roleID, userCtx.TenantID).
		Find(&menus).Error
	return menus, err
}

func (r *RoleRepository) AssignPermissions(roleID int, permissionIDs []int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("role_id = ? AND tenant_id = ?", roleID, userCtx.TenantID).
		Delete(&role.RolePermission{}).
		Error
}

func (r *RoleRepository) RemovePermissions(roleID int, permissionIDs []int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("role_id = ? AND permission_id IN ? AND tenant_id = ?", roleID, permissionIDs, userCtx.TenantID).
		Delete(&role.RolePermission{}).
		Error
}

func (r *RoleRepository) GetRolePermissions(roleID int, ctx context.Context) ([]permission.Permission, error) {
	var permissions []permission.Permission
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Table("master_permission").
		Joins("JOIN role_permissions ON master_permission.id = role_permissions.permission_id").
		Where("role_permissions.role_id = ? AND master_permission.tenant_id = ?", roleID, userCtx.TenantID).
		Find(&permissions).Error
	return permissions, err
}
