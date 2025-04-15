import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const paymentAPI = {
    async getPayments() {
        try {
            const response = await fetch(`${config.baseUrl}/payments`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch payments');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get payments error:', error);
            throw error;
        }
    },

    async createPayment(paymentData) {
        try {
            const response = await fetch(`${config.baseUrl}/payments`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create payment');
            }

            return await response.json();
        } catch (error) {
            console.error('Create payment error:', error);
            throw error;
        }
    },

    async updatePayment(paymentId, paymentData) {
        try {
            const response = await fetch(`${config.baseUrl}/payments/${paymentId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update payment');
            }

            return await response.json();
        } catch (error) {
            console.error('Update payment error:', error);
            throw error;
        }
    },

    async deletePayment(paymentId) {
        try {
            const response = await fetch(`${config.baseUrl}/payments/${paymentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete payment');
            }

            return true;
        } catch (error) {
            console.error('Delete payment error:', error);
            throw error;
        }
    }
}; 