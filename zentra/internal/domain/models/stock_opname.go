package models

import "time"

type StockOpname struct {
	ID           int       `json:"id" gorm:"primaryKey"`
	OpnameNumber string    `json:"opname_number"`
	OpnameDate   time.Time `json:"opname_date"`
	Status       string    `json:"status"`
	Notes        string    `json:"notes"`
}

type StockOpnameDetail struct {
	ID            int    `json:"id" gorm:"primaryKey"`
	StockOpnameID int    `json:"stock_opname_id" gorm:"column:stock_opname_id"`
	ItemID        int    `json:"item_id"`
	SystemQty     int    `json:"system_qty" gorm:"column:system_qty"`
	ActualQty     int    `json:"actual_qty" gorm:"column:actual_qty"`
	DifferenceQty int    `json:"difference_qty" gorm:"column:difference_qty"`
	Notes         string `json:"notes"`
}
