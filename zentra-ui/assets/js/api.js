// API client for zentra backend
(function() {
    let config = null;
    let configReady = false;
    let configListeners = [];

    // Function to notify listeners when config is ready
    function notifyConfigReady() {
        configListeners.forEach(callback => callback(config));
        configListeners = [];
    }

    // Function to wait for config to be ready
    function waitForConfig() {
        return new Promise((resolve) => {
            if (configReady) {
                resolve(config);
            } else {
                configListeners.push(resolve);
            }
        });
    }

    // Get configuration from window object
    function getConfig() {
        // console.log('[API] Getting API configuration...');
        // console.log('[API] Window.APP_CONFIG:', window.APP_CONFIG);
        
        // Check for server-injected configuration
        if (window.APP_CONFIG) {
            // console.log('[API] Using server-injected config:', window.APP_CONFIG);
            return window.APP_CONFIG;
        }

        // If no server config, detect environment and use defaults
        const environment = detectEnvironment();
        // console.log('[API] No server config found, using environment:', environment);
        
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

        const selectedConfig = configs[environment];
        // console.log('[API] Selected configuration:', selectedConfig);
        return selectedConfig;
    }

    // Initialize configuration
    function initializeConfig() {
        // console.log('[API] Initializing configuration...');
        config = getConfig();
        configReady = true;
        // console.log('[API] Configuration initialized:', config);
        notifyConfigReady();
    }

    // Helper function to detect environment from URL
    function detectEnvironment() {
        const hostname = window.location.hostname;
        // console.log('[API] Detecting environment from hostname:', hostname);
        
        // Check for staging environment first
        if (hostname.includes('staging.')) {
            // console.log('[API] Detected staging environment');
            return 'staging';
        }
        
        // Check for development environment
        if (hostname.includes('dev.')) {
            // console.log('[API] Detected development environment');
            return 'development';
        }
        
        // Check if running locally
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // console.log('[API] Detected local environment');
            return 'local';
        }
        
        // Check for production environment
        if (hostname === 'bisnisqu.badamigroups.com' || 
            hostname === 'eshop.badamigroups.com' || 
            hostname === 'zentra.badamigroups.com') {
            // console.log('[API] Detected production environment');
            return 'production';
        }
        
        // Default to local if running from file or unknown host
        if (hostname === '' || hostname === 'file' || hostname.startsWith('192.168.')) {
            // console.log('[API] Defaulting to local environment');
            return 'local';
        }
        
        // If no match found, try to detect from window.APP_CONFIG
        if (window.APP_CONFIG && window.APP_CONFIG.ENVIRONMENT) {
            // console.log('[API] Using environment from window.APP_CONFIG:', window.APP_CONFIG.ENVIRONMENT);
            return window.APP_CONFIG.ENVIRONMENT;
        }
        
        // console.log('[API] No environment match found, defaulting to local');
        return 'local';
    }

    // Get API URL from configuration
    async function getApiUrl() {
        if (!configReady) {
            // console.log('[API] Waiting for configuration to be ready...');
            await waitForConfig();
        }
        const baseUrl = config.API_URL;
        const apiUrl = `${baseUrl.replace(/\/$/, '')}/api`;
        // console.log('[API] Generated API URL:', apiUrl);
        return apiUrl;
    }

    async function getEnvironment() {
        if (!configReady) {
            // console.log('[API] Waiting for configuration to be ready...');
            await waitForConfig();
        }
        const env = config.ENVIRONMENT;
        // console.log('[API] Current environment:', env);
        return env;
    }

    // Get headers for authenticated requests
    async function getHeaders() {
        if (!configReady) {
            // console.log('[API] Waiting for configuration to be ready...');
            await waitForConfig();
        }
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenant_id');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Tenant-ID': tenantId || '',
            'X-Environment': await getEnvironment(),
            'Origin': window.location.origin
        };
        // console.log('[API] Generated headers:', headers);
        return headers;
    }

    // Generic fetch wrapper with credentials
    async function fetchWithCredentials(url, options = {}) {
        if (!configReady) {
            // console.log('[API] Waiting for configuration to be ready...');
            await waitForConfig();
        }
        
        const apiUrl = await getApiUrl();
        const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
        
        // console.log('[API] Making request to:', fullUrl);
        // console.log('[API] Request options:', options);
        // console.log('[API] Request headers:', await getHeaders());
        
        try {
            const response = await fetch(fullUrl, {
                ...options,
                credentials: 'include',
                headers: {
                    ...(await getHeaders()),
                    ...(options.headers || {})
                }
            });
            
            // console.log('[API] Response status:', response.status);
            // console.log('[API] Response headers:', Object.fromEntries(response.headers.entries()));
            
            return response;
        } catch (error) {
            console.error('[API] Request failed:', error);
            throw error;
        }
    }

    // Initialize configuration when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeConfig);
    } else {
        initializeConfig();
    }

    // Authentication
    async function login(email, password) {
        try {
            const apiUrl = await getApiUrl();
            // console.log('[API] Attempting login with API URL:', apiUrl);
            
            const response = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Environment': await getEnvironment()
                },
                body: JSON.stringify({ email, password }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || error.error || 'Login failed');
            }
            
            const data = await response.json();
            // console.log('[API] Login response:', data); 
            
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
                // console.warn('[API] Could not extract tenant_id from token:', e);
            }
            
            // Store user and menu data
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('menus', JSON.stringify(data.menus || []));
            
            return data;
        } catch (error) {
            // console.error('[API] Login error:', error);
            throw error;
        }
    }

    // Users
    async function getUsers(page = 1, size = 10) {
        try {
            const response = await fetchWithCredentials(`${await getApiUrl()}/users?page=${page}&size=${size}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch users');
            }
            
            return await response.json();
        } catch (error) {
            // console.error('Get users error:', error);
            throw error;
        }
    }

    async function createUser(userData) {
        try {
            const response = await fetchWithCredentials(`${await getApiUrl()}/users`, {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create user');
            }
            
            return await response.json();
        } catch (error) {
            // console.error('Create user error:', error);
            throw error;
        }
    }

    // Menus
    async function getMenusByRole(roleId) {
        try {
            const response = await fetchWithCredentials(`${await getApiUrl()}/menus/by-role?role_id=${roleId}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch menus');
            }
            
            return await response.json();
        } catch (error) {
            // console.error('Get menus error:', error);
            throw error;
        }
    }

    // Audits
    async function getAuditsByDateRange(startDate, endDate) {
        try {
            const response = await fetch(`${await getApiUrl()}/audits/date-range?start_date=${startDate}&end_date=${endDate}`, {
                headers: await getHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch audit data');
            }
            
            return await response.json();
        } catch (error) {
            // console.error('Get audit data error:', error);
            throw error;
        }
    }

    async function getAuditsByEntity(entityType, entityId) {
        try {
            const response = await fetch(`${await getApiUrl()}/audits/entity/${entityType}/${entityId}`, {
                headers: await getHeaders()
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
            const response = await fetch(`${await getApiUrl()}/audits/tenant/${tenantId}`, {
                headers: await getHeaders()
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
            baseUrl: config?.API_URL
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
    // console.log('[API] zentra API initialized');
    
    // Dispatch an event when initialization is complete
    window.dispatchEvent(new Event('zentraApiReady'));
})();