package application

import (
	"context"
	"zentra/internal/domain/audit"
	"zentra/internal/domain/office"
	"zentra/internal/domain/region"
	"zentra/internal/domain/zone"

	"github.com/gin-gonic/gin"
)

// ZoneService handles business logic for zone operations
type ZoneService struct {
	repo       zone.Repository
	regionRepo region.Repository
	officeRepo office.Repository
	auditSvc   *audit.Service
}

// NewZoneService creates a new zone service instance
func NewZoneService(repo zone.Repository, regionRepo region.Repository, officeRepo office.Repository, auditSvc *audit.Service) *ZoneService {
	return &ZoneService{
		repo:       repo,
		regionRepo: regionRepo,
		officeRepo: officeRepo,
		auditSvc:   auditSvc,
	}
}

// Create creates a new zone
func (s *ZoneService) Create(z *zone.Zone, ctx context.Context) error {
	if err := s.repo.Create(z, ctx); err != nil {
		return err
	}

	// Log the create action
	return s.auditSvc.LogChange("zone", z.ID, audit.ActionCreate, nil, z, ctx)
}

// FindByID retrieves a zone by its ID
func (s *ZoneService) FindByID(id int, ctx context.Context) (*zone.Zone, *region.Region, error) {
	z, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return nil, nil, err
	}

	var r *region.Region
	if z.RegionID != nil {
		r, err = s.regionRepo.FindByID(*z.RegionID, ctx)
		if err != nil {
			// Log error but don't fail the request
			// Just return zone without region info
			return z, nil, nil
		}
	}

	return z, r, nil
}

// FindAll retrieves all zones
func (s *ZoneService) FindAll(ctx context.Context) ([]zone.Zone, []*region.Region, error) {
	zones, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, nil, err
	}

	// Get all unique region IDs
	regionIDs := make(map[int]struct{})
	for _, z := range zones {
		if z.RegionID != nil {
			regionIDs[*z.RegionID] = struct{}{}
		}
	}

	// Fetch all regions in one go
	regions := make(map[int]*region.Region)
	for regionID := range regionIDs {
		r, err := s.regionRepo.FindByID(regionID, ctx)
		if err != nil {
			// Log error but continue
			continue
		}
		regions[regionID] = r
	}

	// Create slice of regions in same order as zones
	zoneRegions := make([]*region.Region, len(zones))
	for i, z := range zones {
		if z.RegionID != nil {
			zoneRegions[i] = regions[*z.RegionID]
		}
	}

	return zones, zoneRegions, nil
}

// Update updates an existing zone
func (s *ZoneService) Update(z *zone.Zone, ctx context.Context) error {
	// Get old data for audit
	oldZone, err := s.repo.FindByID(z.ID, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Update(z, ctx); err != nil {
		return err
	}

	// Log the update action
	return s.auditSvc.LogChange("zone", z.ID, audit.ActionUpdate, oldZone, z, ctx)
}

// Delete deletes a zone by its ID
func (s *ZoneService) Delete(id int, ctx context.Context) error {
	// Get zone data for audit
	zone, err := s.repo.FindByID(id, ctx)
	if err != nil {
		return err
	}

	if err := s.repo.Delete(id, ctx); err != nil {
		return err
	}

	// Log the delete action
	return s.auditSvc.LogChange("zone", id, audit.ActionDelete, zone, nil, ctx)
}

// FindByRegionID retrieves all zones for a specific region
func (s *ZoneService) FindByRegionID(regionID int, ctx context.Context) ([]zone.Zone, []*region.Region, error) {
	zones, err := s.repo.FindByRegionID(regionID, ctx)
	if err != nil {
		return nil, nil, err
	}

	// Get region details
	r, err := s.regionRepo.FindByID(regionID, ctx)
	if err != nil {
		// Log error but don't fail the request
		// Just return zones without region info
		return zones, make([]*region.Region, len(zones)), nil
	}

	// Create slice of regions in same order as zones
	regions := make([]*region.Region, len(zones))
	for i := range zones {
		regions[i] = r
	}

	return zones, regions, nil
}

func (s *ZoneService) AssignOffices(zoneID int, officeIDs []int, ctx context.Context) (*zone.Zone, *region.Region, error) {
	// Get the zone
	z, r, err := s.FindByID(zoneID, ctx)
	if err != nil {
		return nil, nil, err
	}

	// Update each office's zone_id
	ginCtx := ctx.Value("gin_context").(*gin.Context)
	for _, id := range officeIDs {
		office, err := s.officeRepo.FindByID(id, ginCtx)
		if err != nil {
			return nil, nil, err
		}
		office.ZoneID = &zoneID
		if err := s.officeRepo.Update(office, ginCtx); err != nil {
			return nil, nil, err
		}
	}

	// Refresh the zone to get updated offices
	z, r, err = s.FindByID(zoneID, ctx)
	if err != nil {
		return nil, nil, err
	}

	return z, r, nil
}

func (s *ZoneService) RemoveOffices(zoneID int, officeIDs []int, ctx context.Context) error {
	// Get the offices for this zone
	ginCtx := ctx.Value("gin_context").(*gin.Context)
	offices, err := s.officeRepo.FindByZoneID(zoneID, ginCtx)
	if err != nil {
		return err
	}

	// Create a map of office IDs to remove for efficient lookup
	removeIDs := make(map[int]bool)
	for _, id := range officeIDs {
		removeIDs[id] = true
	}

	// Update each office that needs to be removed
	for _, office := range offices {
		if removeIDs[office.ID] {
			office.ZoneID = nil
			if err := s.officeRepo.Update(&office, ginCtx); err != nil {
				return err
			}
		}
	}

	return nil
}
