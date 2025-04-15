import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const cashFlowAPI = {
    async getCashFlows() {
        try {
            const response = await fetch(`${config.baseUrl}/cash-flows`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch cash flows');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get cash flows error:', error);
            throw error;
        }
    },

    async createCashFlow(cashFlowData) {
        try {
            const response = await fetch(`${config.baseUrl}/cash-flows`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(cashFlowData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create cash flow');
            }

            return await response.json();
        } catch (error) {
            console.error('Create cash flow error:', error);
            throw error;
        }
    },

    async updateCashFlow(cashFlowId, cashFlowData) {
        try {
            const response = await fetch(`${config.baseUrl}/cash-flows/${cashFlowId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(cashFlowData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update cash flow');
            }

            return await response.json();
        } catch (error) {
            console.error('Update cash flow error:', error);
            throw error;
        }
    },

    async deleteCashFlow(cashFlowId) {
        try {
            const response = await fetch(`${config.baseUrl}/cash-flows/${cashFlowId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete cash flow');
            }

            return true;
        } catch (error) {
            console.error('Delete cash flow error:', error);
            throw error;
        }
    }
}; 