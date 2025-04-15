package employee

import (
	"context"
	"zentra/internal/domain/common"
)

// Employee represents the master_employee table
type Employee struct {
	ID         int    `gorm:"primaryKey;autoIncrement:true;column:id" json:"id"`
	Name       string `gorm:"type:varchar(100);not null" json:"name"`
	Email      string `gorm:"type:varchar(255)" json:"email"`
	Phone      string `gorm:"type:varchar(20)" json:"phone"`
	DivisionID int    `gorm:"index" json:"division_id"`
	common.TenantModel
}

func (Employee) TableName() string {
	return "master_employee"
}

type Repository interface {
	Create(employee *Employee, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Employee, error)
	FindAll(ctx context.Context) ([]Employee, error)
	Update(employee *Employee, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByDivisionID(divisionID int, ctx context.Context) ([]Employee, error)
	FindByEmail(email string, ctx context.Context) (*Employee, error)
}
