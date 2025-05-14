package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"zentra/internal/application"
	"zentra/internal/domain/order"
	"zentra/internal/infrastructure/whatsapp"

	"github.com/gin-gonic/gin"
)

// ProductDetail represents the product details in the order item response
// @Description Product detail model
type ProductDetail struct {
	Name        string `json:"name" example:"Product Name"`
	Description string `json:"description" example:"Product Description"`
}

// OrderItemResponse represents the order item response structure
// @Description Order item response model
type OrderItemResponse struct {
	ID                  int             `json:"id" example:"1"`
	OrderID             int             `json:"order_id" example:"1"`
	ProductID           int             `json:"product_id" example:"1"`
	Quantity            int             `json:"quantity" example:"2"`
	Size                string          `json:"size" example:"M"`
	Color               string          `json:"color" example:"Red/White"`
	UnitPrice           float64         `json:"unit_price" example:"49.99"`
	OriginalSubtotal    float64         `json:"original_subtotal" example:"99.98"`
	AppliedDiscountRule json.RawMessage `json:"applied_discount_rule" swaggertype:"string" example:"{}"`
	DiscountAmount      float64         `json:"discount_amount" example:"10.00"`
	FinalSubtotal       float64         `json:"final_subtotal" example:"89.98"`
	Customization       json.RawMessage `json:"customization" swaggertype:"string" example:"{}"`
	CurrentTask         string          `json:"current_task" example:"layout"`
	ProductionStatus    string          `json:"production_status" example:"pending"`
	Tasks               []TaskResponse  `json:"tasks,omitempty"`
	CreatedAt           string          `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy           string          `json:"created_by" example:"admin"`
	UpdatedAt           string          `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy           string          `json:"updated_by" example:"admin"`
	TenantID            int             `json:"tenant_id" example:"1"`
	ProductDetail       ProductDetail   `json:"product_detail"`
	MainPhoto           string          `json:"main_photo"`
}

// OrderResponse represents the order response structure
// @Description Order response model
type OrderResponse struct {
	ID                   int                 `json:"id" example:"1"`
	OrderNumber          string              `json:"order_number" example:"ORD-001"`
	CustomerID           int                 `json:"customer_id" example:"1"`
	Customer             *CustomerResponse   `json:"customer,omitempty"`
	OfficeID             int                 `json:"office_id" example:"1"`
	Subtotal             float64             `json:"subtotal" example:"100.00"`
	DiscountAmount       float64             `json:"discount_amount" example:"10.00"`
	TotalAmount          float64             `json:"total_amount" example:"90.00"`
	Status               string              `json:"status" example:"pending"`
	PaymentStatus        string              `json:"payment_status" example:"unpaid"`
	ExpectedDeliveryDate string              `json:"expected_delivery_date" example:"2024-03-25"`
	Notes                string              `json:"notes" example:"Please deliver in the morning"`
	OrderItems           []OrderItemResponse `json:"order_items,omitempty"`
	Payments             []PaymentResponse   `json:"payments,omitempty"`
	CreatedAt            string              `json:"created_at" example:"2024-03-24T21:41:49Z"`
	CreatedBy            string              `json:"created_by" example:"admin"`
	UpdatedAt            string              `json:"updated_at" example:"2024-03-24T21:41:49Z"`
	UpdatedBy            string              `json:"updated_by" example:"admin"`
	TenantID             int                 `json:"tenant_id" example:"1"`
}

// CreateOrderItemRequest represents the request structure for creating an order item
type CreateOrderItemRequest struct {
	ProductID        int             `json:"product_id" binding:"required" example:"1"`
	Quantity         int             `json:"quantity" binding:"required" example:"2"`
	Size             string          `json:"size" binding:"required" example:"M"`
	Color            string          `json:"color" binding:"required" example:"Red/White"`
	UnitPrice        float64         `json:"unit_price" binding:"required" example:"49.99"`
	OriginalSubtotal float64         `json:"original_subtotal" example:"99.98"`
	Customization    json.RawMessage `json:"customization" example:"{}"`
	ProductionStatus string          `json:"production_status" example:"pending"`
}

