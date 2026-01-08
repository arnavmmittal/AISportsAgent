/**
 * HTML Sanitization Utilities
 *
 * Uses dynamic import of isomorphic-dompurify to avoid build-time CSS bundling issues
 */

let DOMPurify: any = null;

/**
 * Lazy load DOMPurify only when needed (runtime, not build time)
 */
async function getDOMPurify() {
  if (!DOMPurify) {
    const { default: purify } = await import('isomorphic-dompurify');
    DOMPurify = purify;
  }
  return DOMPurify;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Strips all HTML tags and keeps only plain text
 */
export async function sanitizeHtml(input: string): Promise<string> {
  const purify = await getDOMPurify();
  return purify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  }).trim();
}

/**
 * Sanitize message for chat (allows some markdown but strips dangerous HTML)
 */
export async function sanitizeChatMessage(input: string): Promise<string> {
  const purify = await getDOMPurify();
  return purify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML for safety
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
}

/**
 * Synchronous version that falls back to basic sanitization if DOMPurify not loaded
 * Use only when async is not possible
 */
export function sanitizeHtmlSync(input: string): string {
  // Basic XSS protection: remove HTML tags with regex
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Synchronous version for chat messages
 */
export function sanitizeChatMessageSync(input: string): string {
  return sanitizeHtmlSync(input);
}
