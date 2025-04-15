package handlers

import (
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/payment"

	"github.com/gin-gonic/gin"
)

// PaymentResponse represents the payment response structure
// @Description Payment response model
type PaymentResponse struct {
	ID              int     `json:"id" example:"1"`
	OrderID         int     `json:"order_id" example:"1"`
	Amount          float64 `json:"amount" example:"100.00"`
	PaymentMethod   string  `json:"payment_method" example:"credit_card"`
	ReferenceNumber string  `json:"reference_number" example:"PAY-001"`
	Status          string  `json:"status" example:"completed"`
	PaymentDate     string  `json:"payment_date" example:"2024-03-24T21:41:49Z"`
	Notes           string  `json:"notes" example:"Payment received"`
	CreatedAt       string  `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy       string  `json:"created_by" example:"admin"`
	UpdatedAt       string  `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy       string  `json:"updated_by" example:"admin"`
	TenantID        int     `json:"tenant_id" example:"1"`
}

// CreatePaymentRequest represents the request structure for creating a payment
// @Description Create payment request model
type CreatePaymentRequest struct {
	OrderID         int     `json:"order_id" binding:"required" example:"1"`
	Amount          float64 `json:"amount" binding:"required" example:"100.00"`
	PaymentMethod   string  `json:"payment_method" binding:"required" example:"credit_card"`
	ReferenceNumber string  `json:"reference_number" binding:"required" example:"PAY-001"`
	Status          string  `json:"status" binding:"required" example:"completed"`
	PaymentDate     string  `json:"payment_date" example:"2024-03-24T21:41:49Z"`
	Notes           string  `json:"notes" example:"Payment received"`
}

// UpdatePaymentRequest represents the request structure for updating a payment
// @Description Update payment request model
type UpdatePaymentRequest struct {
	Amount          float64 `json:"amount" binding:"required" example:"100.00"`
	PaymentMethod   string  `json:"payment_method" binding:"required" example:"credit_card"`
	ReferenceNumber string  `json:"reference_number" binding:"required" example:"PAY-001"`
	Status          string  `json:"status" binding:"required" example:"completed"`
	PaymentDate     string  `json:"payment_date" example:"2024-03-24T21:41:49Z"`
	Notes           string  `json:"notes" example:"Payment received"`
}

func toPaymentResponse(p *payment.Payment) PaymentResponse {
	return PaymentResponse{
		ID:              p.ID,
		OrderID:         p.OrderID,
		Amount:          p.Amount,
		PaymentMethod:   p.PaymentMethod,
		ReferenceNumber: p.ReferenceNumber,
		Status:          p.Status,
		PaymentDate:     p.PaymentDate,
		Notes:           p.Notes,
		CreatedAt:       p.CreatedAt.String(),
		CreatedBy:       p.CreatedBy,
		UpdatedAt:       p.UpdatedAt.String(),
		UpdatedBy:       p.UpdatedBy,
		TenantID:        p.TenantID,
	}
}

// @Summary Create a new payment
// @Description Create a new payment with the provided details
// @Tags Payment
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param payment body CreatePaymentRequest true "Payment Data"
// @Success 201 {object} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments [post]
func CreatePayment(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreatePaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if reference number already exists
		existing, err := service.FindByReferenceNumber(req.ReferenceNumber, c)
		if err == nil && existing != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Reference number already exists"})
			return
		}

		payment := &payment.Payment{
			OrderID:         req.OrderID,
			Amount:          req.Amount,
			PaymentMethod:   req.PaymentMethod,
			ReferenceNumber: req.ReferenceNumber,
			Status:          req.Status,
			PaymentDate:     req.PaymentDate,
			Notes:           req.Notes,
		}

		if err := service.Create(payment, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created payment
		createdPayment, err := service.FindByID(payment.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created payment"})
			return
		}

		c.JSON(http.StatusCreated, toPaymentResponse(createdPayment))
	}
}

// @Summary Get a payment by ID
// @Description Get payment details by ID
// @Tags Payment
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Payment ID"
// @Success 200 {object} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Payment not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments/{id} [get]
func GetPayment(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid payment ID"})
			return
		}

		payment, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Payment not found"})
			return
		}

		c.JSON(http.StatusOK, toPaymentResponse(payment))
	}
}

// @Summary Get all payments
// @Description Get all payments
// @Tags Payment
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments [get]
func GetAllPayments(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		payments, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]PaymentResponse, len(payments))
		for i, p := range payments {
			response[i] = toPaymentResponse(&p)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update a payment
// @Description Update an existing payment with new details
// @Tags Payment
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Payment ID"
// @Param payment body UpdatePaymentRequest true "Payment Data"
// @Success 200 {object} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Payment not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments/{id} [put]
func UpdatePayment(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid payment ID"})
			return
		}

		var req UpdatePaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		payment, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Payment not found"})
			return
		}

		payment.Amount = req.Amount
		payment.PaymentMethod = req.PaymentMethod
		payment.ReferenceNumber = req.ReferenceNumber
		payment.Status = req.Status
		payment.PaymentDate = req.PaymentDate
		payment.Notes = req.Notes

		if err := service.Update(payment, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated payment
		updatedPayment, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated payment"})
			return
		}

		c.JSON(http.StatusOK, toPaymentResponse(updatedPayment))
	}
}

// @Summary Delete a payment
// @Description Delete an existing payment
// @Tags Payment
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Payment ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Payment not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments/{id} [delete]
func DeletePayment(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid payment ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Payment deleted successfully"})
	}
}

// @Summary Get payments by order ID
// @Description Get all payments for a specific order
// @Tags Payment
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param order_id query int true "Order ID" example:"1"
// @Success 200 {array} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments/by-order [get]
func GetPaymentsByOrderID(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orderID, err := strconv.Atoi(c.Query("order_id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order ID"})
			return
		}

		payments, err := service.FindByOrderID(orderID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]PaymentResponse, len(payments))
		for i, p := range payments {
			response[i] = toPaymentResponse(&p)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get payments by status
// @Description Get all payments with a specific status
// @Tags Payment
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param status query string true "Payment Status" example:"completed"
// @Success 200 {array} PaymentResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /payments/by-status [get]
func GetPaymentsByStatus(service *application.PaymentService) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		if status == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Status is required"})
			return
		}

		payments, err := service.FindByStatus(status, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]PaymentResponse, len(payments))
		for i, p := range payments {
			response[i] = toPaymentResponse(&p)
		}

		c.JSON(http.StatusOK, response)
	}
}
