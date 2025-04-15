import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const backupAPI = {
    async getBackups() {
        try {
            const response = await fetch(`${config.baseUrl}/backups`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch backups');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get backups error:', error);
            throw error;
        }
    },

    async createBackup() {
        try {
            const response = await fetch(`${config.baseUrl}/backups`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create backup');
            }

            return await response.json();
        } catch (error) {
            console.error('Create backup error:', error);
            throw error;
        }
    },

    async restoreBackup(backupId) {
        try {
            const response = await fetch(`${config.baseUrl}/backups/${backupId}/restore`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to restore backup');
            }

            return await response.json();
        } catch (error) {
            console.error('Restore backup error:', error);
            throw error;
        }
    },

    async deleteBackup(backupId) {
        try {
            const response = await fetch(`${config.baseUrl}/backups/${backupId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete backup');
            }

            return true;
        } catch (error) {
            console.error('Delete backup error:', error);
            throw error;
        }
    }
}; 