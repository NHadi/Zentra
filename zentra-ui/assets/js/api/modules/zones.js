import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const zoneAPI = {
    async getZones() {
        try {
            const response = await fetch(`${config.baseUrl}/zones`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch zones');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get zones error:', error);
            throw error;
        }
    },

    // Helper method to get unique regions from zones
    getUniqueRegions(zones) {
        const regionMap = new Map();
        zones.forEach(zone => {
            if (zone.region && !regionMap.has(zone.region.id)) {
                regionMap.set(zone.region.id, zone.region);
            }
        });
        return Array.from(regionMap.values());
    },

    // Helper method to get zones by region
    getZonesByRegion(zones, regionId) {
        return zones.filter(zone => zone.region_id === regionId);
    },

    // Helper method to get zone with region name
    getZoneWithRegionName(zone) {
        return {
            ...zone,
            regionName: zone.region ? zone.region.name : 'No Region'
        };
    },

    async createZone(zoneData) {
        try {
            const response = await fetch(`${config.baseUrl}/zones`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(zoneData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create zone');
            }

            return await response.json();
        } catch (error) {
            console.error('Create zone error:', error);
            throw error;
        }
    },

    async updateZone(zoneId, zoneData) {
        try {
            const response = await fetch(`${config.baseUrl}/zones/${zoneId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(zoneData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update zone');
            }

            return await response.json();
        } catch (error) {
            console.error('Update zone error:', error);
            throw error;
        }
    },

    async deleteZone(zoneId) {
        try {
            const response = await fetch(`${config.baseUrl}/zones/${zoneId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete zone');
            }

            return true;
        } catch (error) {
            console.error('Delete zone error:', error);
            throw error;
        }
    },

    async assignOffices(zoneId, officeIds) {
        try {
            const response = await fetch(`${config.baseUrl}/zones/${zoneId}/offices`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ office_ids: officeIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign offices to zone');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign offices error:', error);
            throw error;
        }
    },

    async removeOffices(zoneId, officeIds) {
        try {
            const response = await fetch(`${config.baseUrl}/zones/${zoneId}/offices`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ office_ids: officeIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove offices from zone');
            }

            return true;
        } catch (error) {
            console.error('Remove offices error:', error);
            throw error;
        }
    },

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
    }
}; 