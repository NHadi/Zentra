import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const pettyCashAPI = {
    async getPettyCashBudgets() {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch petty cash budgets');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get petty cash budgets error:', error);
            throw error;
        }
    },

    async getPettyCashBudget(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch petty cash budget');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get petty cash budget error:', error);
            throw error;
        }
    },

    async createPettyCashBudget(budgetData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(budgetData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create petty cash budget');
            }

            return await response.json();
        } catch (error) {
            console.error('Create petty cash budget error:', error);
            throw error;
        }
    },

    async updatePettyCashBudget(id, budgetData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(budgetData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update petty cash budget');
            }

            return await response.json();
        } catch (error) {
            console.error('Update petty cash budget error:', error);
            throw error;
        }
    },

    async deletePettyCashBudget(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete petty cash budget');
            }

            return true;
        } catch (error) {
            console.error('Delete petty cash budget error:', error);
            throw error;
        }
    },

    async getBudgetTransactions(budgetId) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${budgetId}/transactions`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch budget transactions');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get budget transactions error:', error);
            throw error;
        }
    },

    async createTransaction(budgetId, transactionData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${budgetId}/transactions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create transaction');
            }

            return await response.json();
        } catch (error) {
            console.error('Create transaction error:', error);
            throw error;
        }
    },

    async updateTransaction(budgetId, transactionId, transactionData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${budgetId}/transactions/${transactionId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(transactionData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update transaction');
            }

            return await response.json();
        } catch (error) {
            console.error('Update transaction error:', error);
            throw error;
        }
    },

    async deleteTransaction(budgetId, transactionId) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/${budgetId}/transactions/${transactionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete transaction');
            }

            return true;
        } catch (error) {
            console.error('Delete transaction error:', error);
            throw error;
        }
    },

    async getPettyCashSummary() {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash/summary`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch petty cash summary');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get petty cash summary error:', error);
            throw error;
        }
    }
}; 