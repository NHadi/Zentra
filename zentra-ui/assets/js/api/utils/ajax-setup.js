// Global AJAX setup for handling authentication and errors
$.ajaxSetup({
    beforeSend: function(xhr) {
        // Add auth token to all requests
        const token = localStorage.getItem('token');
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        // Add tenant ID if available
        const tenantId = localStorage.getItem('tenant_id');
        if (tenantId) {
            xhr.setRequestHeader('X-Tenant-ID', tenantId);
        }
    },
    error: function(xhr, status, error) {
        if (xhr.status === 401) {
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('menus');
            localStorage.removeItem('tenant_id');
            
            // Alert the user
            alert('Session expired. Please log in again.');
            
            // Redirect to login
            window.location.href = '/login.html';
        } else if (xhr.status === 403) {
            alert('Access denied.');
        } else if (xhr.status >= 500) {
            alert('Server error. Please try again later.');
        }
    }
});

// Add global fetch interceptor
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    // Add auth headers if not already present
    if (args[1] && args[1].headers) {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant_id');
        
        if (token && !args[1].headers['Authorization']) {
            args[1].headers['Authorization'] = `Bearer ${token}`;
        }
        if (tenantId && !args[1].headers['X-Tenant-ID']) {
            args[1].headers['X-Tenant-ID'] = tenantId;
        }
    }
    
    try {
        const response = await originalFetch.apply(this, args);
        if (response.status === 401) {
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('menus');
            localStorage.removeItem('tenant_id');
            
            // Alert the user
            alert('Session expired. Please log in again.');
            
            // Redirect to login
            window.location.href = '/login.html';
            return Promise.reject(new Error('Session expired'));
        }
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}; 