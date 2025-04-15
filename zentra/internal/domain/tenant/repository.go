package tenant

type Repository interface {
	FindAll() ([]Tenant, error)
	FindByID(id int) (*Tenant, error)
	FindByDomain(domain string) (*Tenant, error)
	Create(tenant *Tenant) error
	Update(tenant *Tenant) error
	Delete(id int) error
}