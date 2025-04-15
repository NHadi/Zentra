import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const productAPI = {
    async getProducts() {
        try {
            const response = await fetch(`${config.baseUrl}/products`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch products');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get products error:', error);
            throw error;
        }
    },

    async createProduct(productData) {
        try {
            // Get category_id from either direct field or category object
            const category_id = productData.category_id || (productData.category && productData.category.id);
            if (!category_id) {
                throw new Error('Category is required');
            }

            // Convert form data to JSON
            const jsonData = {
                name: productData.name,
                code: productData.code,
                category_id: parseInt(category_id),
                description: productData.description || '',
                material: productData.material || '',
                size_available: Array.isArray(productData.size_available) ? productData.size_available : [],
                color_options: Array.isArray(productData.color_options) ? productData.color_options : [],
                customization_options: {
                    name: Boolean(productData.customization_options?.name),
                    number: Boolean(productData.customization_options?.number),
                    patches: Boolean(productData.customization_options?.patches),
                    team_logo: Boolean(productData.customization_options?.team_logo)
                },
                production_time: parseInt(productData.production_time) || 1,
                min_order_quantity: parseInt(productData.min_order_quantity) || 1,
                base_price: parseFloat(productData.base_price) || 0,
                bulk_discount_rules: {
                    10: parseInt(productData.bulk_discount_rules?.['10']) || 0,
                    20: parseInt(productData.bulk_discount_rules?.['20']) || 0,
                    50: parseInt(productData.bulk_discount_rules?.['50']) || 0
                },
                weight: parseInt(productData.weight) || 0,
                is_active: Boolean(productData.is_active),
                stock_status: productData.stock_status || 'in_stock'
            };

            console.log('Creating product with data:', jsonData);

            const response = await fetch(`${config.baseUrl}/products`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create product');
            }

            const result = await response.json();

            // If there are pending images, upload them after product creation
            if (productData.images && productData.images.length > 0) {
                for (const image of productData.images) {
                    await this.uploadProductImage(result.id, image);
                }
            }

            return result;
        } catch (error) {
            console.error('Create product error:', error);
            throw error;
        }
    },

    async updateProduct(productId, productData) {
        try {
            // Get category_id from either direct field or category object
            const category_id = productData.category_id || (productData.category && productData.category.id);
            
            // Convert form data to JSON
            const jsonData = {
                name: productData.name,
                code: productData.code,
                category_id: category_id ? parseInt(category_id) : undefined,
                description: productData.description || '',
                material: productData.material || '',
                size_available: Array.isArray(productData.size_available) ? productData.size_available : [],
                color_options: Array.isArray(productData.color_options) ? productData.color_options : [],
                customization_options: {
                    name: Boolean(productData.customization_options?.name),
                    number: Boolean(productData.customization_options?.number),
                    patches: Boolean(productData.customization_options?.patches),
                    team_logo: Boolean(productData.customization_options?.team_logo)
                },
                production_time: parseInt(productData.production_time) || 1,
                min_order_quantity: parseInt(productData.min_order_quantity) || 1,
                base_price: parseFloat(productData.base_price) || 0,
                bulk_discount_rules: {
                    10: parseInt(productData.bulk_discount_rules?.['10']) || 0,
                    20: parseInt(productData.bulk_discount_rules?.['20']) || 0,
                    50: parseInt(productData.bulk_discount_rules?.['50']) || 0
                },
                weight: parseInt(productData.weight) || 0,
                is_active: Boolean(productData.is_active),
                stock_status: productData.stock_status || 'in_stock'
            };
        
            console.log('Updating product with data:', jsonData);
        
            const response = await fetch(`${config.baseUrl}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
        
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update product');
            }
        
            const result = await response.json();
        
            // If there are pending images, upload them after product update
            if (productData.images && productData.images.length > 0) {
                for (const image of productData.images) {
                    // Only upload new images (those that are File objects, not URLs)
                    if (image instanceof File) {
                        await this.uploadProductImage(result.id, image);
                    }
                }
            }
        
            return result;
        } catch (error) {
            console.error('Update product error:', error);
            throw error;
        }
    },

    async deleteProduct(productId) {
        try {
            const response = await fetch(`${config.baseUrl}/products/${productId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product');
            }

            return true;
        } catch (error) {
            console.error('Delete product error:', error);
            throw error;
        }
    },

    async deleteProductImage(productId, imageId) {
        try {
            const response = await fetch(`${config.baseUrl}/products/${productId}/images/${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete product image');
            }

            return true;
        } catch (error) {
            console.error('Delete product image error:', error);
            throw error;
        }
    },

    async uploadProductImage(productId, file) {
        try {
            console.log('Uploading file to product:', productId, file);
            
            // Create new FormData and append the file
            const formData = new FormData();
            formData.append('image', file, file.name); // Add filename as third parameter
            
            console.log('FormData created:', formData);
            console.log('File in FormData:', formData.get('image'));

            // Get token and tenant ID directly
            const token = localStorage.getItem('token');
            const tenantId = localStorage.getItem('tenant_id');

            const response = await fetch(`${config.baseUrl}/products/${productId}/images`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenantId
                    // Let the browser set the Content-Type header with boundary
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload product image');
            }

            return await response.json();
        } catch (error) {
            console.error('Upload product image error:', error);
            throw error;
        }
    },

    async getCategories() {
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
    }
};