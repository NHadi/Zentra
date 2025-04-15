package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/stockopname"
)

// StockOpnameService handles business logic for stock opname operations
type StockOpnameService struct {
	repo     stockopname.Repository
	auditSvc *audit.Service
}

// NewStockOpnameService creates a new stock opname service instance
func NewStockOpnameService(repo stockopname.Repository, auditSvc *audit.Service) *StockOpnameService {
	return &StockOpnameService{
		repo:     repo,
		auditSvc: auditSvc,
	}
}

// Create creates a new stock opname
func (s *StockOpnameService) Create(opname *stockopname.StockOpname, ctx context.Context) error {
	if err := s.repo.Create(opname, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("stock_opname", opname.ID, audit.ActionCreate, nil, opname, ctx)
}

// FindByID retrieves a stock opname by its ID
func (s *StockOpnameService) FindByID(id int, ctx context.Context) (*stockopname.StockOpname, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all stock opnames
func (s *StockOpnameService) FindAll(ctx context.Context) ([]stockopname.StockOpname, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing stock opname
func (s *StockOpnameService) Update(opname *stockopname.StockOpname, ctx context.Context) error {
	// Get old data for audit
	oldOpname, err := s.repo.FindByID(opname.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(opname, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("stock_opname", opname.ID, audit.ActionUpdate, oldOpname, opname, ctx)
}

// Delete deletes a stock opname by its ID
func (s *StockOpnameService) Delete(id int, ctx context.Context) error {
	// Get opname data for audit
	opname, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("stock_opname", id, audit.ActionDelete, opname, nil, ctx)
}

// FindByNumber retrieves a stock opname by its number
func (s *StockOpnameService) FindByNumber(number string, ctx context.Context) (*stockopname.StockOpname, error) {
	return s.repo.FindByNumber(number, ctx)
}

// AddDetail adds a new detail to a stock opname
func (s *StockOpnameService) AddDetail(detail *stockopname.StockOpnameDetail, ctx context.Context) error {
	if err := s.repo.AddDetail(detail, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("stock_opname_detail", detail.ID, audit.ActionCreate, nil, detail, ctx)
}

// UpdateDetail updates an existing stock opname detail
func (s *StockOpnameService) UpdateDetail(detail *stockopname.StockOpnameDetail, ctx context.Context) error {
	// Get old data for audit
	oldDetails, err := s.repo.FindDetailsByOpnameID(detail.StockOpnameID, ctx)
	if err != nil {
		return err
	}

	var oldDetail *stockopname.StockOpnameDetail
	for _, d := range oldDetails {
		if d.ID == detail.ID {
			oldDetail = &d
			break
		}
	}

	if err := s.repo.UpdateDetail(detail, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("stock_opname_detail", detail.ID, audit.ActionUpdate, oldDetail, detail, ctx)
}

// DeleteDetail deletes a stock opname detail
func (s *StockOpnameService) DeleteDetail(id int, ctx context.Context) error {
	// Get detail data for audit
	details, err := s.repo.FindDetailsByOpnameID(id, ctx)
	if err != nil {
		return err
	}

	var detail *stockopname.StockOpnameDetail
	for _, d := range details {
		if d.ID == id {
			detail = &d
			break
		}
	}

	if err := s.repo.DeleteDetail(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("stock_opname_detail", id, audit.ActionDelete, detail, nil, ctx)
}

// FindDetailsByOpnameID retrieves all details for a stock opname
func (s *StockOpnameService) FindDetailsByOpnameID(opnameID int, ctx context.Context) ([]stockopname.StockOpnameDetail, error) {
	return s.repo.FindDetailsByOpnameID(opnameID, ctx)
}