// CreateOrderRequest represents the request structure for creating an order
// @Description Create order request model
type CreateOrderRequest struct {
	OrderNumber          string                   `json:"order_number" binding:"required" example:"ORD-001"`
	CustomerID           int                      `json:"customer_id" binding:"required" example:"1"`
	OfficeID             int                      `json:"office_id" binding:"required" example:"1"`
	Subtotal             float64                  `json:"subtotal" binding:"required" example:"100.00"`
	DiscountAmount       float64                  `json:"discount_amount" example:"10.00"`
	TotalAmount          float64                  `json:"total_amount" binding:"required" example:"90.00"`
	Status               string                   `json:"status" binding:"required" example:"pending"`
	PaymentStatus        string                   `json:"payment_status" binding:"required" example:"unpaid"`
	ExpectedDeliveryDate string                   `json:"expected_delivery_date" example:"2024-03-25"`
	Notes                string                   `json:"notes" example:"Please deliver in the morning"`
	OrderItems           []CreateOrderItemRequest `json:"order_items"`
}

// UpdateOrderRequest represents the request structure for updating an order
// @Description Update order request model
type UpdateOrderRequest struct {
	CustomerID           int     `json:"customer_id" binding:"required" example:"1"`
	OfficeID             int     `json:"office_id" binding:"required" example:"1"`
	Subtotal             float64 `json:"subtotal" binding:"required" example:"100.00"`
	DiscountAmount       float64 `json:"discount_amount" example:"10.00"`
	TotalAmount          float64 `json:"total_amount" binding:"required" example:"90.00"`
	Status               string  `json:"status" binding:"required" example:"pending"`
	PaymentStatus        string  `json:"payment_status" binding:"required" example:"unpaid"`
	ExpectedDeliveryDate string  `json:"expected_delivery_date" example:"2024-03-25"`
	Notes                string  `json:"notes" example:"Please deliver in the morning"`
}

// UpdateOrderStatusRequest represents the request structure for updating order status
type UpdateOrderStatusRequest struct {
	Status            string `json:"status" binding:"required" example:"in_production"`
	SendNotification  bool   `json:"send_notification" example:"true"`
	AdditionalMessage string `json:"additional_message" example:"Your order will be ready in 2 days"`
}

// BulkUpdateOrderStatusRequest represents the request structure for bulk updating order statuses
type BulkUpdateOrderStatusRequest struct {
	OrderIDs          []int  `json:"order_ids" binding:"required" example:"[1, 2, 3]"`
	Status            string `json:"status" binding:"required" example:"in_production"`
	SendNotification  bool   `json:"send_notification" example:"true"`
	AdditionalMessage string `json:"additional_message" example:"Your order will be ready in 2 days"`
}

func toOrderItemResponse(item *order.OrderItem) OrderItemResponse {
	response := OrderItemResponse{
		ID:                  item.ID,
		OrderID:             item.OrderID,
		ProductID:           item.ProductID,
		Quantity:            item.Quantity,
		Size:                item.Size,
		Color:               item.Color,
		UnitPrice:           item.UnitPrice,
		OriginalSubtotal:    item.OriginalSubtotal,
		AppliedDiscountRule: item.AppliedDiscountRule,
		DiscountAmount:      item.DiscountAmount,
		FinalSubtotal:       item.FinalSubtotal,
		Customization:       item.Customization,
		CurrentTask:         item.CurrentTask,
		ProductionStatus:    item.ProductionStatus,
		CreatedAt:           item.CreatedAt.String(),
		CreatedBy:           item.CreatedBy,
		UpdatedAt:           item.UpdatedAt.String(),
		UpdatedBy:           item.UpdatedBy,
		TenantID:            item.TenantID,
		ProductDetail:       ProductDetail{Name: item.Product.Name, Description: item.Product.Description},
	}

	// Check if the product has images before accessing
	if len(item.Product.Images) > 0 {
		response.MainPhoto = item.Product.Images[0].ImageURL
	} else {
		response.MainPhoto = "" // or a default image URL
	}

	// Add tasks if they exist
	if len(item.Tasks) > 0 {
		response.Tasks = make([]TaskResponse, len(item.Tasks))
		for i, t := range item.Tasks {
			response.Tasks[i] = ToTaskResponse(&t)
		}
	}

	return response
}

