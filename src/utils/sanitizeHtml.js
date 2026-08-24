import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Use this instead of dangerouslySetInnerHTML with raw HTML
 * 
 * @param {string} html - Raw HTML string to sanitize
 * @param {Object} options - DOMPurify options
 * @returns {string} - Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (html, options = {}) => {
    if (!html || typeof html !== 'string') return '';
    
    const defaultOptions = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
        ...options
    };
    
    return DOMPurify.sanitize(html, defaultOptions);
};

/**
 * Creates sanitized HTML props for dangerouslySetInnerHTML
 * Use this helper instead of raw dangerouslySetInnerHTML
 * 
 * @param {string} html - Raw HTML to sanitize and prepare
 * @param {Object} options - DOMPurify options
 * @returns {Object} - Object with __html property for dangerouslySetInnerHTML
 */
export const createSanitizedHtml = (html, options = {}) => ({
    __html: sanitizeHtml(html, options)
});

/**
 * Strips all HTML tags, returns plain text only
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
export const stripHtml = (html) => {
    if (!html || typeof html !== 'string') return '';
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export default sanitizeHtml;
