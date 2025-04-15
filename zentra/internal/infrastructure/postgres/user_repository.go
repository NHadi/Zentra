package postgres

import (
	"context"
	"errors"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/user"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *user.User, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	user.TenantID = userCtx.TenantID
	user.CreatedBy = userCtx.Username
	user.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *UserRepository) FindByID(id uuid.UUID, ctx context.Context) (*user.User, error) {
	var u user.User
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindByEmail(email string, ctx context.Context) (*user.User, error) {
	var u user.User

	// During login, just find by email without tenant context
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) Update(user *user.User, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	user.TenantID = userCtx.TenantID
	user.UpdatedBy = userCtx.Username
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", user.ID, userCtx.TenantID).Save(user)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *UserRepository) Delete(id uuid.UUID, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).Delete(&user.User{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *UserRepository) List(page, pageSize int, ctx context.Context) ([]user.User, error) {
	var users []user.User
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	offset := (page - 1) * pageSize

	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&users)

	if result.Error != nil {
		return nil, result.Error
	}

	return users, nil
}

func (r *UserRepository) FindByRole(roleID int, ctx context.Context) ([]user.User, error) {
	var users []user.User
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("role_id = ? AND tenant_id = ?", roleID, userCtx.TenantID).Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Model(&user.User{}).Where("tenant_id = ?", userCtx.TenantID).Count(&count).Error
	return count, err
}

// GetUserPermissions retrieves all permissions for a given user through their role
func (r *UserRepository) GetUserPermissions(userID uuid.UUID, ctx context.Context) ([]string, error) {
	var permissionCodes []string
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Table("master_permission").
		Select("DISTINCT master_permission.code").
		Joins("JOIN role_permissions ON master_permission.id = role_permissions.permission_id").
		Joins("JOIN users ON role_permissions.role_id = users.role_id").
		Where("users.id = ? AND users.tenant_id = ?", userID, userCtx.TenantID).
		Pluck("code", &permissionCodes).Error
	return permissionCodes, err
}

// FindAll retrieves all users
func (r *UserRepository) FindAll(ctx context.Context) ([]user.User, error) {
	var users []user.User
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	err := r.db.WithContext(ctx).Where("tenant_id = ?", userCtx.TenantID).Find(&users).Error
	return users, err
}

func (r *UserRepository) FindByUsername(username string, ctx context.Context) (*user.User, error) {
	var u user.User
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	if err := r.db.WithContext(ctx).Where("username = ? AND tenant_id = ?", username, userCtx.TenantID).First(&u).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) AssignRole(userID uuid.UUID, roleID int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Model(&user.User{}).
		Where("id = ? AND tenant_id = ?", userID, userCtx.TenantID).
		Update("role_id", roleID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}

func (r *UserRepository) RemoveRole(userID uuid.UUID, roleID int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Model(&user.User{}).
		Where("id = ? AND tenant_id = ?", userID, userCtx.TenantID).
		Update("role_id", nil)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("user not found")
	}
	return nil
}
