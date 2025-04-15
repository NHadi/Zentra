package application

import (
	"context"
	"fmt"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/region"
	"zentra/internal/domain/zone"
)

// RegionService handles business logic for region operations
type RegionService struct {
	repo     region.Repository
	zoneRepo zone.Repository
	auditSvc *audit.Service
}

// NewRegionService creates a new region service instance
func NewRegionService(repo region.Repository, zoneRepo zone.Repository, auditSvc *audit.Service) *RegionService {
	return &RegionService{
		repo:     repo,
		zoneRepo: zoneRepo,
		auditSvc: auditSvc,
	}
}

// Create creates a new region
func (s *RegionService) Create(r *region.Region, ctx context.Context) error {
	if err := s.repo.Create(r, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("region", r.ID, audit.ActionCreate, nil, r, ctx)
}

// FindByID retrieves a region by its ID
func (s *RegionService) FindByID(id int, ctx context.Context) (*region.Region, error) {
	return s.repo.FindByID(id, ctx)
}

// FindAll retrieves all regions
func (s *RegionService) FindAll(ctx context.Context) ([]region.Region, error) {
	return s.repo.FindAll(ctx)
}

// Update updates an existing region
func (s *RegionService) Update(r *region.Region, ctx context.Context) error {
	// Get old data for audit
	oldRegion, err := s.repo.FindByID(r.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(r, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("region", r.ID, audit.ActionUpdate, oldRegion, r, ctx)
}

// Delete deletes a region by its ID
func (s *RegionService) Delete(id int, ctx context.Context) error {
	// Get region data for audit
	region, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	// Check if there are any zones associated with this region
	zones, err := s.zoneRepo.FindByRegionID(id, ctx)
	if err != nil {
		return err
	}

	if len(zones) > 0 {
		return fmt.Errorf("cannot delete region: there are %d zones associated with this region", len(zones))
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("region", id, audit.ActionDelete, region, nil, ctx)
}

// GetZonesByRegionID retrieves all zones for a given region ID
func (s *RegionService) GetZonesByRegionID(regionID int, ctx context.Context) ([]zone.Zone, error) {
	return s.zoneRepo.FindByRegionID(regionID, ctx)
}

// AssignZones assigns zones to a region
func (s *RegionService) AssignZones(regionID int, zoneIDs []int, ctx context.Context) (*region.Region, error) {
	// Get the region
	r, err := s.repo.FindByID(regionID, ctx)
	if err != nil {
		return nil, err
	}

	// Get old data for audit
	oldRegion := *r

	// Update each zone's region_id
	for _, id := range zoneIDs {
		z, err := s.zoneRepo.FindByID(id, ctx)
		if err != nil {
			return nil, err
		}
		z.RegionID = &regionID
		if err := s.zoneRepo.Update(z, ctx); err != nil {
			return nil, err
		}
	}

	// Refresh the region to get updated zones
	r, err = s.repo.FindByID(regionID, ctx)
	if err != nil {
		return nil, err
	}

	// Log the zone assignment action
	if err := s.auditSvc.LogChange("region", regionID, audit.ActionUpdate, &oldRegion, r, ctx); err != nil {
		// Log error but don't fail the operation
		// TODO: Consider adding proper error handling for audit failures
	}

	return r, nil
}
