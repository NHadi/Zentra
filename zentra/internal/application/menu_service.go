package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/menu"
)

// MenuService handles business logic for menu operations
type MenuService struct {
	repo     menu.Repository
	auditSvc *audit.Service
}

// NewMenuService creates a new menu service instance
func NewMenuService(repo menu.Repository, auditSvc *audit.Service) *MenuService {
	return &MenuService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new menu
func (s *MenuService) Create(m *menu.Menu, ctx context.Context) error {
	if err := s.repo.Create(m, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("menu", m.ID, audit.ActionCreate, nil, m, ctx)
}

// FindByID retrieves a menu by its ID
func (s *MenuService) FindByID(id int, ctx context.Context) (*menu.Menu, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all menus
func (s *MenuService) FindAll(ctx context.Context) ([]menu.Menu, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing menu
func (s *MenuService) Update(m *menu.Menu, ctx context.Context) error {
	// Get old data for audit
	oldMenu, err := s.repo.FindByID(m.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(m, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("menu", m.ID, audit.ActionUpdate, oldMenu, m, ctx)
}

// Delete deletes a menu by its ID
func (s *MenuService) Delete(id int, ctx context.Context) error {
	// Get menu data for audit
	menu, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("menu", id, audit.ActionDelete, menu, nil, ctx)
}

// FindByRoleID retrieves all menus for a given role ID
func (s *MenuService) FindByRoleID(roleID int, ctx context.Context) ([]menu.Menu, error) {
	return s.repo.FindByRoleID(roleID, ctx)
}

// FindByUserID retrieves all menus for a given user ID
func (s *MenuService) FindByUserID(userID string, ctx context.Context) ([]menu.Menu, error) {
	return s.repo.FindByUserID(userID, ctx)
}

func (s *MenuService) GetAllMenus(ctx context.Context) ([]menu.Menu, error) {
	menus, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	return s.buildMenuTree(menus), nil
}

func (s *MenuService) GetMenuByID(id int, ctx context.Context) (*menu.Menu, error) {
	return s.repo.FindByID(id, ctx)
}

func (s *MenuService) GetMenusByRoleID(roleID int, ctx context.Context) ([]menu.Menu, error) {
	menus, err := s.repo.FindByRoleID(roleID, ctx)
	if err != nil {
		return nil, err
	}
	return s.buildMenuTree(menus), nil
}

func (s *MenuService) GetMenusByUserID(userID string, ctx context.Context) ([]menu.Menu, error) {
	menus, err := s.repo.FindByUserID(userID, ctx)
	if err != nil {
		return nil, err
	}
	return s.buildMenuTree(menus), nil
}

func (s *MenuService) CreateMenu(name, url, icon string, parentID *int, ctx context.Context) (*menu.Menu, error) {
	m := &menu.Menu{
		Name:     name,
		URL:      url,
		Icon:     icon,
		ParentID: parentID,
	}

	if err := s.repo.Create(m, ctx); err != nil {
		return nil, err
	}

	// Log the create action
	if err := s.auditSvc.LogChange("menu", m.ID, audit.ActionCreate, nil, m, ctx); err != nil {
		return nil, err
	}

	return m, nil
}

func (s *MenuService) UpdateMenu(id int, name, url, icon string, parentID *int, ctx context.Context) (*menu.Menu, error) {
	oldMenu, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return nil, err
	}

	// Store old values for audit
	oldValues := *oldMenu

	// Update menu
	oldMenu.Name = name
	oldMenu.URL = url
	oldMenu.Icon = icon
	oldMenu.ParentID = parentID

	if err := s.repo.Update(oldMenu, ctx); err != nil {
		return nil, err
	}

	// Log the update action
	if err := s.auditSvc.LogChange("menu", oldMenu.ID, audit.ActionUpdate, oldValues, oldMenu, ctx); err != nil {
		return nil, err
	}

	return oldMenu, nil
}

// Update buildMenuTree to preserve tenant ID and sorting
func (s *MenuService) buildMenuTree(menus []menu.Menu) []menu.Menu {
	menuMap := make(map[int]*menu.Menu)
	var rootMenus []*menu.Menu

	// First pass: create all menu items in a map
	for i := range menus {
		menuCopy := menus[i]
		menuCopy.Children = make([]*menu.Menu, 0)
		menuMap[menuCopy.ID] = &menuCopy
	}

	// Second pass: build the tree
	for _, m := range menus {
		if m.ParentID != nil {
			if parent, exists := menuMap[*m.ParentID]; exists {
				child := menuMap[m.ID]
				parent.Children = append(parent.Children, child)
			}
		} else {
			rootMenus = append(rootMenus, menuMap[m.ID])
		}
	}

	// Convert back to []menu.Menu
	result := make([]menu.Menu, len(rootMenus))
	for i, menuPtr := range rootMenus {
		result[i] = *menuPtr
	}

	return result
}

func (s *MenuService) GetByID(id int, ctx context.Context) (*menu.Menu, error) {
	return s.repo.FindByID(id, ctx)
}

func (s *MenuService) GetAll(ctx context.Context) ([]menu.Menu, error) {
	menus, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}
	return s.buildMenuTree(menus), nil
}
