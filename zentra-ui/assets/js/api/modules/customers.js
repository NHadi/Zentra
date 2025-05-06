import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const customerAPI = {
    async getCustomers() {
        try {
            const response = await fetch(`${config.baseUrl}/customers`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch customers');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get customers error:', error);
            throw error;
        }
    },

    async getCustomer(customerId) {
        try {
            const response = await fetch(`${config.baseUrl}/customers/${customerId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch customer');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get customer error:', error);
            throw error;
        }
    },

    async createCustomer(customerData) {
        try {
            const response = await fetch(`${config.baseUrl}/customers`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create customer');
            }

            return await response.json();
        } catch (error) {
            console.error('Create customer error:', error);
            throw error;
        }
    },

    async updateCustomer(customerId, customerData) {
        try {
            const response = await fetch(`${config.baseUrl}/customers/${customerId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update customer');
            }

            return await response.json();
        } catch (error) {
            console.error('Update customer error:', error);
            throw error;
        }
    },

    async deleteCustomer(customerId) {
        try {
            const response = await fetch(`${config.baseUrl}/customers/${customerId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete customer');
            }

            return true;
        } catch (error) {
            console.error('Delete customer error:', error);
            throw error;
        }
    },

    async findByEmail(email) {
        try {
            const response = await fetch(`${config.baseUrl}/customers/by-email?email=${encodeURIComponent(email)}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch customer by email');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Find customer by email error:', error);
            throw error;
        }
    }
}; 