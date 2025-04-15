package region

import "context"

// Repository defines the interface for region data access
type Repository interface {
	Create(r *Region, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Region, error)
	FindAll(ctx context.Context) ([]Region, error)
	Update(r *Region, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
