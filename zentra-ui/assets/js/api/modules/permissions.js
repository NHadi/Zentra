import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const permissionAPI = {
    async getPermissions() {
        try {
            const response = await fetch(`${config.baseUrl}/permissions`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch permissions');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get permissions error:', error);
            throw error;
        }
    },

    async getPermission(id) {
        try {
            const response = await fetch(`${config.baseUrl}/permissions/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch permission');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get permission error:', error);
            throw error;
        }
    },

    async createPermission(permissionData) {
        try {
            // Get tenant_id from localStorage
            const tenantId = localStorage.getItem('tenant_id');
            if (!tenantId) {
                throw new Error('Tenant ID not found');
            }

            const response = await fetch(`${config.baseUrl}/permissions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...permissionData,
                    tenant_id: parseInt(tenantId)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create permission');
            }

            return await response.json();
        } catch (error) {
            console.error('Create permission error:', error);
            throw error;
        }
    },

    async updatePermission(id, permissionData) {
        try {
            // Get tenant_id from localStorage
            const tenantId = localStorage.getItem('tenant_id');
            if (!tenantId) {
                throw new Error('Tenant ID not found');
            }

            const response = await fetch(`${config.baseUrl}/permissions/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...permissionData,
                    tenant_id: parseInt(tenantId)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update permission');
            }

            return await response.json();
        } catch (error) {
            console.error('Update permission error:', error);
            throw error;
        }
    },

    async deletePermission(id) {
        try {
            const response = await fetch(`${config.baseUrl}/permissions/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete permission');
            }

            return true;
        } catch (error) {
            console.error('Delete permission error:', error);
            throw error;
        }
    }
}; 