package audit

import (
	"context"
	"encoding/json"
	"time"
	"zentra/internal/domain/appcontext"
	"zentra/internal/domain/common"
)

// AuditableValues represents the structure we want to store in audit trail
type AuditableValues struct {
	ID        interface{} `json:"id,omitempty"`
	Name      string      `json:"name,omitempty"`
	URL       string      `json:"url,omitempty"`
	Icon      string      `json:"icon,omitempty"`
	ParentID  *int        `json:"parent_id,omitempty"`
	Sort      int         `json:"sort,omitempty"`
	TenantID  int         `json:"tenant_id,omitempty"`
	CreatedAt time.Time   `json:"created_at,omitempty"`
	CreatedBy string      `json:"created_by,omitempty"`
}

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) LogChange(entityType string, entityID int, action Action, oldValues, newValues interface{}, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)

	// Convert to JSON and back to our auditable structure to exclude unwanted fields
	var oldAuditable, newAuditable AuditableValues

	if oldValues != nil {
		tmpJSON, err := json.Marshal(oldValues)
		if err != nil {
			return err
		}
		if err := json.Unmarshal(tmpJSON, &oldAuditable); err != nil {
			return err
		}
	}

	if newValues != nil {
		tmpJSON, err := json.Marshal(newValues)
		if err != nil {
			return err
		}
		if err := json.Unmarshal(tmpJSON, &newAuditable); err != nil {
			return err
		}
	}

	// Marshal the filtered structures
	oldValuesJSON, err := json.Marshal(oldAuditable)
	if err != nil {
		return err
	}

	newValuesJSON, err := json.Marshal(newAuditable)
	if err != nil {
		return err
	}

	audit := &AuditTrail{
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		OldValues:  json.RawMessage(oldValuesJSON),
		NewValues:  json.RawMessage(newValuesJSON),
		CreatedBy:  userCtx.Username,
		CreatedAt:  time.Now(),
		TenantModel: common.TenantModel{
			TenantID: userCtx.TenantID,
		},
	}

	return s.repository.Create(audit, ctx)
}

func (s *Service) GetEntityHistory(entityType string, entityID int, ctx context.Context) ([]AuditTrail, error) {
	return s.repository.FindByEntityID(entityType, entityID, ctx)
}

func (s *Service) GetTenantHistory(tenantID int, ctx context.Context) ([]AuditTrail, error) {
	return s.repository.FindByTenantID(tenantID, ctx)
}

func (s *Service) GetHistoryByDateRange(startDate, endDate string, ctx context.Context) ([]AuditTrail, error) {
	return s.repository.FindByDateRange(startDate, endDate, ctx)
}
