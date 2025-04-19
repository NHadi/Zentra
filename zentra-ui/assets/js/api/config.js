// API Configuration

// Function to detect environment from hostname
function detectEnvironment() {
    const hostname = window.location.hostname;
    console.log('[Config] Detecting environment from hostname:', hostname);
    
    // Check for staging environment first
    if (hostname.includes('staging.')) {
        console.log('[Config] Detected staging environment');
        return 'staging';
    }
    
    // Check for development environment
    if (hostname.includes('dev.')) {
        console.log('[Config] Detected development environment');
        return 'development';
    }
    
    // Check if running locally
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('[Config] Detected local environment');
        return 'local';
    }
    
    // Check for production environment
    if (hostname === 'bisnisqu.badamigroups.com' || 
        hostname === 'eshop.badamigroups.com' || 
        hostname === 'zentra.badamigroups.com') {
        console.log('[Config] Detected production environment');
        return 'production';
    }
    
    // Default to local if running from file or unknown host
    if (hostname === '' || hostname === 'file' || hostname.startsWith('192.168.')) {
        console.log('[Config] Defaulting to local environment');
        return 'local';
    }
    
    // If no match found, try to detect from window.APP_CONFIG
    if (window.APP_CONFIG && window.APP_CONFIG.ENVIRONMENT) {
        console.log('[Config] Using environment from window.APP_CONFIG:', window.APP_CONFIG.ENVIRONMENT);
        return window.APP_CONFIG.ENVIRONMENT;
    }
    
    console.log('[Config] No environment match found, defaulting to local');
    return 'local';
}

// Get configuration based on environment
function getConfig() {
    const environment = detectEnvironment();
    console.log('[Config] Using environment:', environment);
    
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

    // Use server-injected config if available, otherwise use environment-based config
    const config = window.APP_CONFIG || configs[environment];
    console.log('[Config] Final configuration:', config);
    return config;
}

// Get API URL with proper environment detection
export const getApiUrl = () => {
    const config = getConfig();
    const apiUrl = config.API_URL ? `${config.API_URL}/api` : 'http://localhost:8080/api';
    console.log('[Config] Generated API URL:', apiUrl);
    return apiUrl;
};

// Get base URL with proper environment detection
export const getBaseUrl = () => {
    const config = getConfig();
    const baseUrl = config.API_URL || 'http://localhost:8080';
    console.log('[Config] Generated base URL:', baseUrl);
    return baseUrl;
};

// Get current environment
export const getEnvironment = () => {
    const config = getConfig();
    return config.ENVIRONMENT;
};

// Export configuration object
export const config = {
    baseUrl: getApiUrl(),
    environment: getEnvironment(),
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Environment': getEnvironment()
    },
    credentials: 'include',
    mode: 'cors'
}; 