package application

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/channel"
	"zentra/internal/domain/division"
	"zentra/internal/domain/office"
)

// PettyCashService handles business logic for petty cash operations
type PettyCashService struct {
	repo         accounting.PettyCashRepository
	auditSvc     *audit.Service
	officeRepo   office.Repository
	divisionRepo division.Repository
	channelRepo  channel.Repository
}

// NewPettyCashService creates a new petty cash service instance
func NewPettyCashService(repo accounting.PettyCashRepository, auditSvc *audit.Service, officeRepo office.Repository, divisionRepo division.Repository, channelRepo channel.Repository) *PettyCashService {
	return &PettyCashService{
		repo:         repo,
		auditSvc:     auditSvc,
		officeRepo:   officeRepo,
		divisionRepo: divisionRepo,
		channelRepo:  channelRepo,
	}
}

// Create creates a new petty cash record
func (s *PettyCashService) Create(pettyCash *accounting.PettyCash, ctx context.Context) error {
	if err := s.repo.Create(pettyCash, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("petty_cash", pettyCash.ID, audit.ActionCreate, nil, pettyCash, ctx)
}

// FindByID retrieves a petty cash record by its ID
func (s *PettyCashService) FindByID(id int, ctx context.Context) (*accounting.PettyCash, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all petty cash records
func (s *PettyCashService) FindAll(ctx context.Context) ([]accounting.PettyCash, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing petty cash record
func (s *PettyCashService) Update(pettyCash *accounting.PettyCash, ctx context.Context) error {
	// Get old data for audit
	oldPettyCash, err := s.repo.FindByID(pettyCash.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(pettyCash, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("petty_cash", pettyCash.ID, audit.ActionUpdate, oldPettyCash, pettyCash, ctx)
}

// Delete deletes a petty cash record by its ID
func (s *PettyCashService) Delete(id int, ctx context.Context) error {
	// Get petty cash data for audit
	pettyCash, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("petty_cash", id, audit.ActionDelete, pettyCash, nil, ctx)
}

// FindByOffice retrieves petty cash records by office ID
func (s *PettyCashService) FindByOffice(officeID int, ctx context.Context) (*accounting.PettyCash, error) {
	return s.repo.FindByOffice(officeID, ctx)
}

func (s *PettyCashService) GetSummary(ctx context.Context) (*accounting.PettyCashSummary, error) {
	return s.repo.GetPettyCashSummary(ctx)
}
