import { IApiSettings } from "@shared/services/storage-service/settings";

export interface ProviderRequest {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
}

export interface NetworkProvider {
    request(input: ProviderRequest): Promise<Response>;
}

export type ProviderFactory = (settings: IApiSettings) => NetworkProvider;
