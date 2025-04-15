package tenant

import "time"

type Tenant struct {
	ID        int       `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(100);not null" json:"name"`
	Domain    string    `gorm:"type:varchar(255);unique;not null" json:"domain"`
	Status    bool      `gorm:"default:true" json:"status"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (Tenant) TableName() string {
	return "master_tenant"
}