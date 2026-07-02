import { NetworkProvider, ProviderRequest } from "./types";
import { IApiSettings } from "@shared/services/storage-service/settings";

const FALLBACK_HOSTS = [
    "api.shwgij.com",
    "api.openai.com",
    "generativelanguage.googleapis.com",
    "aiplatform.googleapis.com",
];

function createFetchOptions(input: ProviderRequest): RequestInit {
    const options: RequestInit = {
        method: input.method,
        headers: input.headers,
        signal: input.signal,
    };

    if (input.body !== undefined && input.method !== "GET") {
        options.body = JSON.stringify(input.body);
    }

    return options;
}

function shouldFallback(url: string): boolean {
    return FALLBACK_HOSTS.some((host) => url.includes(host));
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message || error.name;
    }
    return String(error);
}

async function requestViaProxy(input: ProviderRequest): Promise<Response> {
    return fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: input.signal,
    });
}

export function createLiveProvider(settings: IApiSettings): NetworkProvider {
    return {
        async request(input: ProviderRequest): Promise<Response> {
            const directOptions = createFetchOptions(input);

            if (settings.backendRoute === "proxy") {
                try {
                    const proxyResponse = await requestViaProxy(input);
                    if (!proxyResponse.ok && shouldFallback(input.url)) {
                        return fetch(input.url, directOptions);
                    }
                    return proxyResponse;
                } catch (proxyError) {
                    if (!shouldFallback(input.url)) {
                        throw new Error(`PROXY_REQUEST_FAILED: ${toErrorMessage(proxyError)}`);
                    }
                    return fetch(input.url, directOptions);
                }
            }

            try {
                const directResponse = await fetch(input.url, directOptions);
                if (!directResponse.ok && directResponse.status >= 500 && shouldFallback(input.url)) {
                    return requestViaProxy(input);
                }
                return directResponse;
            } catch (directError) {
                if (settings.backendRoute === "direct" && !shouldFallback(input.url)) {
                    throw new Error(`DIRECT_REQUEST_FAILED: ${toErrorMessage(directError)}`);
                }

                try {
                    return await requestViaProxy(input);
                } catch (proxyError) {
                    throw new Error(
                        `DIRECT_AND_PROXY_FAILED: direct=${toErrorMessage(directError)}; proxy=${toErrorMessage(proxyError)}`
                    );
                }
            }
        },
    };
}
