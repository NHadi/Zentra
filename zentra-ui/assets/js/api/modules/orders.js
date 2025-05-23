import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const orderAPI = {
    async getOrders() {
        try {
            const response = await fetch(`${config.baseUrl}/orders`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch orders');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get orders error:', error);
            throw error;
        }
    },

    async getOrder(orderId) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch order');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get order error:', error);
            throw error;
        }
    },

    async createOrder(orderData) {
        try {
            // Extract order items from the request
            const { OrderItems, Label, ...orderRequest } = orderData;

            // Ensure all required fields are present and properly formatted
            const createOrderRequest = {
                order_number: orderRequest.OrderNumber,
                customer_id: orderRequest.CustomerID,
                office_id: orderRequest.OfficeID,
                expected_delivery_date: orderRequest.ExpectedDeliveryDate,
                subtotal: Number(orderRequest.Subtotal),
                discount_amount: Number(orderRequest.DiscountAmount),
                total_amount: Number(orderRequest.TotalAmount),
                status: orderRequest.Status || 'pending',
                payment_status: orderRequest.PaymentStatus || 'unpaid',
                notes: orderRequest.Notes,
                order_items: OrderItems.map(item => ({
                    product_id: item.ProductID,
                    quantity: item.Quantity,
                    size: item.Size,
                    color: item.Color,
                    unit_price: Number(item.UnitPrice),
                    original_subtotal: Number(item.Total),
                    final_subtotal: Number(item.Total),
                    customization: item.Customization || {},
                    production_status: 'pending'
                }))
            };
            if (Label) {
                createOrderRequest.label = Label;
            }

            console.log('Sending order request:', createOrderRequest);

            const response = await fetch(`${config.baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(createOrderRequest)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create order');
            }

            return await response.json();
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    },

    async updateOrder(orderId, orderData) {
        try {
            // Convert to snake_case for backend
            const updateOrderRequest = {
                customer_id: orderData.CustomerID,
                office_id: orderData.OfficeID,
                subtotal: Number(orderData.Subtotal),
                discount_amount: Number(orderData.DiscountAmount),
                total_amount: Number(orderData.TotalAmount),
                status: orderData.Status,
                payment_status: orderData.PaymentStatus,
                expected_delivery_date: orderData.ExpectedDeliveryDate,
                notes: orderData.Notes
            };
            if (orderData.Label) {
                updateOrderRequest.label = orderData.Label;
            }

            const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateOrderRequest)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update order');
            }

            return await response.json();
        } catch (error) {
            console.error('Update order error:', error);
            throw error;
        }
    },

    async deleteOrder(orderId) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete order');
            }

            return true;
        } catch (error) {
            console.error('Delete order error:', error);
            throw error;
        }
    },

    async updateOrderStatus(orderId, statusData) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(statusData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update order status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update order status error:', error);
            throw error;
        }
    },

    async bulkUpdateOrderStatus(orderIds, statusData) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/bulk-status-update`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_ids: orderIds,
                    ...statusData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to bulk update order status');
            }

            return await response.json();
        } catch (error) {
            console.error('Bulk update order status error:', error);
            throw error;
        }
    },

    async updatePaymentStatus(orderId, paymentStatus) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/${orderId}/payment-status`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ payment_status: paymentStatus })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update payment status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update payment status error:', error);
            throw error;
        }
    },

    async getOrdersByCustomer(customerId) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/by-customer/${customerId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch customer orders');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get customer orders error:', error);
            throw error;
        }
    },

    async getOrdersByStatus(status) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/by-status?status=${encodeURIComponent(status)}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch orders by status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get orders by status error:', error);
            throw error;
        }
    },

    async getOrdersByPaymentStatus(paymentStatus) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/by-payment-status?status=${encodeURIComponent(paymentStatus)}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch orders by payment status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get orders by payment status error:', error);
            throw error;
        }
    },

    async processPayment(paymentData) {
        try {
            // Convert to snake_case for backend
            const paymentRequest = {
                order_id: paymentData.OrderID,
                amount: Number(paymentData.Amount),
                payment_method: paymentData.PaymentMethod,
                reference_number: paymentData.ReferenceNumber,
                payment_date: paymentData.PaymentDate,
                status: "completed",
                notes: paymentData.Notes
            };

            const response = await fetch(`${config.baseUrl}/orders/${paymentData.OrderID}/payments`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentRequest)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to process payment');
            }

            return await response.json();
        } catch (error) {
            console.error('Process payment error:', error);
            throw error;
        }
    }
}; 