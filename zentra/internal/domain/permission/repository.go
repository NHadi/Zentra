package permission

import "context"

type Repository interface {
	Create(permission *Permission, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*Permission, error)
	FindByName(name string) (*Permission, error)
	FindAll(ctx context.Context) ([]Permission, error)
	Update(permission *Permission, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
