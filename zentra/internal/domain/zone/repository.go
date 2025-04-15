package zone

import "context"

// Repository defines the interface for zone data access
type Repository interface {
	Create(z *Zone, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Zone, error)
	FindAll(ctx context.Context) ([]Zone, error)
	FindByRegionID(regionID int, ctx context.Context) ([]Zone, error)
	Update(z *Zone, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
