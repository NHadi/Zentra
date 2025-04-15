import { config } from '../config.js';

export const authAPI = {
    async login(email, password) {
        try {
            const response = await fetch(`${config.baseUrl}/auth/login`, {
                method: 'POST',
                headers: config.defaultHeaders,
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
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('menus');
        localStorage.removeItem('tenant_id');
        window.location.href = '/login.html';
    }
}; 