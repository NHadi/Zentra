import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const stockOpnameAPI = {
    async getStockOpnames() {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch stock opnames');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get stock opnames error:', error);
            throw error;
        }
    },

    async createStockOpname(opnameData) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(opnameData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create stock opname');
            }

            return await response.json();
        } catch (error) {
            console.error('Create stock opname error:', error);
            throw error;
        }
    },

    async updateStockOpname(opnameId, opnameData) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames/${opnameId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(opnameData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update stock opname');
            }

            return await response.json();
        } catch (error) {
            console.error('Update stock opname error:', error);
            throw error;
        }
    },

    async deleteStockOpname(opnameId) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames/${opnameId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete stock opname');
            }

            return true;
        } catch (error) {
            console.error('Delete stock opname error:', error);
            throw error;
        }
    },

    async updateStockOpnameStatus(opnameId, status) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames/${opnameId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update stock opname status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update stock opname status error:', error);
            throw error;
        }
    },

    async cancelStockOpname(opnameId) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames/${opnameId}/cancel`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to cancel stock opname');
            }

            return await response.json();
        } catch (error) {
            console.error('Cancel stock opname error:', error);
            throw error;
        }
    },

    async getStockOpnameReport(opnameId) {
        try {
            const response = await fetch(`${config.baseUrl}/stock-opnames/${opnameId}/report`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get stock opname report');
            }

            return await response.blob();
        } catch (error) {
            console.error('Get stock opname report error:', error);
            throw error;
        }
    }
}; 