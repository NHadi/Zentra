package product

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"zentra/internal/domain/common"
)

// StringArray is a custom type for handling string arrays in GORM
type StringArray []string

// Value implements the driver.Valuer interface
func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

// Scan implements the sql.Scanner interface
func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal StringArray value")
	}
	return json.Unmarshal(bytes, &a)
}

// BoolMap is a custom type for handling map[string]bool in GORM
type BoolMap map[string]bool

// Value implements the driver.Valuer interface
func (m BoolMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements the sql.Scanner interface
func (m *BoolMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal BoolMap value")
	}
	return json.Unmarshal(bytes, &m)
}

// IntMap is a custom type for handling map[string]int in GORM
type IntMap map[string]int

// Value implements the driver.Valuer interface
func (m IntMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

// Scan implements the sql.Scanner interface
func (m *IntMap) Scan(value interface{}) error {
	if value == nil {
		*m = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal IntMap value")
	}
	return json.Unmarshal(bytes, &m)
}

func (Product) TableName() string {
	return "master_product"
}

// Product represents a product
type Product struct {
	ID                   int            `json:"id" gorm:"primaryKey;table:master_product"`
	Name                 string         `json:"name"`
	Code                 string         `json:"code"`
	CategoryID           int            `json:"category_id"`
	Description          string         `json:"description"`
	Material             string         `json:"material"`
	SizeAvailable        StringArray    `json:"size_available" gorm:"type:jsonb"`
	ColorOptions         StringArray    `json:"color_options" gorm:"type:jsonb"`
	CustomizationOptions BoolMap        `json:"customization_options" gorm:"type:jsonb"`
	ProductionTime       int            `json:"production_time"`
	MinOrderQuantity     int            `json:"min_order_quantity"`
	BasePrice            float64        `json:"base_price"`
	BulkDiscountRules    IntMap         `json:"bulk_discount_rules" gorm:"type:jsonb"`
	Weight               float64        `json:"weight"`
	IsActive             bool           `json:"is_active"`
	StockStatus          string         `json:"stock_status"`
	Images               []ProductImage `json:"images" gorm:"foreignKey:ProductID"`
	common.TenantModel
}

// ProductRepository defines the interface for product data access
type ProductRepository interface {
	Create(product *Product, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Product, error)
	FindByCode(code string, ctx context.Context) (*Product, error)
	FindAll(ctx context.Context) ([]Product, error)
	FindByCategoryID(categoryID int, ctx context.Context) ([]Product, error)
	Update(product *Product, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
