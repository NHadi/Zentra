import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const taskAPI = {
    async getTasks(orderItemId = null) {
        try {
            const url = orderItemId 
                ? `${config.baseUrl}/tasks?order_item_id=${orderItemId}&include=order_item,order`
                : `${config.baseUrl}/tasks?include=order_item,order`;
                
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
            const response = await fetch(`${config.baseUrl}/tasks/${taskId}?include=order_item,order`, {
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
            const task = await this.getTask(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...task,
                    status,
                    notes,
                    started_at: status === 'in_progress' ? new Date().toISOString() : task.started_at,
                    completed_at: status === 'completed' ? new Date().toISOString() : task.completed_at
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
            const task = await this.getTask(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...task,
                    notes: note
                })
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
    },

    async startTask(taskId) {
        try {
            const task = await this.getTask(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...task,
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start task');
            }

            return await response.json();
        } catch (error) {
            console.error('Start task error:', error);
            throw error;
        }
    },

    async completeTask(taskId) {
        try {
            const task = await this.getTask(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            const response = await fetch(`${config.baseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...task,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to complete task');
            }

            return await response.json();
        } catch (error) {
            console.error('Complete task error:', error);
            throw error;
        }
    }
}; 