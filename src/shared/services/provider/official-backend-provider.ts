import { IApiSettings } from "@shared/services/storage-service/settings";
import { NetworkProvider, ProviderRequest } from "./types";

export function createOfficialBackendProvider(settings: IApiSettings): NetworkProvider {
    return {
        async request(input: ProviderRequest): Promise<Response> {
            const endpoint = settings.officialBackendUrl.replace(/\/$/, "");

            return fetch(`${endpoint}/api/gateway/fetch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
                signal: input.signal,
            });
        },
    };
}
