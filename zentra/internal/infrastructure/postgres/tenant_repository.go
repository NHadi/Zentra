package postgres

import (
	"zentra/internal/domain/tenant"

	"gorm.io/gorm"
)

type TenantRepository struct {
	db *gorm.DB
}

func NewTenantRepository(db *gorm.DB) *TenantRepository {
	return &TenantRepository{db: db}
}

func (r *TenantRepository) FindAll() ([]tenant.Tenant, error) {
	var tenants []tenant.Tenant
	err := r.db.Find(&tenants).Error
	return tenants, err
}

func (r *TenantRepository) FindByID(id int) (*tenant.Tenant, error) {
	var tenant tenant.Tenant
	err := r.db.First(&tenant, id).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *TenantRepository) FindByDomain(domain string) (*tenant.Tenant, error) {
	var tenant tenant.Tenant
	err := r.db.Where("domain = ?", domain).First(&tenant).Error
	if err != nil {
		return nil, err
	}
	return &tenant, nil
}

func (r *TenantRepository) Create(tenant *tenant.Tenant) error {
	return r.db.Create(tenant).Error
}

func (r *TenantRepository) Update(tenant *tenant.Tenant) error {
	return r.db.Save(tenant).Error
}

func (r *TenantRepository) Delete(id int) error {
	return r.db.Delete(&tenant.Tenant{}, id).Error
}