func toOrderResponse(o *order.Order) OrderResponse {
	response := OrderResponse{
		ID:                   o.ID,
		OrderNumber:          o.OrderNumber,
		CustomerID:           o.CustomerID,
		OfficeID:             o.OfficeID,
		Subtotal:             o.Subtotal,
		DiscountAmount:       o.DiscountAmount,
		TotalAmount:          o.TotalAmount,
		Status:               o.Status,
		PaymentStatus:        o.PaymentStatus,
		ExpectedDeliveryDate: o.ExpectedDeliveryDate,
		Notes:                o.Notes,
		CreatedAt:            o.CreatedAt.String(),
		CreatedBy:            o.CreatedBy,
		UpdatedAt:            o.UpdatedAt.String(),
		UpdatedBy:            o.UpdatedBy,
		TenantID:             o.TenantID,
	}

	// Add customer if it exists
	if o.Customer != nil {
		customerResponse := toCustomerResponse(o.Customer)
		response.Customer = &customerResponse
	}

	// Add order items if they exist
	if len(o.OrderItems) > 0 {
		response.OrderItems = make([]OrderItemResponse, len(o.OrderItems))
		for i, item := range o.OrderItems {
			response.OrderItems[i] = toOrderItemResponse(&item)
		}
	}

	// Add payments if they exist
	if len(o.Payments) > 0 {
		response.Payments = make([]PaymentResponse, len(o.Payments))
		for i, p := range o.Payments {
			response.Payments[i] = toPaymentResponse(&p)
		}
	}

	return response
}

// @Summary Create a new order
// @Description Create a new order with the provided details
// @Tags Order
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param order body CreateOrderRequest true "Order Data"
// @Success 201 {object} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders [post]
func CreateOrder(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Check if order number already exists
		existing, err := service.FindByOrderNumber(req.OrderNumber, c)
		if err == nil && existing != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Order number already exists"})
			return
		}

		// Create the order
		newOrder := &order.Order{
			OrderNumber:          req.OrderNumber,
			CustomerID:           req.CustomerID,
			OfficeID:             req.OfficeID,
			Subtotal:             req.Subtotal,
			DiscountAmount:       req.DiscountAmount,
			TotalAmount:          req.TotalAmount,
			Status:               req.Status,
			PaymentStatus:        req.PaymentStatus,
			ExpectedDeliveryDate: req.ExpectedDeliveryDate,
			Notes:                req.Notes,
		}

		// Create order items
		if len(req.OrderItems) > 0 {
			orderItems := make([]order.OrderItem, len(req.OrderItems))
			for i, item := range req.OrderItems {
				orderItems[i] = order.OrderItem{
					ProductID:        item.ProductID,
					Quantity:         item.Quantity,
					Size:             item.Size,
					Color:            item.Color,
					UnitPrice:        item.UnitPrice,
					OriginalSubtotal: item.OriginalSubtotal,
					FinalSubtotal:    item.OriginalSubtotal, // Initially same as original
					Customization:    item.Customization,
					ProductionStatus: item.ProductionStatus,
				}
			}
			newOrder.OrderItems = orderItems
		}

		if err := service.Create(newOrder, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the created order
		createdOrder, err := service.FindByID(newOrder.ID, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch created order"})
			return
		}

		c.JSON(http.StatusCreated, toOrderResponse(createdOrder))
	}
}

// @Summary Get an order by ID
// @Description Get order details by ID
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Order ID"
// @Success 200 {object} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/{id} [get]
func GetOrder(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order ID"})
			return
		}

		order, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Order not found"})
			return
		}

		c.JSON(http.StatusOK, toOrderResponse(order))
	}
}

