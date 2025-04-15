import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const taskAPI = {
    async getTasks(orderItemId = null) {
        try {
            const url = orderItemId 
                ? `${config.baseUrl}/tasks?order_item_id=${orderItemId}`
                : `${config.baseUrl}/tasks`;
                
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch tasks');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get tasks error:', error);
            throw error;
        }
    },

    async getTask(taskId) {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch task');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get task error:', error);
            throw error;
        }
    },

    async updateTaskStatus(taskId, status, notes = '') {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status,
                    notes,
                    started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
                    completed_at: status === 'completed' ? new Date().toISOString() : undefined
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update task status');
            }

            return await response.json();
        } catch (error) {
            console.error('Update task status error:', error);
            throw error;
        }
    },

    async addTaskNote(taskId, note) {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/${taskId}/notes`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: note })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add task note');
            }

            return await response.json();
        } catch (error) {
            console.error('Add task note error:', error);
            throw error;
        }
    },

    async reassignTask(taskId, employeeId) {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/${taskId}/assign`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ employee_id: employeeId })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reassign task');
            }

            return await response.json();
        } catch (error) {
            console.error('Reassign task error:', error);
            throw error;
        }
    },

    async getTasksByStatus(status) {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/by-status?status=${encodeURIComponent(status)}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch tasks by status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get tasks by status error:', error);
            throw error;
        }
    },

    async getTasksByOrderItem(orderItemId) {
        try {
            const response = await fetch(`${config.baseUrl}/tasks/by-order-item/${orderItemId}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch tasks by order item');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get tasks by order item error:', error);
            throw error;
        }
    }
}; 