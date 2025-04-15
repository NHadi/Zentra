import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const supplierAPI = {
    async getSuppliers() {
        try {
            const response = await fetch(`${config.baseUrl}/suppliers`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch suppliers');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get suppliers error:', error);
            throw error;
        }
    },

    async createSupplier(supplierData) {
        try {
            const response = await fetch(`${config.baseUrl}/suppliers`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(supplierData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create supplier');
            }

            return await response.json();
        } catch (error) {
            console.error('Create supplier error:', error);
            throw error;
        }
    },

    async updateSupplier(supplierId, supplierData) {
        try {
            const response = await fetch(`${config.baseUrl}/suppliers/${supplierId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(supplierData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update supplier');
            }

            return await response.json();
        } catch (error) {
            console.error('Update supplier error:', error);
            throw error;
        }
    },

    async deleteSupplier(supplierId) {
        try {
            const response = await fetch(`${config.baseUrl}/suppliers/${supplierId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete supplier');
            }

            return true;
        } catch (error) {
            console.error('Delete supplier error:', error);
            throw error;
        }
    }
}; 