package supplier

import (
	"context"
	"zentra/internal/domain/common"
)

// Supplier represents the master_supplier table
type Supplier struct {
	ID                int    `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	Code              string `gorm:"type:varchar(50);not null" json:"code"`
	Name              string `gorm:"type:varchar(100);not null" json:"name"`
	ContactPerson     string `gorm:"type:varchar(100)" json:"contact_person"`
	Phone             string `gorm:"type:varchar(20)" json:"phone"`
	Email             string `gorm:"type:varchar(255)" json:"email"`
	Address           string `gorm:"type:text" json:"address"`
	TaxNumber         string `gorm:"type:varchar(50)" json:"tax_number"`
	BankName          string `gorm:"type:varchar(100)" json:"bank_name"`
	BankAccountNumber string `gorm:"type:varchar(50)" json:"bank_account_number"`
	BankAccountName   string `gorm:"type:varchar(100)" json:"bank_account_name"`
	IsActive          bool   `gorm:"default:true" json:"is_active"`
	common.TenantModel
}

func (Supplier) TableName() string {
	return "master_supplier"
}

type Repository interface {
	Create(supplier *Supplier, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Supplier, error)
	FindAll(ctx context.Context) ([]Supplier, error)
	Update(supplier *Supplier, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByCode(code string, ctx context.Context) (*Supplier, error)
}
