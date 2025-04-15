package channel

import (
	"context"
	"zentra/internal/domain/common"
)

// Channel represents the master_channel table
type Channel struct {
	ID          int    `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	Name        string `gorm:"type:varchar(100);not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Code        string `gorm:"type:varchar(50);unique" json:"code"`
	common.TenantModel
}

func (Channel) TableName() string {
	return "master_channel"
}

type Repository interface {
	Create(channel *Channel, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Channel, error)
	FindAll(ctx context.Context) ([]Channel, error)
	Update(channel *Channel, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByCode(code string, ctx context.Context) (*Channel, error)
}
