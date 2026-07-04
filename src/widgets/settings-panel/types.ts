import { IApiSettings } from '@shared/services/storage-service/settings';

export type TestStatus = "idle" | "testing" | "success" | "error";
export type HealthCheckStatus = "idle" | "checking" | "ok" | "error";

export interface HealthItemState {
    status: HealthCheckStatus;
    message: string;
}

export interface HealthCheckState {
    proxy: HealthItemState;
    officialBackend: HealthItemState;
    edgeTts: HealthItemState;
    supabase: HealthItemState;
    ollama: HealthItemState;
}

export interface SettingsPanelState {
    settings: IApiSettings;
    testStatus: TestStatus;
    testMessage: string;
    saved: boolean;
    models: string[];
    loadingModels: boolean;
    showModelDropdown: boolean;
    ttsTestStatus: TestStatus;
    ttsTestMessage: string;
    healthChecks: HealthCheckState;
}

export interface SettingsPanelActions {
    handleChange: (field: keyof IApiSettings, value: string | boolean | number) => void;
    handleSave: () => void;
    handleTest: () => Promise<void>;
    handleFetchModels: () => Promise<void>;
    handleNarratorTest: () => Promise<void>;
    handleSelectModel: (model: string) => void;
    setShowModelDropdown: (show: boolean) => void;
    handleCheckHealth: () => Promise<void>;
}