// @Summary Get all orders
// @Description Get all orders
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Success 200 {array} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders [get]
func GetAllOrders(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		orders, err := service.FindAll(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OrderResponse, len(orders))
		for i, o := range orders {
			response[i] = toOrderResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update an order
// @Description Update an existing order with new details
// @Tags Order
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Order ID"
// @Param order body UpdateOrderRequest true "Order Data"
// @Success 200 {object} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/{id} [put]
func UpdateOrder(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order ID"})
			return
		}

		var req UpdateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		order, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Order not found"})
			return
		}

		order.CustomerID = req.CustomerID
		order.OfficeID = req.OfficeID
		order.Subtotal = req.Subtotal
		order.DiscountAmount = req.DiscountAmount
		order.TotalAmount = req.TotalAmount
		order.Status = req.Status
		order.PaymentStatus = req.PaymentStatus
		order.ExpectedDeliveryDate = req.ExpectedDeliveryDate
		order.Notes = req.Notes

		if err := service.Update(order, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Fetch the updated order
		updatedOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated order"})
			return
		}

		c.JSON(http.StatusOK, toOrderResponse(updatedOrder))
	}
}

// @Summary Delete an order
// @Description Delete an existing order
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Order ID"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/{id} [delete]
func DeleteOrder(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order ID"})
			return
		}

		if err := service.Delete(id, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		c.JSON(http.StatusOK, SuccessResponse{Message: "Order deleted successfully"})
	}
}

// @Summary Get orders by customer email
// @Description Get all orders for a specific customer email
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param email query string true "Customer Email" example:"john.doe@example.com"
// @Success 200 {array} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/by-customer [get]
func GetOrdersByCustomerEmail(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		email := c.Query("email")
		if email == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Email is required"})
			return
		}

		orders, err := service.FindByCustomerEmail(email, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OrderResponse, len(orders))
		for i, o := range orders {
			response[i] = toOrderResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get orders by status
// @Description Get all orders with a specific status
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param status query string true "Order Status" example:"pending"
// @Success 200 {array} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/by-status [get]
func GetOrdersByStatus(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		if status == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Status is required"})
			return
		}

		orders, err := service.FindByStatus(status, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OrderResponse, len(orders))
		for i, o := range orders {
			response[i] = toOrderResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Get orders by payment status
// @Description Get all orders with a specific payment status
// @Tags Order
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param status query string true "Payment Status" example:"unpaid"
// @Success 200 {array} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/by-payment-status [get]
func GetOrdersByPaymentStatus(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		status := c.Query("status")
		if status == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Status is required"})
			return
		}

		orders, err := service.FindByPaymentStatus(status, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		response := make([]OrderResponse, len(orders))
		for i, o := range orders {
			response[i] = toOrderResponse(&o)
		}

		c.JSON(http.StatusOK, response)
	}
}

// @Summary Update order status
// @Description Update an order's status and optionally send WhatsApp notification
// @Tags Order
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param id path int true "Order ID"
// @Param request body UpdateOrderStatusRequest true "Status Update Data"
// @Success 200 {object} OrderResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 404 {object} ErrorResponse "Order not found"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/{id}/status [put]
func UpdateOrderStatus(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid order ID"})
			return
		}

		var req UpdateOrderStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Validate status
		validStatuses := map[string]bool{
			"pending":            true,
			"confirmed":          true,
			"in_production":      true,
			"quality_check":      true,
			"ready_for_delivery": true,
			"delivered":          true,
			"cancelled":          true,
		}

		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid status value"})
			return
		}

		// Get existing order
		order, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{Error: "Order not found"})
			return
		}

		// Update status
		order.Status = req.Status

		// Update the order
		if err := service.Update(order, c); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		// Send WhatsApp notification if requested
		if err := sendWhatsAppNotification(order, req.Status, req.AdditionalMessage); err != nil {
			// Log the error but don't fail the request
			log.Printf("Failed to send WhatsApp notification: %v", err)
		}

		// Fetch the updated order
		updatedOrder, err := service.FindByID(id, c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to fetch updated order"})
			return
		}

		c.JSON(http.StatusOK, toOrderResponse(updatedOrder))
	}
}

