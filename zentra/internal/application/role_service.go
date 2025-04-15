package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/menu"
	"zentra/internal/domain/permission"
	"zentra/internal/domain/role"
)

// RoleService handles business logic for role operations
type RoleService struct {
	repo           role.Repository
	permissionRepo permission.Repository
	auditSvc       *audit.Service
}

// NewRoleService creates a new role service instance
func NewRoleService(repo role.Repository, permissionRepo permission.Repository, auditSvc *audit.Service) *RoleService {
	return &RoleService{
		repo:           repo,
		permissionRepo: permissionRepo,
		auditSvc:       auditSvc,
	}
}

// Create creates a new role
func (s *RoleService) Create(r *role.Role, ctx context.Context) error {
	if err := s.repo.Create(r, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("role", r.ID, audit.ActionCreate, nil, r, ctx)
}

// FindByID retrieves a role by its ID
func (s *RoleService) FindByID(id int, ctx context.Context) (*role.Role, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all roles
func (s *RoleService) FindAll(ctx context.Context) ([]role.Role, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing role
func (s *RoleService) Update(r *role.Role, ctx context.Context) error {
	// Get old data for audit
	oldRole, err := s.repo.FindByID(r.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(r, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("role", r.ID, audit.ActionUpdate, oldRole, r, ctx)
}

// Delete deletes a role by its ID
func (s *RoleService) Delete(id int, ctx context.Context) error {
	// Get role data for audit
	role, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("role", id, audit.ActionDelete, role, nil, ctx)
}

// FindByName retrieves a role by its name
func (s *RoleService) FindByName(name string, ctx context.Context) (*role.Role, error) {
	return s.repo.FindByName(name, ctx)
}

// AssignMenus assigns menus to a role
func (s *RoleService) AssignMenus(roleID int, menuIDs []int, ctx context.Context) error {
	return s.repo.AssignMenus(roleID, menuIDs, ctx)
}

// RemoveMenus removes menus from a role
func (s *RoleService) RemoveMenus(roleID int, menuIDs []int, ctx context.Context) error {
	return s.repo.RemoveMenus(roleID, menuIDs, ctx)
}

// GetRoleMenus retrieves all menus for a role
func (s *RoleService) GetRoleMenus(roleID int, ctx context.Context) ([]menu.Menu, error) {
	return s.repo.GetRoleMenus(roleID, ctx)
}

// AssignPermissions assigns permissions to a role
func (s *RoleService) AssignPermissions(roleID int, permissionIDs []int, ctx context.Context) error {
	return s.repo.AssignPermissions(roleID, permissionIDs, ctx)
}

// RemovePermissions removes permissions from a role
func (s *RoleService) RemovePermissions(roleID int, permissionIDs []int, ctx context.Context) error {
	return s.repo.RemovePermissions(roleID, permissionIDs, ctx)
}

// GetRolePermissions retrieves all permissions for a role
func (s *RoleService) GetRolePermissions(roleID int, ctx context.Context) ([]permission.Permission, error) {
	return s.repo.GetRolePermissions(roleID, ctx)
}

func (s *RoleService) GetPermissions(roleID int, ctx context.Context) ([]permission.Permission, error) {
	return s.permissionRepo.FindAll(ctx)
}
