package item

import (
	"zentra/internal/domain/common"
	"zentra/internal/domain/models"
)

// Item represents the master_item table
type Item struct {
	models.Item
	common.TenantModel
}

// TableName specifies the table name for GORM
func (Item) TableName() string {
	return "master_item"
}
