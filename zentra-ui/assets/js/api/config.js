// API Configuration
export const getApiUrl = () => window.API_URL || 'http://localhost:8080/api';

export const getBaseUrl = () => {
    const apiUrl = window.API_URL || 'http://localhost:8080';
    return apiUrl.split('/api')[0]; // Remove '/api' if present
};

export const config = {
    baseUrl: getApiUrl(),
    defaultHeaders: {
        'Content-Type': 'application/json'
    }
}; 