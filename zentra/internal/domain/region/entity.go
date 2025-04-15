package region

import (
	"zentra/internal/domain/common"
	"zentra/internal/domain/zone"
)

// Region represents the master_region table
type Region struct {
	ID          int         `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	Name        string      `gorm:"type:varchar(100);not null" json:"name"`
	Description string      `gorm:"type:text" json:"description"`
	Zones       []zone.Zone `gorm:"foreignKey:RegionID" json:"zones,omitempty"`
	common.TenantModel
}

func (Region) TableName() string {
	return "master_region"
}
