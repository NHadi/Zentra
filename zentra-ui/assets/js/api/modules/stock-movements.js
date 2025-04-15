import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const stockMovementAPI = {
    async getStockMovements() {
        try {
            const response = await fetch(`${config.baseUrl}/stock-movements`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch stock movements');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get stock movements error:', error);
            throw error;
        }
    },

    async createStockMovement(movementData) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-movements`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(movementData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create stock movement');
            }

            return await response.json();
        } catch (error) {
            console.error('Create stock movement error:', error);
            throw error;
        }
    },

    async updateStockMovement(movementId, movementData) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-movements/${movementId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(movementData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update stock movement');
            }

            return await response.json();
        } catch (error) {
            console.error('Update stock movement error:', error);
            throw error;
        }
    },

    async deleteStockMovement(movementId) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-movements/${movementId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete stock movement');
            }

            return true;
        } catch (error) {
            console.error('Delete stock movement error:', error);
            throw error;
        }
    },

    async getStockMovementReport(movementId) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-movements/${movementId}/report`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get stock movement report');
            }

            return await response.blob();
        } catch (error) {
            console.error('Get stock movement report error:', error);
            throw error;
        }
    }
}; 