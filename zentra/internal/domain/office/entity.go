package office

import (
	"context"
	"zentra/internal/domain/common"
	"zentra/internal/domain/models"
)

// Office represents the master_office table
type Office struct {
	ID      int          `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	Name    string       `gorm:"type:varchar(100);not null" json:"name"`
	Code    string       `gorm:"type:varchar(50);unique" json:"code"`
	Address string       `gorm:"type:text" json:"address"`
	Phone   string       `gorm:"type:varchar(20)" json:"phone"`
	Email   string       `gorm:"type:varchar(255);unique" json:"email"`
	ZoneID  *int         `gorm:"column:zone_id;index" json:"zone_id"`
	Zone    *models.Zone `gorm:"foreignKey:ZoneID" json:"zone,omitempty"`
	common.TenantModel
}

func (Office) TableName() string {
	return "master_office"
}

type Repository interface {
	Create(office *Office, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Office, error)
	FindAll(ctx context.Context) ([]Office, error)
	Update(office *Office, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByZoneID(zoneID int, ctx context.Context) ([]Office, error)
	FindByCode(code string, ctx context.Context) (*Office, error)
	FindByEmail(email string, ctx context.Context) (*Office, error)
}
