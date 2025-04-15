package stockmovement

import (
	"zentra/internal/domain/common"
	"zentra/internal/domain/item"
	"zentra/internal/domain/models"
)

// StockMovement represents the item_stock_movement table
type StockMovement struct {
	models.StockMovement
	Item *item.Item `gorm:"foreignKey:ItemID;references:ID" json:"item,omitempty"`
	common.TenantModel
}

// TableName specifies the table name for GORM
func (StockMovement) TableName() string {
	return "item_stock_movement"
}
