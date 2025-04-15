package stockmovement

import "context"

// Repository defines the interface for stock movement data access
type Repository interface {
	Create(movement *StockMovement, ctx context.Context) error
	FindByID(id int, ctx context.Context) (*StockMovement, error)
	FindAll(ctx context.Context) ([]StockMovement, error)
	FindByItemID(itemID int, ctx context.Context) ([]StockMovement, error)
	FindByReference(refType string, refID int, ctx context.Context) ([]StockMovement, error)
}
