/**
 * Cloudflare Pages Function — proxies GA4 measurement hits
 * through the first-party domain so Brave/uBlock don't block them.
 *
 * Incoming:  /collect/g/collect?...
 * Forwards:  https://www.google-analytics.com/g/collect?...
 */
export async function onRequest(context) {
    const url = new URL(context.request.url);

    // Strip the /collect prefix to get the real GA path
    const gaPath = url.pathname.replace(/^\/collect/, '') || '/';
    const targetUrl = `https://www.google-analytics.com${gaPath}${url.search}`;

    const request = new Request(targetUrl, {
        method: context.request.method,
        headers: context.request.headers,
        body: context.request.method !== 'GET' ? context.request.body : undefined,
    });

    const response = await fetch(request);

    return new Response(response.body, {
        status: response.status,
        headers: response.headers,
    });
}
