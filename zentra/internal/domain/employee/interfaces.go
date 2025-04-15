package employee

import "context"

// EmployeeRepository defines the interface for employee persistence operations
type EmployeeRepository interface {
	FindByID(id int, ctx context.Context) (*Employee, error)
}
