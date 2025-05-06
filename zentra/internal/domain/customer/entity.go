package customer

import (
	"context"
	"zentra/internal/domain/common"
)

// Customer represents the master_customer table
type Customer struct {
	ID             int    `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	CustomerNumber string `gorm:"type:varchar(50);not null" json:"customer_number"`
	Name           string `gorm:"type:varchar(100);not null" json:"name"`
	Email          string `gorm:"type:varchar(255)" json:"email"`
	Phone          string `gorm:"type:varchar(20)" json:"phone"`
	Address        string `gorm:"type:text" json:"address"`
	City           string `gorm:"type:varchar(100)" json:"city"`
	PostalCode     string `gorm:"type:varchar(20)" json:"postal_code"`
	Status         string `gorm:"type:varchar(20);not null;default:'active'" json:"status"`
	Notes          string `gorm:"type:text" json:"notes"`
	common.TenantModel
}

func (Customer) TableName() string {
	return "master_customer"
}

type Repository interface {
	Create(customer *Customer, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Customer, error)
	FindAll(page, perPage int, ctx context.Context) ([]Customer, int64, error)
	Update(customer *Customer, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByEmail(email string, ctx context.Context) (*Customer, error)
	FindByPhone(phone string, ctx context.Context) (*Customer, error)
	FindByCustomerNumber(customerNumber string, ctx context.Context) (*Customer, error)
	Search(query string, page, perPage int, ctx context.Context) ([]Customer, int64, error)
}
