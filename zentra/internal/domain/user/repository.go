package user

import (
	"context"

	"github.com/google/uuid"
)

// Repository defines the interface for user data access
type Repository interface {
	Create(user *User, ctx context.Context) error
	FindByID(id uuid.UUID, ctx context.Context) (*User, error)
	FindByEmail(email string, ctx context.Context) (*User, error)
	FindByUsername(username string, ctx context.Context) (*User, error)
	FindAll(ctx context.Context) ([]User, error)
	Update(user *User, ctx context.Context) error
	Delete(id uuid.UUID, ctx context.Context) error
	List(page, pageSize int, ctx context.Context) ([]User, error)
	Count(ctx context.Context) (int64, error)
	GetUserPermissions(userID uuid.UUID, ctx context.Context) ([]string, error)
	AssignRole(userID uuid.UUID, roleID int, ctx context.Context) error
	RemoveRole(userID uuid.UUID, roleID int, ctx context.Context) error
}
