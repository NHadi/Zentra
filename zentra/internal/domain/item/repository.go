package item

import "context"

// Repository defines the interface for item data access
type Repository interface {
	Create(item *Item, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Item, error)
	FindAll(ctx context.Context) ([]Item, error)
	Update(item *Item, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByCode(code string, ctx context.Context) (*Item, error)
}
