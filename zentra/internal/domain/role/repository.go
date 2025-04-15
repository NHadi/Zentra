package role

import (
	"context"
	"zentra/internal/domain/menu"
	"zentra/internal/domain/permission"
)

type Repository interface {
	Create(role *Role, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Role, error)
	FindByName(name string, ctx context.Context) (*Role, error)
	FindAll(ctx context.Context) ([]Role, error)
	Update(role *Role, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	AssignMenus(roleID int, menuIDs []int, ctx context.Context) error
	RemoveMenus(roleID int, menuIDs []int, ctx context.Context) error
	GetRoleMenus(roleID int, ctx context.Context) ([]menu.Menu, error)
	AssignPermissions(roleID int, permissionIDs []int, ctx context.Context) error
	RemovePermissions(roleID int, permissionIDs []int, ctx context.Context) error
	GetRolePermissions(roleID int, ctx context.Context) ([]permission.Permission, error)
}
