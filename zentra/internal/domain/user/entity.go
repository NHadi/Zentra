package user

import (
	"zentra/internal/domain/common"

	"github.com/google/uuid"
)

type User struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Username string    `gorm:"type:varchar(255);not null" json:"username"`
	Email    string    `gorm:"type:varchar(255);unique;not null" json:"email"`
	Password string    `gorm:"type:varchar(255);not null" json:"-"`
	RoleID   int       `gorm:"type:integer;not null" json:"role_id"`
	common.TenantModel
}
