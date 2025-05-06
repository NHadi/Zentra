package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/customer"

	"github.com/gin-gonic/gin"
)

// CustomerResponse represents the customer response structure
type CustomerResponse struct {
	ID             int    `json:"id" example:"1"`
	CustomerNumber string `json:"customer_number" example:"CUST-001"`
	Name           string `json:"name" example:"John Doe"`
	Email          string `json:"email" example:"john.doe@example.com"`
	Phone          string `json:"phone" example:"123-456-7890"`
	Address        string `json:"address" example:"123 Main St"`
	City           string `json:"city" example:"New York"`
	PostalCode     string `json:"postal_code" example:"10001"`
	Status         string `json:"status" example:"active"`
	Notes          string `json:"notes" example:"VIP customer"`
	CreatedAt      string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy      string `json:"created_by" example:"admin"`
	UpdatedAt      string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy      string `json:"updated_by" example:"admin"`
	TenantID       int    `json:"tenant_id" example:"1"`
}

// CreateCustomerRequest represents the request structure for creating a customer
type CreateCustomerRequest struct {
	CustomerNumber string `json:"customer_number" example:"CUST-001"`
	Name           string `json:"name" binding:"required" example:"John Doe"`
	Email          string `json:"email" binding:"required,email" example:"john.doe@example.com"`
	Phone          string `json:"phone" example:"123-456-7890"`
	Address        string `json:"address" example:"123 Main St"`
	City           string `json:"city" example:"New York"`
	PostalCode     string `json:"postal_code" example:"10001"`
	Status         string `json:"status" example:"active"`
	Notes          string `json:"notes" example:"VIP customer"`
}

// UpdateCustomerRequest represents the request structure for updating a customer
type UpdateCustomerRequest struct {
	Name       string `json:"name" binding:"required" example:"John Doe"`
	Email      string `json:"email" binding:"required,email" example:"john.doe@example.com"`
	Phone      string `json:"phone" example:"123-456-7890"`
	Address    string `json:"address" example:"123 Main St"`
	City       string `json:"city" example:"New York"`
	PostalCode string `json:"postal_code" example:"10001"`
	Status     string `json:"status" example:"active"`
	Notes      string `json:"notes" example:"VIP customer"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

func toCustomerResponse(c *customer.Customer) CustomerResponse {
	return CustomerResponse{
		ID:             c.ID,
		CustomerNumber: c.CustomerNumber,
		Name:           c.Name,
		Email:          c.Email,
		Phone:          c.Phone,
		Address:        c.Address,
		City:           c.City,
		PostalCode:     c.PostalCode,
		Status:         c.Status,
		Notes:          c.Notes,
		CreatedAt:      c.CreatedAt.String(),
		CreatedBy:      c.CreatedBy,
		UpdatedAt:      c.UpdatedAt.String(),
		UpdatedBy:      c.UpdatedBy,
		TenantID:       c.TenantID,
	}
}

// @Summary Create a new customer
// @Description Create a new customer with the provided details
// @Tags Customer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param customer body CreateCustomerRequest true "Customer Data"
// @Success 201 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /customers [post]
func CreateCustomer(service *application.CustomerService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateCustomerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		newCustomer := &customer.Customer{
			CustomerNumber: req.CustomerNumber,
			Name:           req.Name,
			Email:          req.Email,
			Phone:          req.Phone,
			Address:        req.Address,
			City:           req.City,
			PostalCode:     req.PostalCode,
			Status:         req.Status,
			Notes:          req.Notes,
		}

		if err := service.Create(newCustomer, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toCustomerResponse(newCustomer))
	}
}

// @Summary Get a customer by ID
// @Description Get customer details by ID
// @Tags Customer
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Customer ID"
// @Success 200 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Customer not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /customers/{id} [get]
func GetCustomer(service *application.CustomerService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
			return
		}

		customer, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Customer not found"})
			return
		}

		c.JSON(http.StatusOK, toCustomerResponse(customer))
	}
}

// @Summary Get all customers
// @Description Get all customers with optional search and pagination
// @Tags Customer
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param query query string false "Search query"
// @Param page query int false "Page number (default: 1)"
// @Param per_page query int false "Items per page (default: 10)"
// @Success 200 {object} PaginatedResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /customers [get]
func GetAllCustomers(service *application.CustomerService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get query parameters
		query := c.Query("query")
		page := 1
		perPage := 10

		// Parse page parameter
		if pageStr := c.Query("page"); pageStr != "" {
			if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
				page = p
			}
		}

		// Parse per_page parameter
		if perPageStr := c.Query("per_page"); perPageStr != "" {
			if pp, err := strconv.Atoi(perPageStr); err == nil && pp > 0 {
				perPage = pp
			}
		}

		var customers []customer.Customer
		var total int64
		var err error

		if query != "" {
			// Use search if query parameter is provided
			customers, total, err = service.Search(query, page, perPage, c)
		} else {
			// Otherwise, get all customers with pagination
			customers, total, err = service.FindAll(page, perPage, c)
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Convert customers to response format
		response := make([]CustomerResponse, len(customers))
		for i, customer := range customers {
			response[i] = toCustomerResponse(&customer)
		}

		// Calculate total pages
		totalPages := int(total) / perPage
		if int(total)%perPage > 0 {
			totalPages++
		}

		// Return paginated response
		c.JSON(http.StatusOK, PaginatedResponse{
			Data:       response,
			Total:      total,
			Page:       page,
			PerPage:    perPage,
			TotalPages: totalPages,
		})
	}
}

// @Summary Update a customer
// @Description Update an existing customer with new details
// @Tags Customer
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Customer ID"
// @Param customer body UpdateCustomerRequest true "Customer Data"
// @Success 200 {object} CustomerResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Customer not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /customers/{id} [put]
func UpdateCustomer(service *application.CustomerService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
			return
		}

		var req UpdateCustomerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		customer, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Customer not found"})
			return
		}

		customer.Name = req.Name
		customer.Email = req.Email
		customer.Phone = req.Phone
		customer.Address = req.Address
		customer.City = req.City
		customer.PostalCode = req.PostalCode
		customer.Status = req.Status
		customer.Notes = req.Notes

		if err := service.Update(customer, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toCustomerResponse(customer))
	}
}

// @Summary Delete a customer
// @Description Delete an existing customer
// @Tags Customer
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Customer ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Customer not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /customers/{id} [delete]
func DeleteCustomer(service *application.CustomerService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid customer ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Customer deleted successfully"})
	}
}
