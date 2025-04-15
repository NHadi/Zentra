import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const workOrderAPI = {
    async getWorkOrders() {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch work orders');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get work orders error:', error);
            throw error;
        }
    },

    async getWorkOrder(id) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch work order');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get work order error:', error);
            throw error;
        }
    },

    async createWorkOrder(workOrderData) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(workOrderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create work order');
            }

            return await response.json();
        } catch (error) {
            console.error('Create work order error:', error);
            throw error;
        }
    },

    async updateWorkOrder(id, workOrderData) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(workOrderData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update work order');
            }

            return await response.json();
        } catch (error) {
            console.error('Update work order error:', error);
            throw error;
        }
    },

    async deleteWorkOrder(id) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete work order');
            }

            return true;
        } catch (error) {
            console.error('Delete work order error:', error);
            throw error;
        }
    },

    async getWorkOrderTasks(id) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders/${id}/tasks`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch work order tasks');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get work order tasks error:', error);
            throw error;
        }
    },

    async getWorkOrderItems(id) {
        try {
            const response = await fetch(`${config.baseUrl}/work-orders/${id}/items`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch work order items');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get work order items error:', error);
            throw error;
        }
    }
}; 