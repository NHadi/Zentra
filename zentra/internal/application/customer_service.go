package application

import (
	"context"
	"fmt"
	"time"
	"zentra/internal/domain/customer"
)

type CustomerService struct {
	repository customer.Repository
}

func NewCustomerService(repository customer.Repository) *CustomerService {
	return &CustomerService{
		repository: repository,
	}
}

func (s *CustomerService) Create(customer *customer.Customer, ctx context.Context) error {
	// Generate customer number if not provided
	if customer.CustomerNumber == "" {
		customer.CustomerNumber = fmt.Sprintf("CUST-%d", time.Now().Unix())
	}

	// Set default status if not provided
	if customer.Status == "" {
		customer.Status = "active"
	}

	return s.repository.Create(customer, ctx)
}

func (s *CustomerService) FindByID(id int, ctx context.Context) (*customer.Customer, error) {
	return s.repository.FindByID(id, ctx)
}

func (s *CustomerService) FindAll(page, perPage int, ctx context.Context) ([]customer.Customer, int64, error) {
	return s.repository.FindAll(page, perPage, ctx)
}

func (s *CustomerService) Update(customer *customer.Customer, ctx context.Context) error {
	return s.repository.Update(customer, ctx)
}

func (s *CustomerService) Delete(id int, ctx context.Context) error {
	return s.repository.Delete(id, ctx)
}

func (s *CustomerService) FindByEmail(email string, ctx context.Context) (*customer.Customer, error) {
	return s.repository.FindByEmail(email, ctx)
}

func (s *CustomerService) FindByPhone(phone string, ctx context.Context) (*customer.Customer, error) {
	return s.repository.FindByPhone(phone, ctx)
}

func (s *CustomerService) FindByCustomerNumber(customerNumber string, ctx context.Context) (*customer.Customer, error) {
	return s.repository.FindByCustomerNumber(customerNumber, ctx)
}

func (s *CustomerService) Search(query string, page, perPage int, ctx context.Context) ([]customer.Customer, int64, error) {
	return s.repository.Search(query, page, perPage, ctx)
}
