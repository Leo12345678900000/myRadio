import { IApiSettings } from "@shared/services/storage-service/settings";
import { createDemoProvider } from "./demo-provider";
import { createLiveProvider } from "./live-provider";
import { createOfficialBackendProvider } from "./official-backend-provider";
import { NetworkProvider } from "./types";

export function getNetworkProvider(settings: IApiSettings): NetworkProvider {
    if (settings.runtimeMode === "demo") {
        return createDemoProvider();
    }

    if (settings.backendRoute === "official") {
        return createOfficialBackendProvider(settings);
    }

    return createLiveProvider(settings);
}
