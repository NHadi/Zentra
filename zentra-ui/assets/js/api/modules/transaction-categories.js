import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const transactionCategoryAPI = {
    async getTransactionCategories() {
        try {
            const response = await fetch(`${config.baseUrl}/transaction-categories`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch transaction categories');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get transaction categories error:', error);
            throw error;
        }
    },

    async getTransactionCategory(id) {
        try {
            const response = await fetch(`${config.baseUrl}/transaction-categories/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch transaction category');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get transaction category error:', error);
            throw error;
        }
    },

    async createTransactionCategory(categoryData) {
        try {
            const response = await fetch(`${config.baseUrl}/transaction-categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create transaction category');
            }

            return await response.json();
        } catch (error) {
            console.error('Create transaction category error:', error);
            throw error;
        }
    },

    async updateTransactionCategory(id, categoryData) {
        try {
            const response = await fetch(`${config.baseUrl}/transaction-categories/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(categoryData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update transaction category');
            }

            return await response.json();
        } catch (error) {
            console.error('Update transaction category error:', error);
            throw error;
        }
    },

    async deleteTransactionCategory(id) {
        try {
            const response = await fetch(`${config.baseUrl}/transaction-categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction category');
            }

            return true;
        } catch (error) {
            console.error('Delete transaction category error:', error);
            throw error;
        }
    }
}; 