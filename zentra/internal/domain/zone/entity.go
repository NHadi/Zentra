package zone

import (
	"zentra/internal/domain/common"
	"zentra/internal/domain/models"
	"zentra/internal/domain/office"
)

// Zone represents the master_zone table
type Zone struct {
	models.Zone
	Offices []office.Office `gorm:"foreignKey:ZoneID;references:ID" json:"offices,omitempty"`
	common.TenantModel
}

// TableName specifies the table name for GORM
func (Zone) TableName() string {
	return "master_zone"
}
