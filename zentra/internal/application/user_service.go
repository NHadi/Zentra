package application

import (
	"context"
	"errors"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/user"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repository user.Repository
	auditSvc   *audit.Service
}

func NewUserService(repo user.Repository, auditSvc *audit.Service) *UserService {
	return &UserService{
		repository: repo,
		auditSvc:   auditSvc,
	}
}

func (s *UserService) CreateUser(username, email, password string, roleID int, ctx context.Context) (*user.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	u := &user.User{
		ID:       uuid.New(),
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		RoleID:   roleID,
	}

	if err := s.repository.Create(u, ctx); err != nil {
		return nil, err
	}

	// Log the create action
	if err := s.auditSvc.LogChange("user", 0, audit.ActionCreate, nil, u, ctx); err != nil {
		return nil, err
	}

	return u, nil
}

func (s *UserService) GetUserByID(id uuid.UUID, ctx context.Context) (*user.User, error) {
	return s.repository.FindByID(id, ctx)
}

func (s *UserService) GetUserByEmail(email string, ctx context.Context) (*user.User, error) {
	return s.repository.FindByEmail(email, ctx)
}

func (s *UserService) ListUsers(page, pageSize int, ctx context.Context) ([]user.User, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	return s.repository.List(page, pageSize, ctx)
}

func (s *UserService) UpdateUser(id uuid.UUID, username, email string, ctx context.Context) (*user.User, error) {
	u, err := s.repository.FindByID(id, ctx)
	if err != nil {
		return nil, err
	}

	// Store old values for audit
	oldValues := *u

	u.Username = username
	u.Email = email

	if err := s.repository.Update(u, ctx); err != nil {
		return nil, err
	}

	// Log the update action
	if err := s.auditSvc.LogChange("user", 0, audit.ActionUpdate, oldValues, u, ctx); err != nil {
		return nil, err
	}

	return u, nil
}

func (s *UserService) DeleteUser(id uuid.UUID, ctx context.Context) error {
	// Get user data for audit
	u, err := s.repository.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repository.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("user", 0, audit.ActionDelete, u, nil, ctx)
}

func (s *UserService) UpdatePassword(id uuid.UUID, oldPassword, newPassword string, ctx context.Context) error {
	u, err := s.repository.FindByID(id, ctx)
	if err != nil {
		return err
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(oldPassword)); err != nil {
		return errors.New("invalid old password")
	}

	// Store old values for audit
	oldValues := *u

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	u.Password = string(hashedPassword)
	if err := s.repository.Update(u, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("user", 0, audit.ActionUpdate, oldValues, u, ctx)
}

func (s *UserService) ValidateCredentials(username, password string, ctx context.Context) (*user.User, error) {
	user, err := s.repository.FindByEmail(username, ctx)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

// GetUserPermissions retrieves all permission codes for a user
func (s *UserService) GetUserPermissions(userID uuid.UUID, ctx context.Context) ([]string, error) {
	return s.repository.GetUserPermissions(userID, ctx)
}

// Create creates a new user with hashed password
func (s *UserService) Create(user *user.User, ctx context.Context) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	if err := s.repository.Create(user, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("user", 0, audit.ActionCreate, nil, user, ctx)
}

// FindByID finds a user by ID
func (s *UserService) FindByID(id uuid.UUID, ctx context.Context) (*user.User, error) {
	return s.repository.FindByID(id, ctx)
}

// FindByEmail finds a user by email
func (s *UserService) FindByEmail(email string, ctx context.Context) (*user.User, error) {
	return s.repository.FindByEmail(email, ctx)
}

// FindByUsername finds a user by username
func (s *UserService) FindByUsername(username string, ctx context.Context) (*user.User, error) {
	return s.repository.FindByUsername(username, ctx)
}

// FindAll retrieves all users
func (s *UserService) FindAll(ctx context.Context) ([]user.User, error) {
	return s.repository.FindAll(ctx)
}

// Update updates an existing user
func (s *UserService) Update(user *user.User, ctx context.Context) error {
	// Get old data for audit
	oldUser, err := s.repository.FindByID(user.ID, ctx)
	if err != nil {
		return err
	}

	if user.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		user.Password = string(hashedPassword)
	}

	if err := s.repository.Update(user, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("user", 0, audit.ActionUpdate, oldUser, user, ctx)
}

// Delete deletes a user
func (s *UserService) Delete(id uuid.UUID, ctx context.Context) error {
	// Get user data for audit
	user, err := s.repository.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repository.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("user", 0, audit.ActionDelete, user, nil, ctx)
}

// AssignRole assigns a role to a user
func (s *UserService) AssignRole(userID uuid.UUID, roleID int, ctx context.Context) error {
	return s.repository.AssignRole(userID, roleID, ctx)
}

// RemoveRole removes a role from a user
func (s *UserService) RemoveRole(userID uuid.UUID, roleID int, ctx context.Context) error {
	return s.repository.RemoveRole(userID, roleID, ctx)
}
