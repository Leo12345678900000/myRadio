/**
 * Settings Store - LocalStorage-based persistent API configuration
 */

const STORAGE_KEY = "radio_nowhere_settings";

export type ApiType = "openai" | "gemini" | "vertexai";
export type VoiceMode = "auto" | "edge" | "browser" | "subtitle-only";
export type RuntimeMode = "demo" | "live";
export type BackendRoute = "direct" | "proxy" | "official";
export type OpenSourceLlmProvider = "none" | "ollama";
export type UITheme = "dark" | "neon" | "minimal";

export interface IApiSettings {
    endpoint: string;      // API base URL (e.g., https://api.openai.com)
    apiKey: string;        // API Key
    modelName: string;     // Model name (e.g., gpt-4o, gemini-2.5-flash)
    apiType: ApiType;      // API format type: openai or gemini

    // Vertex AI 特定配置
    gcpProject: string;    // GCP Project ID
    gcpLocation: string;   // GCP Region (e.g., us-central1)

    // Narrator / 旁白配置
    voiceMode: VoiceMode;
    edgeTtsBackendUrl: string;
    edgeTtsVoiceHost1: string;
    edgeTtsVoiceHost2: string;
    edgeTtsVoiceGuest: string;
    browserSpeechEnabled: boolean;
    browserSpeechRate: number;

    /** @deprecated Legacy fields kept for localStorage merge only */
    ttsProvider?: "gemini" | "microsoft";
    ttsEndpoint?: string;
    ttsApiKey?: string;
    ttsModel?: string;
    ttsVoice?: string;
    ttsUseVertex?: boolean;
    msTtsEndpoint?: string;
    msTtsVoice?: string;
    msTtsVolume?: number;
    msTtsRate?: number;
    msTtsPitch?: number;
    msTtsAuthKey?: string;

    // 播放配置
    preloadBlockCount: number;  // 提前准备的 block 数量 (推荐: 5)

    // 运行模式与后端路由
    runtimeMode: RuntimeMode;
    backendRoute: BackendRoute;
    officialBackendUrl: string;

    // Supabase (open-source backend)
    supabaseUrl: string;
    supabaseAnonKey: string;

    // Open-source LLM backend
    openSourceLlmProvider: OpenSourceLlmProvider;
    ollamaBaseUrl: string;
    ollamaModel: string;

    // UI Theme
    uiTheme: UITheme;
}

export const DEFAULT_SETTINGS: IApiSettings = {
    endpoint: "",
    apiKey: "",
    modelName: "gpt-4o",
    apiType: "openai",
    gcpProject: "",
    gcpLocation: "us-central1",
    voiceMode: "auto",
    edgeTtsBackendUrl: "http://localhost:8000",
    edgeTtsVoiceHost1: "zh-CN-XiaoxiaoNeural",
    edgeTtsVoiceHost2: "zh-CN-YunxiNeural",
    edgeTtsVoiceGuest: "zh-CN-XiaoyiNeural",
    browserSpeechEnabled: true,
    browserSpeechRate: 1,
    // 播放配置
    preloadBlockCount: 3,
    // 运行模式与后端路由
    runtimeMode: "live",
    backendRoute: "direct",
    officialBackendUrl: "http://localhost:8000",
    // Supabase
    supabaseUrl: "",
    supabaseAnonKey: "",
    // Open-source LLM backend
    openSourceLlmProvider: "none",
    ollamaBaseUrl: "http://localhost:11434",
    ollamaModel: "qwen2.5:7b",
    // UI Theme
    uiTheme: "dark",
};

// 可用的 edge-tts 中文音色（Settings 下拉）
export const EDGE_TTS_VOICES = [
    { name: 'zh-CN-XiaoxiaoNeural', desc: '女声 · 晓晓' },
    { name: 'zh-CN-XiaoyiNeural', desc: '女声 · 晓伊' },
    { name: 'zh-CN-YunxiNeural', desc: '男声 · 云希' },
    { name: 'zh-CN-YunyangNeural', desc: '男声 · 云扬' },
    { name: 'zh-CN-YunjianNeural', desc: '男声 · 云健' },
];

/** @deprecated Use EDGE_TTS_VOICES */
export const TTS_VOICES = EDGE_TTS_VOICES;

/**
 * Get API settings from LocalStorage
 */
