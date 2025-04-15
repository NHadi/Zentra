package menu

import "context"

type Repository interface {
	FindAll(ctx context.Context) ([]Menu, error)
	FindByID(id int, ctx context.Context) (*Menu, error)
	FindByRoleID(roleID int, ctx context.Context) ([]Menu, error)
	FindByUserID(userID string, ctx context.Context) ([]Menu, error)
	Create(menu *Menu, ctx context.Context) error
	Update(menu *Menu, ctx context.Context) error
	Delete(id int, ctx context.Context) error
}
