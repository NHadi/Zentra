package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/product"
)

// ProductService handles business logic for products
type ProductService struct {
	repo     product.ProductRepository
	auditSvc *audit.Service
}

// NewProductService creates a new product service
func NewProductService(repo product.ProductRepository, auditSvc *audit.Service) *ProductService {
	return &ProductService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new product
func (s *ProductService) Create(p *product.Product, ctx context.Context) error {
	if err := s.repo.Create(p, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("product", p.ID, audit.ActionCreate, nil, p, ctx)
}

// FindByID finds a product by ID
func (s *ProductService) FindByID(id int, ctx context.Context) (*product.Product, error) {
	return s.repo.FindByID(id, ctx)
}

// FindByCode finds a product by code
func (s *ProductService) FindByCode(code string, ctx context.Context) (*product.Product, error) {
	return s.repo.FindByCode(code, ctx)
}

// FindAll retrieves all products
func (s *ProductService) FindAll(ctx context.Context) ([]product.Product, error) {
	return s.repo.FindAll(ctx)
}

// FindByCategoryID retrieves all products in a category
func (s *ProductService) FindByCategoryID(categoryID int, ctx context.Context) ([]product.Product, error) {
	return s.repo.FindByCategoryID(categoryID, ctx)
}

// Update updates an existing product
func (s *ProductService) Update(p *product.Product, ctx context.Context) error {
	// Get old data for audit
	oldProduct, err := s.repo.FindByID(p.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(p, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("product", p.ID, audit.ActionUpdate, oldProduct, p, ctx)
}

// Delete deletes a product
func (s *ProductService) Delete(id int, ctx context.Context) error {
	// Get product data for audit
	product, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("product", id, audit.ActionDelete, product, nil, ctx)
}
