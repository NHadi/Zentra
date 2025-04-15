package postgres

import (
	"context"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/appcontext"

	"gorm.io/gorm"
)

type PettyCashRequestRepository struct {
	db *gorm.DB
}

func NewPettyCashRequestRepository(db *gorm.DB) accounting.PettyCashRequestRepository {
	return &PettyCashRequestRepository{db: db}
}

func (r *PettyCashRequestRepository) Create(request *accounting.PettyCashRequest, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	request.TenantID = userCtx.TenantID
	request.CreatedBy = userCtx.Username
	request.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).Create(request).Error
}

func (r *PettyCashRequestRepository) FindByID(id int, ctx context.Context) (*accounting.PettyCashRequest, error) {
	var request accounting.PettyCashRequest
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		Preload("TransactionCategory").
		First(&request)
	return &request, result.Error
}

func (r *PettyCashRequestRepository) FindAll(ctx context.Context) ([]accounting.PettyCashRequest, error) {
	var requests []accounting.PettyCashRequest
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("tenant_id = ?", userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		Preload("TransactionCategory").
		Find(&requests)
	return requests, result.Error
}

func (r *PettyCashRequestRepository) Update(request *accounting.PettyCashRequest, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	request.TenantID = userCtx.TenantID
	request.UpdatedBy = userCtx.Username
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", request.ID, userCtx.TenantID).
		Updates(request).Error
}

func (r *PettyCashRequestRepository) Delete(id int, ctx context.Context) error {
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	return r.db.WithContext(ctx).
		Where("id = ? AND tenant_id = ?", id, userCtx.TenantID).
		Delete(&accounting.PettyCashRequest{}).Error
}

func (r *PettyCashRequestRepository) FindByStatus(status string, ctx context.Context) ([]accounting.PettyCashRequest, error) {
	var requests []accounting.PettyCashRequest
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("status = ? AND tenant_id = ?", status, userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		Preload("TransactionCategory").
		Find(&requests)
	return requests, result.Error
}

func (r *PettyCashRequestRepository) FindByNumber(requestNumber string, ctx context.Context) (*accounting.PettyCashRequest, error) {
	var request accounting.PettyCashRequest
	userCtx := ctx.Value(appcontext.UserContextKey).(*appcontext.UserContext)
	result := r.db.WithContext(ctx).
		Where("request_number = ? AND tenant_id = ?", requestNumber, userCtx.TenantID).
		Preload("Office").
		Preload("Division").
		Preload("Channel").
		Preload("TransactionCategory").
		First(&request)
	return &request, result.Error
}
