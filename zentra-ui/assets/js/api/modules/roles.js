import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const roleAPI = {
    async getRoles() {
        try {
            const response = await fetch(`${config.baseUrl}/roles`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch roles');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get roles error:', error);
            throw error;
        }
    },

    async createRole(roleData) {
        try {
            const response = await fetch(`${config.baseUrl}/roles`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(roleData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create role');
            }

            return await response.json();
        } catch (error) {
            console.error('Create role error:', error);
            throw error;
        }
    },

    async updateRole(roleId, roleData) {
        try {
            const response = await fetch(`${config.baseUrl}/roles/${roleId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(roleData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update role');
            }

            return await response.json();
        } catch (error) {
            console.error('Update role error:', error);
            throw error;
        }
    },

    async deleteRole(roleId) {
        try {
            const response = await fetch(`${config.baseUrl}/roles/${roleId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete role');
            }

            return true;
        } catch (error) {
            console.error('Delete role error:', error);
            throw error;
        }
    },

    async assignPermissions(roleId, permissionIds) {
        try {
            const response = await fetch(`${config.baseUrl}/roles/${roleId}/permissions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ permission_ids: permissionIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign permissions');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign permissions error:', error);
            throw error;
        }
    },

    async removePermissions(roleId, permissionIds) {
        try {
            const response = await fetch(`${config.baseUrl}/roles/${roleId}/permissions`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ permission_ids: permissionIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove permissions');
            }

            return true;
        } catch (error) {
            console.error('Remove permissions error:', error);
            throw error;
        }
    }
}; 