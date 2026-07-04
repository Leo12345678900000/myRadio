import { getSettings } from '@shared/services/storage-service/settings';
import { SpeakerId } from '@shared/types/radio-core';

const DEFAULT_VOICES: Record<string, string> = {
    host1: 'zh-CN-XiaoxiaoNeural',
    host2: 'zh-CN-YunxiNeural',
    guest: 'zh-CN-XiaoyiNeural',
    news: 'zh-CN-YunyangNeural',
    announcer: 'zh-CN-YunyangNeural',
};

export function resolveEdgeVoice(speaker: SpeakerId | string): string {
    const settings = getSettings();

    if (speaker === 'host1') return settings.edgeTtsVoiceHost1;
    if (speaker === 'host2') return settings.edgeTtsVoiceHost2;
    if (speaker === 'guest') return settings.edgeTtsVoiceGuest;

    return DEFAULT_VOICES[speaker] ?? settings.edgeTtsVoiceHost1;
}

export function getEdgeBackendBaseUrl(): string {
    const settings = getSettings();
    return (settings.edgeTtsBackendUrl || settings.officialBackendUrl || 'http://localhost:8000').replace(/\/$/, '');
}
