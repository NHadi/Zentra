package models

type Item struct {
	ID          int    `json:"id" gorm:"primaryKey"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Unit        string `json:"unit"`
	MinStock    int    `json:"min_stock"`
	MaxStock    int    `json:"max_stock"`
	IsActive    bool   `json:"is_active"`
}
