package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/permission"
)

// PermissionService handles business logic for permission operations
type PermissionService struct {
	repo     permission.Repository
	auditSvc *audit.Service
}

// NewPermissionService creates a new permission service instance
func NewPermissionService(repo permission.Repository, auditSvc *audit.Service) *PermissionService {
	return &PermissionService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new permission
func (s *PermissionService) Create(p *permission.Permission, ctx context.Context) error {
	if err := s.repo.Create(p, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("permission", p.ID, audit.ActionCreate, nil, p, ctx)
}

// FindByID retrieves a permission by its ID
func (s *PermissionService) FindByID(id int, ctx context.Context) (*permission.Permission, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all permissions
func (s *PermissionService) FindAll(ctx context.Context) ([]permission.Permission, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing permission
func (s *PermissionService) Update(p *permission.Permission, ctx context.Context) error {
	// Get old data for audit
	oldPermission, err := s.repo.FindByID(p.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(p, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("permission", p.ID, audit.ActionUpdate, oldPermission, p, ctx)
}

// Delete deletes a permission by its ID
func (s *PermissionService) Delete(id int, ctx context.Context) error {
	// Get permission data for audit
	permission, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("permission", id, audit.ActionDelete, permission, nil, ctx)
}

// FindByName retrieves a permission by its name
func (s *PermissionService) FindByName(name string) (*permission.Permission, error) {
	return s.repo.FindByName(name)
}
