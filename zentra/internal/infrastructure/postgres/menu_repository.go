package postgres

import (
	"context"
	"fmt"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/menu"

	"gorm.io/gorm"
)

type MenuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) *MenuRepository {
	return &MenuRepository{db: db}
}

func (r *MenuRepository) FindAll(ctx context.Context) ([]menu.Menu, error) {
	var menus []menu.Menu
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Debug log
	fmt.Printf("Fetching menus for tenant_id: %d\n", userCtx.TenantID)

	err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).
		Order("sort ASC, id ASC").
		Find(&menus).Error

	// Debug log
	fmt.Printf("Found %d menus for tenant_id: %d\n", len(menus), userCtx.TenantID)

	return menus, err
}

func (r *MenuRepository) FindByRoleID(roleID int, ctx context.Context) ([]menu.Menu, error) {
	var menus []menu.Menu
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Joins("JOIN role_menus ON role_menus.menu_id = master_menu.id").
		Where("role_menus.role_id = ? AND master_menu.tenant_id = ?", roleID, userCtx.TenantID).
		Order("master_menu.sort ASC, master_menu.id ASC").
		Find(&menus).Error
	return menus, err
}

func (r *MenuRepository) FindByUserID(userID string, ctx context.Context) ([]menu.Menu, error) {
	var menus []menu.Menu
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Joins("JOIN user_menus ON user_menus.menu_id = master_menu.id").
		Where("user_menus.user_id = ? AND master_menu.tenant_id = ?", userID, userCtx.TenantID).
		Order("master_menu.sort ASC, master_menu.id ASC").
		Find(&menus).Error
	return menus, err
}

func (r *MenuRepository) FindByID(id int, ctx context.Context) (*menu.Menu, error) {
	var menu menu.Menu
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		First(&menu).Error
	if err != nil {
		return nil, err
	}
	return &menu, nil
}

func (r *MenuRepository) Create(menu *menu.Menu, ctx context.Context) error {
	return r.db.WithContext(ctx).Create(menu).Error
}

func (r *MenuRepository) Update(menu *menu.Menu, ctx context.Context) error {
	return r.db.WithContext(ctx).Save(menu).Error
}

func (r *MenuRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&menu.Menu{}).Error
}
