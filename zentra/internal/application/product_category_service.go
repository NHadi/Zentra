package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/product"
)

// ProductCategoryService handles business logic for product categories
type ProductCategoryService struct {
	repo     product.CategoryRepository
	auditSvc *audit.Service
}

// NewProductCategoryService creates a new product category service
func NewProductCategoryService(repo product.CategoryRepository, auditSvc *audit.Service) *ProductCategoryService {
	return &ProductCategoryService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new product category
func (s *ProductCategoryService) Create(category *product.Category, ctx context.Context) error {
	if err := s.repo.Create(category, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("product_category", category.ID, audit.ActionCreate, nil, category, ctx)
}

// FindByID finds a product category by ID
func (s *ProductCategoryService) FindByID(id int, ctx context.Context) (*product.Category, error) {
	return s.repo.FindByID(id, ctx)
}

// FindByCode finds a product category by code
func (s *ProductCategoryService) FindByCode(code string, ctx context.Context) (*product.Category, error) {
	return s.repo.FindByCode(code, ctx)
}

// FindAll retrieves all product categories
func (s *ProductCategoryService) FindAll(ctx context.Context) ([]product.Category, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing product category
func (s *ProductCategoryService) Update(category *product.Category, ctx context.Context) error {
	// Get old data for audit
	oldCategory, err := s.repo.FindByID(category.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(category, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("product_category", category.ID, audit.ActionUpdate, oldCategory, category, ctx)
}

// Delete deletes a product category
func (s *ProductCategoryService) Delete(id int, ctx context.Context) error {
	// Get category data for audit
	category, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("product_category", id, audit.ActionDelete, category, nil, ctx)
}
