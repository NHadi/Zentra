// API Configuration
export const getApiUrl = () => {
    const config = window.APP_CONFIG || {};
    return config.API_URL ? `${config.API_URL}/api` : 'http://localhost:8080/api';
};

export const getBaseUrl = () => {
    const config = window.APP_CONFIG || {};
    return config.API_URL || 'http://localhost:8080';
};

export const config = {
    baseUrl: getApiUrl(),
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include',
    mode: 'cors'
}; 