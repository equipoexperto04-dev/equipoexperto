/**
 * Centralized API Client — JWT Bearer auth (API skips CSRF for /api/* and Bearer requests).
 */

import API_URL from '../config.js';
import { clearClientSession } from './sessionClient.js';

/**
 * Get auth token from cookie (HttpOnly) or legacy localStorage
 * This is for backward compatibility during migration
 */
/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - fetch options
 * @returns {Promise<Object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const config = {
        credentials: 'include',
        ...options,
        headers,
    };
    
    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            clearClientSession();
            window.location.href = '/login?session=expired';
            throw new Error('Session expired. Please log in again.');
        }
        
        // Try to parse JSON, fallback to text
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { success: response.ok, message: await response.text() };
        }
        
        if (!response.ok) {
            const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.data = data;
            error.jobId = data.jobId;
            error.code = data.code;
            throw error;
        }
        
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
};

/**
 * GET request helper
 */
export const get = (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' });

/**
 * POST request helper
 */
export const post = (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
        ...options, 
        method: 'POST', 
        body: body instanceof FormData ? body : JSON.stringify(body) 
    });

/**
 * PUT request helper
 */
export const put = (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
        ...options, 
        method: 'PUT', 
        body: JSON.stringify(body) 
    });

/**
 * PATCH request helper
 */
export const patch = (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
        ...options, 
        method: 'PATCH', 
        body: JSON.stringify(body) 
    });

/**
 * DELETE request helper
 */
export const del = (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' });

/**
 * Hook for making requests with AbortController (for cleanup)
 * Usage: const { data, loading, error, abort } = useApiRequest('/api/data');
 */
export const createAbortableRequest = () => {
    const controller = new AbortController();
    
    const makeRequest = async (endpoint, options = {}) => {
        return apiRequest(endpoint, {
            ...options,
            signal: controller.signal,
        });
    };
    
    return {
        request: makeRequest,
        abort: () => controller.abort(),
    };
};

export default apiRequest;
