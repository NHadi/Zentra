// API client for zentra backend
(function() {
    // Get configuration from window object
    function getConfig() {
        if (window.APP_CONFIG) {
            return window.APP_CONFIG;
        }

        // Default configurations for each environment
        const configs = {
            development: {
                API_URL: 'https://dev.zentra.badamigroups.com',
                ESHOP_URL: 'https://dev.eshop.badamigroups.com',
                PGADMIN_URL: 'https://dev.pgadmin.badamigroups.com',
                ENVIRONMENT: 'development'
            },
            staging: {
                API_URL: 'https://staging.zentra.badamigroups.com',
                ESHOP_URL: 'https://staging.eshop.badamigroups.com',
                PGADMIN_URL: 'https://staging.pgadmin.badamigroups.com',
                ENVIRONMENT: 'staging'
            },
            production: {
                API_URL: 'https://zentra.badamigroups.com',
                ESHOP_URL: 'https://eshop.badamigroups.com',
                PGADMIN_URL: 'https://pgadmin.badamigroups.com',
                ENVIRONMENT: 'production'
            }
        };

        // Try to detect environment from URL
        const currentEnv = detectEnvironment() || 'development';
        return configs[currentEnv];
    }

    // Helper function to detect environment from URL
    function detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname.startsWith('dev.')) {
            return 'development';
        } else if (hostname.startsWith('staging.')) {
            return 'staging';
        } else if (hostname.match(/^(www\.)?(bisnisqu|eshop|zentra)\.badamigroups\.com$/)) {
            return 'production';
        }
        
        return 'development'; // Default to development
    }

    // Get API URL from configuration
    function getApiUrl() {
        const config = getConfig();
        return `${config.API_URL}/api`;
    }

    function getEnvironment() {
        return getConfig().ENVIRONMENT;
    }

    // Get headers for authenticated requests with environment info
    function getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
            'X-Environment': getEnvironment()
        };
    }

    // Authentication
    async function login(email, password) {
        try {
            const response = await fetch(`${getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Environment': getEnvironment()
                },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
            
            const data = await response.json();
            // Store token
            localStorage.setItem('token', data.token);
            
            // Extract tenant_id from JWT token
            const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
            localStorage.setItem('tenant_id', tokenPayload.tenant_id);
            
            // Store user and menu data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('menus', JSON.stringify(data.menus || []));
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Users
    async function getUsers(page = 1, size = 10) {
        try {
            const response = await fetch(`${getApiUrl()}/users?page=${page}&size=${size}`, {
                headers: getHeaders()
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
    }

    async function createUser(userData) {
        try {
            const response = await fetch(`${getApiUrl()}/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(userData),
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
    }

    // Menus
    async function getMenusByRole(roleId) {
        try {
            const response = await fetch(`${getApiUrl()}/menus/by-role?role_id=${roleId}`, {
                headers: getHeaders()
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
    }

    // Audits
    async function getAuditsByDateRange(startDate, endDate) {
        try {
            const response = await fetch(`${getApiUrl()}/audits/date-range?start_date=${startDate}&end_date=${endDate}`, {
                headers: getHeaders()
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
    }

    async function getAuditsByEntity(entityType, entityId) {
        try {
            const response = await fetch(`${getApiUrl()}/audits/entity/${entityType}/${entityId}`, {
                headers: getHeaders()
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
    }

    async function getAuditsByTenant(tenantId) {
        try {
            const response = await fetch(`${getApiUrl()}/audits/tenant/${tenantId}`, {
                headers: getHeaders()
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

    // Logout function
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('menus');
        localStorage.removeItem('tenant_id');
        window.location.href = '/login.html';
    }

    // Navigation helpers for multi-environment
    function navigateToEshop() {
        window.location.href = getConfig().ESHOP_URL;
    }

    function navigateToPgAdmin() {
        window.location.href = getConfig().PGADMIN_URL;
    }

    // Export the API functions
    window.zentra = {
        getConfig,
        getApiUrl,
        getEnvironment,
        login,
        getUsers,
        createUser,
        getMenusByRole,
        getAuditsByDateRange,
        getAuditsByEntity,
        getAuditsByTenant,
        logout,
        navigateToEshop,
        navigateToPgAdmin
    };
})();