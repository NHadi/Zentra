package role

import (
	"zentra/internal/domain/common"
	"zentra/internal/domain/menu"
	"zentra/internal/domain/permission"
)

// Role represents the master_role table
type Role struct {
	ID          int                     `json:"id" gorm:"primaryKey"`
	Name        string                  `json:"name" gorm:"type:varchar(255);not null"`
	Description string                  `json:"description" gorm:"type:text"`
	Menus       []menu.Menu             `gorm:"many2many:role_menus;" json:"menus,omitempty"`
	Permissions []permission.Permission `gorm:"many2many:role_permissions;" json:"permissions"`
	common.TenantModel
}

// RoleMenu represents the role_menus junction table
type RoleMenu struct {
	RoleID int `json:"role_id" gorm:"primaryKey"`
	MenuID int `json:"menu_id" gorm:"primaryKey"`
	common.TenantModel
}

// RolePermission represents the role_permissions table
type RolePermission struct {
	RoleID       int `json:"role_id" gorm:"primaryKey"`
	PermissionID int `json:"permission_id" gorm:"primaryKey"`
	common.TenantModel
}

func (Role) TableName() string {
	return "master_role"
}

func (RoleMenu) TableName() string {
	return "role_menus"
}

func (RolePermission) TableName() string {
	return "role_permissions"
}
