"use client";

import { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings, IApiSettings, ApiType, DEFAULT_SETTINGS } from '@shared/services/storage-service/settings';
import { testConnection, fetchModels, fetchOfficialModels } from '@shared/services/ai-service';
import { checkEdgeTtsHealth, checkOfficialBackendHealth, checkOllamaHealth, checkProxyHealth, checkSupabaseHealth } from '@shared/services/health-service';
import { SettingsPanelState, SettingsPanelActions, TestStatus, HealthCheckState } from '../types';

const DEFAULT_HEALTH_STATE: HealthCheckState = {
    proxy: { status: "idle", message: "Not checked" },
    officialBackend: { status: "idle", message: "Not checked" },
    edgeTts: { status: "idle", message: "Not checked" },
    supabase: { status: "idle", message: "Not checked" },
    ollama: { status: "idle", message: "Not checked" },
};

export function useSettingsPanel(isOpen: boolean): SettingsPanelState & SettingsPanelActions {
    const [settings, setSettings] = useState<IApiSettings>(DEFAULT_SETTINGS);
    const [testStatus, setTestStatus] = useState<TestStatus>("idle");
    const [testMessage, setTestMessage] = useState("");
    const [saved, setSaved] = useState(false);

    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const [ttsTestStatus, setTtsTestStatus] = useState<TestStatus>("idle");
    const [ttsTestMessage, setTtsTestMessage] = useState("");
    const [healthChecks, setHealthChecks] = useState<HealthCheckState>(DEFAULT_HEALTH_STATE);

    // Load settings on mount
    useEffect(() => {
        if (isOpen) {
            const stored = getSettings();
            setTimeout(() => {
                setSettings(stored);
                setTestStatus("idle");
                setTestMessage("");
                setSaved(false);
                setModels([]);
                setShowModelDropdown(false);
                setHealthChecks(DEFAULT_HEALTH_STATE);
            }, 0);
        }
    }, [isOpen]);

    const handleFetchModels = useCallback(async () => {
        const isOfficialOllama = settings.runtimeMode === "live"
            && settings.backendRoute === "official"
            && settings.openSourceLlmProvider === "ollama";

        if (!isOfficialOllama && settings.runtimeMode === "live" && !settings.apiKey) return;

        setLoadingModels(true);
        const modelList = isOfficialOllama
            ? await fetchOfficialModels(settings.officialBackendUrl)
            : await fetchModels(settings.endpoint, settings.apiKey, settings.apiType);
        setModels(modelList);
        setLoadingModels(false);

        if (modelList.length > 0) {
            setShowModelDropdown(true);
        }
    }, [
        settings.endpoint,
        settings.apiKey,
        settings.apiType,
        settings.runtimeMode,
        settings.backendRoute,
        settings.openSourceLlmProvider,
        settings.officialBackendUrl,
    ]);

    const handleSave = useCallback(() => {
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, [settings]);

    const handleTest = useCallback(async () => {
        setTestStatus("testing");
        setTestMessage("");

        saveSettings(settings);

        const result = await testConnection();
        setTestStatus(result.success ? "success" : "error");
        setTestMessage(result.message);

        if (result.success && models.length === 0) {
            handleFetchModels();
        }
    }, [settings, models.length, handleFetchModels]);

    const handleChange = useCallback((field: keyof IApiSettings, value: string | boolean | number) => {
        setSaved(false);

        if (field === 'apiType') {
            const apiTypeValue = value as ApiType;

            setSettings(prev => {
                let defaultEndpoint = prev.endpoint;
                let defaultModel = prev.modelName;

                if (apiTypeValue === 'gemini') {
                    defaultEndpoint = 'https://generativelanguage.googleapis.com';
                    defaultModel = 'gemini-2.5-flash';
                } else if (apiTypeValue === 'vertexai') {
                    defaultEndpoint = '';
                    defaultModel = 'gemini-2.5-flash';
                } else if (apiTypeValue === 'openai') {
                    defaultEndpoint = '';
                    defaultModel = 'gpt-4o';
                }

                return {
                    ...prev,
                    apiType: apiTypeValue,
                    endpoint: defaultEndpoint,
                    modelName: defaultModel
                };
            });
        } else {
            setSettings(prev => ({ ...prev, [field]: value }));
        }
    }, []);

    const handleNarratorTest = useCallback(async () => {
        setTtsTestStatus("testing");
        setTtsTestMessage("正在测试旁白...");

        saveSettings(settings);

        try {
            const baseUrl = (settings.edgeTtsBackendUrl || settings.officialBackendUrl || 'http://localhost:8000').replace(/\/$/, '');

            if (settings.voiceMode === 'subtitle-only') {
                setTtsTestStatus("success");
                setTtsTestMessage("✅ 字幕模式：无需音频服务");
                return;
            }

            if (settings.voiceMode === 'edge' || settings.voiceMode === 'auto') {
                const response = await fetch(`${baseUrl}/api/tts/speak`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: '欢迎收听 AetherWave，这是 edge-tts 旁白测试。',
                        voice: settings.edgeTtsVoiceHost1,
                    }),
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type') ?? '';
                    if (contentType.includes('audio')) {
                        setTtsTestStatus("success");
                        setTtsTestMessage(`✅ edge-tts 可用 (${settings.voiceMode === 'auto' ? 'auto 模式 L1 就绪' : 'edge 模式'})`);
                        return;
                    }
                }

                if (settings.voiceMode === 'edge') {
                    const err = await response.text();
                    setTtsTestStatus("error");
                    setTtsTestMessage(`❌ edge-tts 失败: ${response.status} ${err.slice(0, 80)}`);
                    return;
                }

                setTtsTestMessage("edge-tts 不可用，继续检测浏览器降级...");
            }

            if ((settings.voiceMode === 'browser' || settings.voiceMode === 'auto') && settings.browserSpeechEnabled) {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    setTtsTestStatus("success");
                    setTtsTestMessage(`✅ 浏览器朗读可用 (${settings.voiceMode === 'auto' ? 'auto 将降级到 L2' : 'browser 模式'})`);
                    return;
                }
                setTtsTestStatus("error");
                setTtsTestMessage("❌ 浏览器不支持 SpeechSynthesis");
                return;
            }

            setTtsTestStatus("success");
            setTtsTestMessage("✅ 将使用字幕计时模式");
        } catch (e) {
            setTtsTestStatus("error");
            setTtsTestMessage(`❌ 旁白测试失败: ${e}`);
        }
    }, [settings]);

    const handleSelectModel = useCallback((model: string) => {
        handleChange("modelName", model);
        setShowModelDropdown(false);
    }, [handleChange]);

    const handleCheckHealth = useCallback(async () => {
        setHealthChecks({
            proxy: { status: "checking", message: "Checking..." },
            officialBackend: { status: "checking", message: "Checking..." },
            edgeTts: { status: "checking", message: "Checking..." },
            supabase: { status: "checking", message: "Checking..." },
            ollama: { status: "checking", message: "Checking..." },
        });

        const [proxy, officialBackend, edgeTts, supabase, ollama] = await Promise.all([
            checkProxyHealth(),
            checkOfficialBackendHealth(settings),
            checkEdgeTtsHealth(settings),
            checkSupabaseHealth(settings),
            checkOllamaHealth(settings),
        ]);

        setHealthChecks({
            proxy: { status: proxy.status, message: proxy.message },
            officialBackend: { status: officialBackend.status, message: officialBackend.message },
            edgeTts: { status: edgeTts.status, message: edgeTts.message },
            supabase: { status: supabase.status, message: supabase.message },
            ollama: { status: ollama.status, message: ollama.message },
        });
    }, [settings]);

    return {
        // State
        settings,
        testStatus,
        testMessage,
        saved,
        models,
        loadingModels,
        showModelDropdown,
        ttsTestStatus,
        ttsTestMessage,
        healthChecks,
        // Actions
        handleChange,
        handleSave,
        handleTest,
        handleFetchModels,
        handleNarratorTest,
        handleSelectModel,
        setShowModelDropdown,
        handleCheckHealth,
    };
}
