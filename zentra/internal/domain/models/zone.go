package models

// Zone represents the base zone model without relationships
type Zone struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	RegionID    *int   `json:"region_id"`
	Description string `json:"description"`
}

// TableName specifies the table name for GORM
func (Zone) TableName() string {
	return "master_zone"
}
