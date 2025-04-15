import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const userAPI = {
    async getUsers() {
        try {
            const response = await fetch(`${config.baseUrl}/users`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch users');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    },

    async createUser(userData) {
        try {
            const response = await fetch(`${config.baseUrl}/users`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    role_id: userData.role_id,
                    tenant_id: userData.tenant_id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }

            return await response.json();
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    },

    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${config.baseUrl}/users/${userId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password, // Only included if changing password
                    role_id: userData.role_id,
                    tenant_id: userData.tenant_id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update user');
            }

            return await response.json();
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    },

    async deleteUser(userId) {
        try {
            const response = await fetch(`${config.baseUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete user');
            }

            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }
}; 