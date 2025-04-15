import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const auditAPI = {
    async getAuditsByDateRange(startDate, endDate) {
        try {
            const response = await fetch(`${config.baseUrl}/audits/date-range?start_date=${startDate}&end_date=${endDate}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch audit data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get audit data error:', error);
            throw error;
        }
    },

    async getAuditsByEntity(entityType, entityId) {
        try {
            const response = await fetch(`${config.baseUrl}/audits/entity/${entityType}/${entityId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch entity audit data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get entity audit data error:', error);
            throw error;
        }
    },

    async getAuditsByTenant(tenantId) {
        try {
            const response = await fetch(`${config.baseUrl}/audits/tenant/${tenantId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch tenant audit data');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get tenant audit data error:', error);
            throw error;
        }
    }
}; 