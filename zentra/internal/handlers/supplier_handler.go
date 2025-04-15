package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/supplier"

	"github.com/gin-gonic/gin"
)

// SupplierResponse represents the supplier response structure
// @Description Supplier response model
type SupplierResponse struct {
	ID                int    `json:"id" example:"1"`
	Code              string `json:"code" example:"SUP-001"`
	Name              string `json:"name" example:"Premium Fabrics Co."`
	ContactPerson     string `json:"contact_person" example:"John Smith"`
	Phone             string `json:"phone" example:"+1-555-0123"`
	Email             string `json:"email" example:"john@premiumfabrics.com"`
	Address           string `json:"address" example:"123 Textile Road, Fabric City"`
	TaxNumber         string `json:"tax_number" example:"TAX123456"`
	BankName          string `json:"bank_name" example:"City Bank"`
	BankAccountNumber string `json:"bank_account_number" example:"1234567890"`
	BankAccountName   string `json:"bank_account_name" example:"Premium Fabrics Co."`
	IsActive          bool   `json:"is_active" example:"true"`
	TenantID          int    `json:"tenant_id" example:"1"`
	CreatedAt         string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy         string `json:"created_by" example:"admin"`
	UpdatedAt         string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy         string `json:"updated_by" example:"admin"`
}

// CreateSupplierRequest represents the request structure for creating a supplier
// @Description Create supplier request model
type CreateSupplierRequest struct {
	Code              string `json:"code" binding:"required" example:"SUP-001"`
	Name              string `json:"name" binding:"required" example:"Premium Fabrics Co."`
	ContactPerson     string `json:"contact_person" example:"John Smith"`
	Phone             string `json:"phone" example:"+1-555-0123"`
	Email             string `json:"email" binding:"required,email" example:"john@premiumfabrics.com"`
	Address           string `json:"address" example:"123 Textile Road, Fabric City"`
	TaxNumber         string `json:"tax_number" example:"TAX123456"`
	BankName          string `json:"bank_name" example:"City Bank"`
	BankAccountNumber string `json:"bank_account_number" example:"1234567890"`
	BankAccountName   string `json:"bank_account_name" example:"Premium Fabrics Co."`
	IsActive          bool   `json:"is_active" example:"true"`
}

// UpdateSupplierRequest represents the request structure for updating a supplier
// @Description Update supplier request model
type UpdateSupplierRequest struct {
	Code              string `json:"code" binding:"required" example:"SUP-001"`
	Name              string `json:"name" binding:"required" example:"Premium Fabrics Co."`
	ContactPerson     string `json:"contact_person" example:"John Smith"`
	Phone             string `json:"phone" example:"+1-555-0123"`
	Email             string `json:"email" binding:"required,email" example:"john@premiumfabrics.com"`
	Address           string `json:"address" example:"123 Textile Road, Fabric City"`
	TaxNumber         string `json:"tax_number" example:"TAX123456"`
	BankName          string `json:"bank_name" example:"City Bank"`
	BankAccountNumber string `json:"bank_account_number" example:"1234567890"`
	BankAccountName   string `json:"bank_account_name" example:"Premium Fabrics Co."`
	IsActive          bool   `json:"is_active" example:"true"`
}

func toSupplierResponse(s *supplier.Supplier) SupplierResponse {
	return SupplierResponse{
		ID:                s.ID,
		Code:              s.Code,
		Name:              s.Name,
		ContactPerson:     s.ContactPerson,
		Phone:             s.Phone,
		Email:             s.Email,
		Address:           s.Address,
		TaxNumber:         s.TaxNumber,
		BankName:          s.BankName,
		BankAccountNumber: s.BankAccountNumber,
		BankAccountName:   s.BankAccountName,
		IsActive:          s.IsActive,
		TenantID:          s.TenantID,
		CreatedAt:         s.CreatedAt.String(),
		CreatedBy:         s.CreatedBy,
		UpdatedAt:         s.UpdatedAt.String(),
		UpdatedBy:         s.UpdatedBy,
	}
}

// @Summary Create a new supplier
// @Description Create a new supplier with the provided details
// @Tags Supplier
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param supplier body CreateSupplierRequest true "Supplier Data"
// @Success 201 {object} SupplierResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /suppliers [post]
func CreateSupplier(service *application.SupplierService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateSupplierRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		supplier := &supplier.Supplier{
			Code:              req.Code,
			Name:              req.Name,
			ContactPerson:     req.ContactPerson,
			Phone:             req.Phone,
			Email:             req.Email,
			Address:           req.Address,
			TaxNumber:         req.TaxNumber,
			BankName:          req.BankName,
			BankAccountNumber: req.BankAccountNumber,
			BankAccountName:   req.BankAccountName,
			IsActive:          req.IsActive,
		}

		if err := service.Create(supplier, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toSupplierResponse(supplier))
	}
}

// @Summary Get a supplier by ID
// @Description Get supplier details by ID
// @Tags Supplier
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Supplier ID"
// @Success 200 {object} SupplierResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Supplier not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /suppliers/{id} [get]
func GetSupplier(service *application.SupplierService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid supplier ID"})
			return
		}

		supplier, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Supplier not found"})
			return
		}

		c.JSON(http.StatusOK, toSupplierResponse(supplier))
	}
}

// @Summary Get all suppliers
// @Description Get all suppliers
// @Tags Supplier
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} SupplierResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /suppliers [get]
func GetAllSuppliers(service *application.SupplierService) gin.HandlerFunc {
	return func(c *gin.Context) {
		suppliers, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]SupplierResponse, len(suppliers))
		for i, s := range suppliers {
			response[i] = toSupplierResponse(&s)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a supplier
// @Description Update an existing supplier with new details
// @Tags Supplier
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Supplier ID"
// @Param supplier body UpdateSupplierRequest true "Supplier Data"
// @Success 200 {object} SupplierResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Supplier not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /suppliers/{id} [put]
func UpdateSupplier(service *application.SupplierService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid supplier ID"})
			return
		}

		var req UpdateSupplierRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		supplier, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Supplier not found"})
			return
		}

		supplier.Code = req.Code
		supplier.Name = req.Name
		supplier.ContactPerson = req.ContactPerson
		supplier.Phone = req.Phone
		supplier.Email = req.Email
		supplier.Address = req.Address
		supplier.TaxNumber = req.TaxNumber
		supplier.BankName = req.BankName
		supplier.BankAccountNumber = req.BankAccountNumber
		supplier.BankAccountName = req.BankAccountName
		supplier.IsActive = req.IsActive

		if err := service.Update(supplier, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toSupplierResponse(supplier))
	}
}

// @Summary Delete a supplier
// @Description Delete an existing supplier
// @Tags Supplier
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Supplier ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Supplier not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /suppliers/{id} [delete]
func DeleteSupplier(service *application.SupplierService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid supplier ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Supplier deleted successfully"})
	}
}