export function getSettings(): IApiSettings {
    if (typeof window === "undefined") {
        return DEFAULT_SETTINGS;
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return DEFAULT_SETTINGS;
        }

        const parsed = JSON.parse(stored) as Partial<IApiSettings>;
        return {
            endpoint: parsed.endpoint ?? DEFAULT_SETTINGS.endpoint,
            apiKey: parsed.apiKey ?? DEFAULT_SETTINGS.apiKey,
            modelName: parsed.modelName ?? DEFAULT_SETTINGS.modelName,
            apiType: parsed.apiType ?? DEFAULT_SETTINGS.apiType,
            gcpProject: parsed.gcpProject ?? DEFAULT_SETTINGS.gcpProject,
            gcpLocation: parsed.gcpLocation ?? DEFAULT_SETTINGS.gcpLocation,
            voiceMode: parsed.voiceMode ?? DEFAULT_SETTINGS.voiceMode,
            edgeTtsBackendUrl: parsed.edgeTtsBackendUrl ?? DEFAULT_SETTINGS.edgeTtsBackendUrl,
            edgeTtsVoiceHost1: parsed.edgeTtsVoiceHost1 ?? DEFAULT_SETTINGS.edgeTtsVoiceHost1,
            edgeTtsVoiceHost2: parsed.edgeTtsVoiceHost2 ?? DEFAULT_SETTINGS.edgeTtsVoiceHost2,
            edgeTtsVoiceGuest: parsed.edgeTtsVoiceGuest ?? DEFAULT_SETTINGS.edgeTtsVoiceGuest,
            browserSpeechEnabled: parsed.browserSpeechEnabled ?? DEFAULT_SETTINGS.browserSpeechEnabled,
            browserSpeechRate: parsed.browserSpeechRate ?? DEFAULT_SETTINGS.browserSpeechRate,
            // 播放配置
            preloadBlockCount: parsed.preloadBlockCount ?? DEFAULT_SETTINGS.preloadBlockCount,
            // 运行模式与后端路由
            runtimeMode: parsed.runtimeMode ?? DEFAULT_SETTINGS.runtimeMode,
            backendRoute: parsed.backendRoute ?? DEFAULT_SETTINGS.backendRoute,
            officialBackendUrl: parsed.officialBackendUrl ?? DEFAULT_SETTINGS.officialBackendUrl,
            supabaseUrl: parsed.supabaseUrl ?? DEFAULT_SETTINGS.supabaseUrl,
            supabaseAnonKey: parsed.supabaseAnonKey ?? DEFAULT_SETTINGS.supabaseAnonKey,
            openSourceLlmProvider: parsed.openSourceLlmProvider ?? DEFAULT_SETTINGS.openSourceLlmProvider,
            ollamaBaseUrl: parsed.ollamaBaseUrl ?? DEFAULT_SETTINGS.ollamaBaseUrl,
            ollamaModel: parsed.ollamaModel ?? DEFAULT_SETTINGS.ollamaModel,
            uiTheme: parsed.uiTheme ?? DEFAULT_SETTINGS.uiTheme,
        };
    } catch (e) {
        console.error("Failed to parse settings:", e);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Save API settings to LocalStorage
 */
export function saveSettings(settings: IApiSettings): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("radio-settings-changed"));
        }
    } catch (e) {
        console.error("Failed to save settings:", e);
    }
}

/**
 * Clear all settings from LocalStorage
 */
export function clearSettings(): void {
    if (typeof window === "undefined") {
        return;
    }

    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error("Failed to clear settings:", e);
    }
}

/**
 * Check if API settings are configured
 * For Gemini: only apiKey is required (uses default endpoint)
 * For OpenAI: both endpoint and apiKey are required
 * For Vertex AI: gcpProject and apiKey are required
 */
export function isConfigured(): boolean {
    const settings = getSettings();

    if (settings.runtimeMode === "demo") {
        return true;
    }

    // 所有类型都需要 apiKey
    if (!settings.apiKey) {
        return false;
    }

    // OpenAI 需要 endpoint
    if (settings.apiType === 'openai' && !settings.endpoint) {
        return false;
    }

    // Vertex AI 需要 project 和 location
    if (settings.apiType === 'vertexai' && (!settings.gcpProject || !settings.gcpLocation)) {
        return false;
    }

    return true;
}
