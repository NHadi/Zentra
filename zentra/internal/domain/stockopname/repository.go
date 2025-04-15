package stockopname

import "context"

// Repository defines the interface for stock opname data access
type Repository interface {
	Create(opname *StockOpname, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*StockOpname, error)
	FindAll(ctx context.Context) ([]StockOpname, error)
	Update(opname *StockOpname, ctx context.Context) error
	Delete(id int, ctx context.Context) error
	FindByNumber(number string, ctx context.Context) (*StockOpname, error)

	// Detail operations
	AddDetail(detail *StockOpnameDetail, ctx context.Context) error
	UpdateDetail(detail *StockOpnameDetail, ctx context.Context) error
	DeleteDetail(id int, ctx context.Context) error
	FindDetailsByOpnameID(opnameID int, ctx context.Context) ([]StockOpnameDetail, error)
}
