import { config } from '../config.js';
import { getAuthHeaders } from '../utils/headers.js';

export const pettyCashRequestsAPI = {
    async getPettyCashRequests() {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch petty cash requests');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get petty cash requests error:', error);
            throw error;
        }
    },

    async getPettyCashRequest(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch petty cash request');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get petty cash request error:', error);
            throw error;
        }
    },

    async createPettyCashRequest(requestData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create petty cash request');
            }

            return await response.json();
        } catch (error) {
            console.error('Create petty cash request error:', error);
            throw error;
        }
    },

    async updatePettyCashRequest(id, requestData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update petty cash request');
            }

            return await response.json();
        } catch (error) {
            console.error('Update petty cash request error:', error);
            throw error;
        }
    },

    async deletePettyCashRequest(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete petty cash request');
            }

            return true;
        } catch (error) {
            console.error('Delete petty cash request error:', error);
            throw error;
        }
    },

    async approvePettyCashRequest(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}/approve`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to approve petty cash request');
            }

            return await response.json();
        } catch (error) {
            console.error('Approve petty cash request error:', error);
            throw error;
        }
    },

    async rejectPettyCashRequest(id, reason) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}/reject`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject petty cash request');
            }

            return await response.json();
        } catch (error) {
            console.error('Reject petty cash request error:', error);
            throw error;
        }
    },

    async payPettyCashRequest(id, paymentData) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}/pay`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to process payment for petty cash request');
            }

            return await response.json();
        } catch (error) {
            console.error('Pay petty cash request error:', error);
            throw error;
        }
    },

    async getRequestAttachments(id) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}/attachments`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch request attachments');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get request attachments error:', error);
            throw error;
        }
    },

    async uploadRequestAttachment(id, formData) {
        try {
            const headers = getAuthHeaders();
            delete headers['Content-Type']; // Let the browser set the correct content type for form data

            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${id}/attachments`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to upload attachment');
            }

            return await response.json();
        } catch (error) {
            console.error('Upload request attachment error:', error);
            throw error;
        }
    },

    async deleteRequestAttachment(requestId, attachmentId) {
        try {
            const response = await fetch(`${config.baseUrl}/petty-cash-requests/${requestId}/attachments/${attachmentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete attachment');
            }

            return true;
        } catch (error) {
            console.error('Delete request attachment error:', error);
            throw error;
        }
    }
}; 