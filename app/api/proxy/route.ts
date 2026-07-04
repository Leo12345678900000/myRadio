import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy - 转发请求到外部 API 以绕过 CORS 限制
 * 
 * POST /api/proxy
 * Body: { url: string, method: string, headers: object, body?: object }
 */

const REQUEST_TIMEOUT_MS = 60000;

const ALLOWED_METHODS = new Set([
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD',
]);

const BLOCKED_FORWARD_HEADERS = new Set([
    'host',
    'content-length',
    'connection',
    'accept-encoding',
]);

const DEFAULT_HEADERS: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'AetherWaveProxy/1.0 (+https://localhost)',
};

function normalizeMethod(rawMethod: unknown): string {
    const normalized = typeof rawMethod === 'string' ? rawMethod.toUpperCase() : 'GET';
    return ALLOWED_METHODS.has(normalized) ? normalized : 'GET';
}

function toSafeUrl(rawUrl: unknown): URL | null {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
        return null;
    }

    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function buildForwardHeaders(rawHeaders: unknown): Headers {
    const headers = new Headers(DEFAULT_HEADERS);

    if (rawHeaders && typeof rawHeaders === 'object') {
        for (const [key, value] of Object.entries(rawHeaders as Record<string, unknown>)) {
            if (!key || value === undefined || value === null) continue;

            const lowerKey = key.toLowerCase();
            if (BLOCKED_FORWARD_HEADERS.has(lowerKey)) continue;

            if (typeof value === 'string') {
                headers.set(key, value);
            } else {
                headers.set(key, String(value));
            }
        }
    }

    return headers;
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const targetUrl = toSafeUrl(payload?.url);
        const method = normalizeMethod(payload?.method);
        const headers = buildForwardHeaders(payload?.headers);
        const body = payload?.body;

        if (!targetUrl) {
            return NextResponse.json(
                { error: 'Valid HTTP/HTTPS URL is required' },
                { status: 400 }
            );
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            redirect: 'follow',
            cache: 'no-store',
        };

        if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(targetUrl.toString(), fetchOptions);

        // 尝试解析 JSON，失败则返回原始文本
        const text = await response.text();
        const contentType = response.headers.get('content-type') ?? '';
        let data;

        if (contentType.includes('application/json')) {
            try {
                data = JSON.parse(text);
            } catch {
                data = { rawResponse: text, parseError: 'Invalid JSON response body' };
            }
        } else {
            data = { rawResponse: text };
        }

        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: `Proxy timeout after ${REQUEST_TIMEOUT_MS}ms` },
                { status: 504 }
            );
        }

        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: `Proxy failed: ${String(error)}` },
            { status: 500 }
        );
    }
}
