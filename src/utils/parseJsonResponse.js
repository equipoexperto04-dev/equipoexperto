/**
 * Read fetch() body as JSON. Avoids crashing on HTML error pages (common when API_URL is wrong or server 502).
 */
export async function parseJsonResponse(res) {
    const raw = await res.text();
    if (!raw?.trim()) return {};
    try {
        return JSON.parse(raw);
    } catch {
        const hint = res.status >= 400 ? ` (HTTP ${res.status})` : '';
        throw new Error(`Unexpected response from server${hint}. Check API URL / server status or try again.`);
    }
}
