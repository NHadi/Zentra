package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/accounting"
	"zentra/internal/domain/models"

	"github.com/gin-gonic/gin"
)

// TransactionCategoryResponse represents the transaction category response structure
type TransactionCategoryResponse struct {
	ID          int    `json:"id" example:"1"`
	Code        string `json:"code" example:"INC-SALES"`
	Name        string `json:"name" example:"Sales Income"`
	Type        string `json:"type" example:"income"`
	Description string `json:"description" example:"Income from sales"`
	IsActive    bool   `json:"is_active" example:"true"`
	CreatedAt   string `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy   string `json:"created_by" example:"admin"`
	UpdatedAt   string `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy   string `json:"updated_by" example:"admin"`
	TenantID    int    `json:"tenant_id" example:"1"`
}

// CreateTransactionCategoryRequest represents the request structure for creating a transaction category
type CreateTransactionCategoryRequest struct {
	Code        string `json:"code" binding:"required" example:"INC-SALES"`
	Name        string `json:"name" binding:"required" example:"Sales Income"`
	Type        string `json:"type" binding:"required" example:"income"`
	Description string `json:"description" example:"Income from sales"`
	IsActive    bool   `json:"is_active" example:"true"`
}

// UpdateTransactionCategoryRequest represents the request structure for updating a transaction category
type UpdateTransactionCategoryRequest struct {
	Name        string `json:"name" binding:"required" example:"Sales Income"`
	Type        string `json:"type" binding:"required" example:"income"`
	Description string `json:"description" example:"Income from sales"`
	IsActive    bool   `json:"is_active" example:"true"`
}

func toTransactionCategoryResponse(c *accounting.TransactionCategory) TransactionCategoryResponse {
	return TransactionCategoryResponse{
		ID:          c.ID,
		Code:        c.Code,
		Name:        c.Name,
		Type:        c.Type,
		Description: c.Description,
		IsActive:    c.IsActive,
		CreatedAt:   c.CreatedAt.String(),
		CreatedBy:   c.CreatedBy,
		UpdatedAt:   c.UpdatedAt.String(),
		UpdatedBy:   c.UpdatedBy,
		TenantID:    c.TenantID,
	}
}

// @Summary Create a new transaction category
// @Description Create a new transaction category with the provided details
// @Tags Transaction Category
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param category body CreateTransactionCategoryRequest true "Transaction Category Data"
// @Success 201 {object} TransactionCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /transaction-categories [post]
func CreateTransactionCategory(service *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateTransactionCategoryRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		category := &accounting.TransactionCategory{
			TransactionCategory: models.TransactionCategory{
				Code:        req.Code,
				Name:        req.Name,
				Type:        req.Type,
				Description: req.Description,
				IsActive:    req.IsActive,
			},
		}

		if err := service.Create(category, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusCreated, toTransactionCategoryResponse(category))
	}
}

// @Summary Get a transaction category by ID
// @Description Get transaction category details by ID
// @Tags Transaction Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Transaction Category ID"
// @Success 200 {object} TransactionCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Transaction Category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /transaction-categories/{id} [get]
func GetTransactionCategory(service *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid transaction category ID"})
			return
		}

		category, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Transaction category not found"})
			return
		}

		c.JSON(http.StatusOK, toTransactionCategoryResponse(category))
	}
}

// @Summary Get all transaction categories
// @Description Get all transaction categories
// @Tags Transaction Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} TransactionCategoryResponse
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /transaction-categories [get]
func GetAllTransactionCategories(service *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		categories, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]TransactionCategoryResponse, len(categories))
		for i, category := range categories {
			response[i] = toTransactionCategoryResponse(&category)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a transaction category
// @Description Update an existing transaction category with new details
// @Tags Transaction Category
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Transaction Category ID"
// @Param category body UpdateTransactionCategoryRequest true "Transaction Category Data"
// @Success 200 {object} TransactionCategoryResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Transaction Category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /transaction-categories/{id} [put]
func UpdateTransactionCategory(service *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid transaction category ID"})
			return
		}

		var req UpdateTransactionCategoryRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		category, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Transaction category not found"})
			return
		}

		category.Name = req.Name
		category.Type = req.Type
		category.Description = req.Description
		category.IsActive = req.IsActive

		if err := service.Update(category, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, toTransactionCategoryResponse(category))
	}
}

// @Summary Delete a transaction category
// @Description Delete an existing transaction category
// @Tags Transaction Category
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Transaction Category ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Transaction Category not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /transaction-categories/{id} [delete]
func DeleteTransactionCategory(service *application.TransactionCategoryService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid transaction category ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Transaction category deleted successfully"})
	}
}
