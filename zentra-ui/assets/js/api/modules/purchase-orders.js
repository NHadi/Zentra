import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const purchaseOrderAPI = {
    async getPurchaseOrders() {
        try {
            const response = await fetch(`${config.baseUrl}/purchase-orders`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch purchase orders');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get purchase orders error:', error);
            throw error;
        }
    },

    async getPurchaseOrder(id) {
        try {
            const response = await fetch(`${config.baseUrl}/purchase-orders/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch purchase order');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get purchase order error:', error);
            throw error;
        }
    },

    async createPurchaseOrder(purchaseOrderData) {
        try {
            const response = await fetch(`${config.baseUrl}/purchase-orders`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(purchaseOrderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create purchase order');
            }

            return await response.json();
        } catch (error) {
            console.error('Create purchase order error:', error);
            throw error;
        }
    },

    async updatePurchaseOrder(id, purchaseOrderData) {
        try {
            const response = await fetch(`${config.baseUrl}/purchase-orders/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(purchaseOrderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update purchase order');
            }

            return await response.json();
        } catch (error) {
            console.error('Update purchase order error:', error);
            throw error;
        }
    },

    async deletePurchaseOrder(id) {
        try {
            const response = await fetch(`${config.baseUrl}/purchase-orders/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete purchase order');
            }

            return true;
        } catch (error) {
            console.error('Delete purchase order error:', error);
            throw error;
        }
    }
}; 