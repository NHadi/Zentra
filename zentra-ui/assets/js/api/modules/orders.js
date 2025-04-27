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
            const response = await fetch(`${config.baseUrl}/orders`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
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
            const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
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

    async getOrdersByCustomer(customerEmail) {
        try {
            const response = await fetch(`${config.baseUrl}/orders/by-customer?email=${encodeURIComponent(customerEmail)}`, {
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
    }
}; 