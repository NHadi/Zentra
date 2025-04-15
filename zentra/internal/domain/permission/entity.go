package permission

import (
	"time"
	"zentra/internal/domain/common"
)

// Permission represents the master_permission table
type Permission struct {
	ID          int    `json:"id" gorm:"primaryKey"`
	Name        string `json:"name" gorm:"type:varchar(255);not null"`
	Description string `json:"description" gorm:"type:text"`
	Code        string `gorm:"type:varchar(100);not null;unique" json:"code"`
	Module      string `gorm:"type:varchar(100);not null" json:"module"`
	common.TenantModel
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Permission) TableName() string {
	return "master_permission"
}
