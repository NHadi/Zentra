package models

type StockMovement struct {
	ID            int    `json:"id" gorm:"primaryKey"`
	ItemID        int    `json:"item_id"`
	MovementType  string `json:"movement_type"`
	Quantity      int    `json:"quantity"`
	ReferenceType string `json:"reference_type"`
	ReferenceID   int    `json:"reference_id"`
	Notes         string `json:"notes"`
}
