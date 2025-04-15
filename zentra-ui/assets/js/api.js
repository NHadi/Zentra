// API client for zentra backend
(function() {
    // Get configuration from window object
    function getConfig() {
        console.log('Getting API configuration...');
        
        // Check for server-injected configuration
        if (window.APP_CONFIG) {
            console.log('[API] Using server-injected config:', window.APP_CONFIG);
            return window.APP_CONFIG;
        }

        // If no server config, detect environment and use defaults
        const environment = detectEnvironment();
        console.log('[API] No server config found, using environment:', environment);
        
        // Default configurations for each environment
        const configs = {
            local: {
                API_URL: 'http://localhost:8080',
                ESHOP_URL: 'http://localhost:3001',
                PGADMIN_URL: 'http://localhost:5050',
                ENVIRONMENT: 'local'
            },
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

        return configs[environment];
    }

    // Helper function to detect environment from URL
    function detectEnvironment() {
        const hostname = window.location.hostname;
        console.log('[API] Detecting environment from hostname:', hostname);
        
        // Check if running locally
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'local';
        }
        
        // Check environment based on subdomain
        if (hostname.includes('dev.')) {
            return 'development';
        } else if (hostname.includes('staging.')) {
            return 'staging';
        } else if (hostname === 'bisnisqu.badamigroups.com' || 
                   hostname === 'eshop.badamigroups.com' || 
                   hostname === 'zentra.badamigroups.com') {
            return 'production';
        }
        
        // Default to local if running from file or unknown host
        if (hostname === '' || hostname === 'file' || hostname.startsWith('192.168.')) {
            return 'local';
        }
        
        return 'local'; // Default to local if no match
    }

    // Initialize configuration
    const config = getConfig();
    console.log('[API] Using configuration:', config);

    // Get API URL from configuration
    function getApiUrl() {
        const baseUrl = config.API_URL;
        // Remove trailing slash if present
        return `${baseUrl.replace(/\/$/, '')}/api`;
    }

    function getEnvironment() {
        return config.ENVIRONMENT;
    }

    // Get headers for authenticated requests
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
            const apiUrl = getApiUrl();
            console.log('[API] Attempting login with API URL:', apiUrl);
            
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Environment': getEnvironment()
                },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || 'Login failed');
            }
            
            const data = await response.json();
            console.log('[API] Login response:', data);
            
            if (!data.token) {
                throw new Error('No token received from server');
            }
            
            // Store token
            localStorage.setItem('token', data.token);
            
            try {
                // Extract tenant_id from JWT token
                const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
                localStorage.setItem('tenant_id', tokenPayload.tenant_id);
            } catch (e) {
                console.warn('[API] Could not extract tenant_id from token:', e);
            }
            
            // Store user and menu data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('menus', JSON.stringify(data.menus || []));
            
            return data;
        } catch (error) {
            console.error('[API] Login error:', error);
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
        window.location.href = config.ESHOP_URL;
    }

    function navigateToPgAdmin() {
        window.location.href = config.PGADMIN_URL;
    }

    // Export the API functions to window.zentra
    window.zentra = {
        login,
        logout,
        getConfig: () => config,
        getApiUrl,
        getEnvironment,
        config: {
            environment: getEnvironment(),
            baseUrl: config.API_URL
        },
        getUsers,
        createUser,
        getMenusByRole,
        getAuditsByDateRange,
        getAuditsByEntity,
        getAuditsByTenant,
        navigateToEshop,
        navigateToPgAdmin
    };

    // Log the API initialization
    console.log('[API] zentra API initialized with config:', window.zentra.config);
    
    // Dispatch an event when initialization is complete
    window.dispatchEvent(new Event('zentraApiReady'));
})();