import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const employeeAPI = {
    async getEmployees() {
        try {
            const response = await fetch(`${config.baseUrl}/employees`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch employees');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get employees error:', error);
            throw error;
        }
    },

    async createEmployee(employeeData) {
        try {
            console.log(employeeData, "teasd");
            const response = await fetch(`${config.baseUrl}/employees`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: employeeData.name,
                    email: employeeData.email,
                    phone: employeeData.phone,
                    DivisionID: employeeData.DivisionID
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create employee');
            }

            return await response.json();
        } catch (error) {
            console.error('Create employee error:', error);
            throw error;
        }
    },

    async updateEmployee(employeeId, employeeData) {
        try {
            const response = await fetch(`${config.baseUrl}/employees/${employeeId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: employeeData.name,
                    email: employeeData.email,
                    phone: employeeData.phone,
                    DivisionID: employeeData.DivisionID
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update employee');
            }

            return await response.json();
        } catch (error) {
            console.error('Update employee error:', error);
            throw error;
        }
    },

    async deleteEmployee(employeeId) {
        try {
            const response = await fetch(`${config.baseUrl}/employees/${employeeId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete employee');
            }

            return true;
        } catch (error) {
            console.error('Delete employee error:', error);
            throw error;
        }
    },

    async assignDivision(employeeId, divisionId) {
        try {
            const response = await fetch(`${config.baseUrl}/employees/${employeeId}/division`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ division_id: divisionId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to assign division to employee');
            }

            return await response.json();
        } catch (error) {
            console.error('Assign division error:', error);
            throw error;
        }
    },

    async removeDivision(employeeId) {
        try {
            const response = await fetch(`${config.baseUrl}/employees/${employeeId}/division`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to remove division from employee');
            }

            return true;
        } catch (error) {
            console.error('Remove division error:', error);
            throw error;
        }
    }
}; 