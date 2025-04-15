import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const productCategoryAPI = {
    async getProductCategories() {
        try {
            const response = await fetch(`${config.baseUrl}/product-categories`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch product categories');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get product categories error:', error);
            throw error;
        }
    },

    async createProductCategory(categoryData) {
        try {
            const response = await fetch(`${config.baseUrl}/product-categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: categoryData.name,
                    code: categoryData.code,
                    description: categoryData.description
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create product category');
            }

            return await response.json();
        } catch (error) {
            console.error('Create product category error:', error);
            throw error;
        }
    },

    async updateProductCategory(categoryId, categoryData) {
        try {
            const response = await fetch(`${config.baseUrl}/product-categories/${categoryId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: categoryData.name,
                    code: categoryData.code,
                    description: categoryData.description,
                    is_active: categoryData.is_active
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product category');
            }

            return await response.json();
        } catch (error) {
            console.error('Update product category error:', error);
            throw error;
        }
    },

    async deleteProductCategory(categoryId) {
        try {
            const response = await fetch(`${config.baseUrl}/product-categories/${categoryId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product category');
            }

            return true;
        } catch (error) {
            console.error('Delete product category error:', error);
            throw error;
        }
    }
}; 