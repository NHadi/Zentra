import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const regionAPI = {
    async getRegions() {
        try {
            const response = await fetch(`${config.baseUrl}/regions`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch regions');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get regions error:', error);
            throw error;
        }
    },

    async createRegion(regionData) {
        try {
            const response = await fetch(`${config.baseUrl}/regions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: regionData.name,
                    description: regionData.description,
                    tenant_id: regionData.tenant_id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create region');
            }

            return await response.json();
        } catch (error) {
            console.error('Create region error:', error);
            throw error;
        }
    },

    async updateRegion(regionId, regionData) {
        try {
            const response = await fetch(`${config.baseUrl}/regions/${regionId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: regionData.name,
                    description: regionData.description,
                    tenant_id: regionData.tenant_id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update region');
            }

            return await response.json();
        } catch (error) {
            console.error('Update region error:', error);
            throw error;
        }
    },

    async deleteRegion(regionId) {
        try {
            const response = await fetch(`${config.baseUrl}/regions/${regionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete region');
            }

            return true;
        } catch (error) {
            console.error('Delete region error:', error);
            throw error;
        }
    },

    async assignZones(regionId, zoneIds) {
        try {
            const response = await fetch(`${config.baseUrl}/regions/${regionId}/zones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ zone_ids: zoneIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign zones to region');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign zones error:', error);
            throw error;
        }
    },

    async removeZones(regionId, zoneIds) {
        try {
            const response = await fetch(`${config.baseUrl}/regions/${regionId}/zones`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ zone_ids: zoneIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove zones from region');
            }

            return true;
        } catch (error) {
            console.error('Remove zones error:', error);
            throw error;
        }
    }
}; 