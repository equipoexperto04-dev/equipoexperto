/**
 * Cloudflare Pages Function — proxies Google Tag Manager script requests
 * through the first-party domain so Brave/uBlock don't block them.
 *
 * Incoming:  /ga/gtag/js?id=G-XXXXXXXX
 * Forwards:  https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX
 */
export async function onRequest(context) {
    const url = new URL(context.request.url);

    // Strip the /ga prefix to get the real GTM path
    const gtmPath = url.pathname.replace(/^\/ga/, '') || '/';
    const targetUrl = `https://www.googletagmanager.com${gtmPath}${url.search}`;

    const request = new Request(targetUrl, {
        method: context.request.method,
        headers: context.request.headers,
    });

    const response = await fetch(request);

    const newHeaders = new Headers(response.headers);
    // Allow browser to cache the script (GTM sets long-lived cache)
    newHeaders.set('Cache-Control', response.headers.get('Cache-Control') || 'public, max-age=3600');

    return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
    });
}
