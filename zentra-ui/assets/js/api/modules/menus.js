import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const menuAPI = {
    async getMenus() {
        try {
            const response = await fetch(`${config.baseUrl}/menus`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch menus');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get menus error:', error);
            throw error;
        }
    },

    async getMenusByRole(roleId) {
        try {
            const response = await fetch(`${config.baseUrl}/menus/by-role?role_id=${roleId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch menus');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get menus by role error:', error);
            throw error;
        }
    },

    async createMenu(menuData) {
        try {
            const response = await fetch(`${config.baseUrl}/menus`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(menuData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create menu');
            }

            return await response.json();
        } catch (error) {
            console.error('Create menu error:', error);
            throw error;
        }
    },

    async updateMenu(menuId, menuData) {
        try {
            const response = await fetch(`${config.baseUrl}/menus/${menuId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(menuData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update menu');
            }

            return await response.json();
        } catch (error) {
            console.error('Update menu error:', error);
            throw error;
        }
    },

    async deleteMenu(menuId) {
        try {
            const response = await fetch(`${config.baseUrl}/menus/${menuId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete menu');
            }

            return true;
        } catch (error) {
            console.error('Delete menu error:', error);
            throw error;
        }
    }
}; 