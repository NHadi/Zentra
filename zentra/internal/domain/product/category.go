package product

import (
	"context"
	"zentra/internal/domain/common"
)

// Category represents a product category
type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
	common.TenantModel
}

func (Category) TableName() string {
	return "master_product_category"
}

// CategoryRepository defines the interface for category data access
type CategoryRepository interface {
	Create(category *Category, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Category, error)
	FindByCode(code string, ctx context.Context) (*Category, error)
	FindAll(ctx context.Context) ([]Category, error)
	Update(category *Category, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
