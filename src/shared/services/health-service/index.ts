import { IApiSettings } from "@shared/services/storage-service/settings";
import { normalizeSupabaseBaseUrl } from "@shared/services/supabase-service";

export type HealthStatus = "ok" | "error";

export interface HealthResult {
    status: HealthStatus;
    message: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        promise
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

function ok(message: string): HealthResult {
    return { status: "ok", message };
}

function fail(message: string): HealthResult {
    return { status: "error", message };
}

export async function checkProxyHealth(): Promise<HealthResult> {
    try {
        const response = await withTimeout(
            fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: "https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=hello&count=1&pages=1",
                    method: "GET",
                    headers: { Accept: "application/json" },
                }),
            }),
            10000
        );

        if (!response.ok) {
            return fail(`HTTP ${response.status}`);
        }
        return ok("Proxy reachable");
    } catch (error) {
        return fail(`Proxy failed: ${String(error)}`);
    }
}

export async function checkOfficialBackendHealth(settings: IApiSettings): Promise<HealthResult> {
    if (!settings.officialBackendUrl) {
        return fail("Official backend URL is empty");
    }

    try {
        const baseUrl = settings.officialBackendUrl.replace(/\/$/, "");
        const response = await withTimeout(fetch(`${baseUrl}/health`), 8000);
        if (!response.ok) {
            return fail(`HTTP ${response.status}`);
        }
        return ok("Official backend healthy");
    } catch (error) {
        return fail(`Official backend failed: ${String(error)}`);
    }
}

export async function checkSupabaseHealth(settings: IApiSettings): Promise<HealthResult> {
    if (!settings.supabaseUrl || !settings.supabaseAnonKey) {
        return fail("Supabase not configured");
    }

    try {
        const baseUrl = normalizeSupabaseBaseUrl(settings.supabaseUrl);
        const response = await withTimeout(
            fetch(`${baseUrl}/rest/v1/agent_sessions?select=session_id&limit=1`, {
                headers: {
                    apikey: settings.supabaseAnonKey,
                    Authorization: `Bearer ${settings.supabaseAnonKey}`,
                },
            }),
            10000
        );
        if (!response.ok) {
            const text = await response.text();
            return fail(`HTTP ${response.status}: ${text.slice(0, 80)}`);
        }
        return ok("Supabase reachable");
    } catch (error) {
        return fail(`Supabase failed: ${String(error)}`);
    }
}

export async function checkEdgeTtsHealth(settings: IApiSettings): Promise<HealthResult> {
    const baseUrl = (settings.edgeTtsBackendUrl || settings.officialBackendUrl || 'http://localhost:8000').replace(/\/$/, '');

    try {
        const response = await withTimeout(fetch(`${baseUrl}/api/tts/health`), 8000);
        if (!response.ok) {
            const text = await response.text();
            return fail(`HTTP ${response.status}: ${text.slice(0, 80)}`);
        }
        const data = await response.json() as { status?: string; voiceCount?: number };
        if (data.status !== 'ok') {
            return fail('Edge TTS unhealthy');
        }
        return ok(`edge-tts healthy (${data.voiceCount ?? 0} voices)`);
    } catch (error) {
        return fail(`Edge TTS failed: ${String(error)}`);
    }
}

export async function checkOllamaHealth(settings: IApiSettings): Promise<HealthResult> {
    if (settings.openSourceLlmProvider !== "ollama") {
        return fail("Ollama provider not enabled");
    }
    if (!settings.officialBackendUrl) {
        return fail("Official backend URL is empty");
    }

    try {
        const baseUrl = settings.officialBackendUrl.replace(/\/$/, "");
        const response = await withTimeout(fetch(`${baseUrl}/api/llm/models`), 10000);
        if (!response.ok) {
            const text = await response.text();
            return fail(`HTTP ${response.status}: ${text.slice(0, 80)}`);
        }
        const data = await response.json() as { models?: Array<unknown> };
        const count = data.models?.length ?? 0;
        return ok(`Ollama models: ${count}`);
    } catch (error) {
        return fail(`Ollama failed: ${String(error)}`);
    }
}
