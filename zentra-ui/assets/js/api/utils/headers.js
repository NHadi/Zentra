// Header management utilities
export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId
    };
} 