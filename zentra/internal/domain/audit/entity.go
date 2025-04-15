package audit

import (
	"encoding/json"
	"time"
	"zentra/internal/domain/common"
)

type Action string

const (
	ActionCreate Action = "create"
	ActionUpdate Action = "update"
	ActionDelete Action = "delete"
)

type AuditTrail struct {
	ID         int             `gorm:"primaryKey;autoIncrement:true" json:"id"`
	EntityType string          `gorm:"type:varchar(50);not null" json:"entity_type"`
	EntityID   int             `gorm:"not null" json:"entity_id"`
	Action     Action          `gorm:"type:varchar(20);not null" json:"action"`
	OldValues  json.RawMessage `gorm:"type:jsonb" json:"old_values,omitempty"`
	NewValues  json.RawMessage `gorm:"type:jsonb" json:"new_values,omitempty"`
	CreatedAt  time.Time       `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	CreatedBy  string          `gorm:"type:varchar(255);not null" json:"created_by"`
	common.TenantModel
}

func (AuditTrail) TableName() string {
	return "audit_trail"
}