func sendWhatsAppNotification(order *order.Order, status string, additionalMessage string) error {
	// Initialize WhatsApp client
	whatsappClient := whatsapp.NewClient()

	// Format additional message with order details
	detailedMessage := additionalMessage
	if additionalMessage == "" {
		detailedMessage = fmt.Sprintf("Total Amount: Rp %.2f", order.TotalAmount)
	}

	// If there are order items, add their details
	if len(order.OrderItems) > 0 {
		detailedMessage += "\n\nOrder Items:"
		for _, item := range order.OrderItems {
			detailedMessage += fmt.Sprintf("\n- %s (Qty: %d, Size: %s, Color: %s)",
				item.Product.Name,
				item.Quantity,
				item.Size,
				item.Color)
		}
	}

	// Get template name and parameters based on status
	templateName, params := getTemplateParams(order, status, detailedMessage)

	// Send message using template
	return whatsappClient.SendMessage(order.Customer.Phone, templateName, params)
}

func getTemplateParams(order *order.Order, status string, additionalMessage string) (string, []string) {
	// Map status to template name and parameters
	switch status {
	case "pending":
		return "order_pending", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "confirmed":
		return "order_confirmed", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "in_production":
		return "order_in_production", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "quality_check":
		return "order_quality_check", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "ready_for_delivery":
		return "order_ready", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "delivered":
		return "order_delivered", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	case "cancelled":
		return "order_cancelled", []string{
			order.Customer.Name,
			order.OrderNumber,
			additionalMessage,
		}
	default:
		return "order_status_update", []string{
			order.Customer.Name,
			order.OrderNumber,
			status,
			additionalMessage,
		}
	}
}

// @Summary Bulk update order statuses
// @Description Update multiple orders' statuses and optionally send WhatsApp notifications
// @Tags Order
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param X-Tenant-ID header string true "Tenant ID"
// @Param request body BulkUpdateOrderStatusRequest true "Bulk Status Update Data"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse "Invalid request parameters"
// @Failure 401 {object} ErrorResponse "Unauthorized"
// @Failure 403 {object} ErrorResponse "Forbidden"
// @Failure 500 {object} ErrorResponse "Internal server error"
// @Router /orders/bulk-status-update [put]
func BulkUpdateOrderStatus(service *application.OrderService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req BulkUpdateOrderStatusRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
			return
		}

		// Validate status
		validStatuses := map[string]bool{
			"pending":            true,
			"confirmed":          true,
			"in_production":      true,
			"quality_check":      true,
			"ready_for_delivery": true,
			"delivered":          true,
			"cancelled":          true,
		}

		if !validStatuses[req.Status] {
			c.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid status value"})
			return
		}

		// Process each order
		failedOrders := make([]int, 0)
		successCount := 0

		for _, orderID := range req.OrderIDs {
			// Get existing order
			order, err := service.FindByID(orderID, c)
			if err != nil {
				failedOrders = append(failedOrders, orderID)
				continue
			}

			// Update status
			order.Status = req.Status

			// Update the order
			if err := service.Update(order, c); err != nil {
				failedOrders = append(failedOrders, orderID)
				continue
			}

			// Send WhatsApp notification if requested
			if req.SendNotification {
				if err := sendWhatsAppNotification(order, req.Status, req.AdditionalMessage); err != nil {
					// Log the error but don't fail the request
					log.Printf("Failed to send WhatsApp notification for order %d: %v", orderID, err)
				}
			}

			successCount++
		}

		// Return response with success count and failed orders
		if len(failedOrders) > 0 {
			c.JSON(http.StatusOK, gin.H{
				"message":       fmt.Sprintf("Updated %d orders successfully", successCount),
				"failed_orders": failedOrders,
			})
		} else {
			c.JSON(http.StatusOK, SuccessResponse{Message: fmt.Sprintf("Updated %d orders successfully", successCount)})
		}
	}
}
