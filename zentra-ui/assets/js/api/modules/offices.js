import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const officeAPI = {
    async getOffices() {
        try {
            const response = await fetch(`${config.baseUrl}/offices`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch offices');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get offices error:', error);
            throw error;
        }
    },

    async createOffice(officeData) {
        try {
            const response = await fetch(`${config.baseUrl}/offices`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(officeData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create office');
            }

            return await response.json();
        } catch (error) {
            console.error('Create office error:', error);
            throw error;
        }
    },

    async updateOffice(officeId, officeData) {
        try {
            // Ensure officeId is properly handled
            const id = officeId?.id || officeId;
            
            const response = await fetch(`${config.baseUrl}/offices/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(officeData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update office');
            }

            return await response.json();
        } catch (error) {
            console.error('Update office error:', error);
            throw error;
        }
    },

    async deleteOffice(officeId) {
        try {
            const response = await fetch(`${config.baseUrl}/offices/${officeId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete office');
            }

            return true;
        } catch (error) {
            console.error('Delete office error:', error);
            throw error;
        }
    },

    async assignZone(officeId, zoneId) {
        try {
            const response = await fetch(`${config.baseUrl}/offices/${officeId}/zone`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ zone_id: zoneId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign zone to office');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign zone error:', error);
            throw error;
        }
    },

    async removeZone(officeId) {
        try {
            const response = await fetch(`${config.baseUrl}/offices/${officeId}/zone`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove zone from office');
            }

            return true;
        } catch (error) {
            console.error('Remove zone error:', error);
            throw error;
        }
    }
}; 