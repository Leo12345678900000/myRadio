import { getSettings } from '@shared/services/storage-service/settings';
import { estimateSpeechDuration } from '../duration-estimator';
import { NarrationArtifact, NarrationInput } from '../types';

const SPEAKER_VOICE_HINTS: Record<string, { lang: string; preferFemale?: boolean }> = {
    host1: { lang: 'zh-CN', preferFemale: true },
    host2: { lang: 'zh-CN', preferFemale: false },
    guest: { lang: 'zh-CN' },
    news: { lang: 'zh-CN', preferFemale: false },
    announcer: { lang: 'zh-CN', preferFemale: false },
};

let browserVoices: SpeechSynthesisVoice[] = [];

function isBrowserSpeechAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

async function ensureVoicesLoaded(timeoutMs = 2000): Promise<void> {
    if (!isBrowserSpeechAvailable()) return;

    const synth = window.speechSynthesis;
    browserVoices = synth.getVoices();
    if (browserVoices.length > 0) {
        return;
    }

    await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
            synth.removeEventListener('voiceschanged', onChange);
            browserVoices = synth.getVoices();
            resolve();
        }, timeoutMs);

        const onChange = () => {
            clearTimeout(timer);
            synth.removeEventListener('voiceschanged', onChange);
            browserVoices = synth.getVoices();
            resolve();
        };

        synth.addEventListener('voiceschanged', onChange);
        synth.getVoices();
    });
}

function pickVoice(speaker: string): SpeechSynthesisVoice | undefined {
    const hint = SPEAKER_VOICE_HINTS[speaker] ?? { lang: 'zh-CN' };
    const langMatches = browserVoices.filter((voice) => voice.lang.toLowerCase().startsWith(hint.lang.toLowerCase()));
    const pool = langMatches.length > 0 ? langMatches : browserVoices;

    if (hint.preferFemale === true) {
        return pool.find((voice) => /female|女|xiaoxiao|xiaoyi|xiaomo|xiaorui/i.test(`${voice.name} ${voice.voiceURI}`)) ?? pool[0];
    }
    if (hint.preferFemale === false) {
        return pool.find((voice) => /male|男|yunxi|yunyang|yunjian|kangkang/i.test(`${voice.name} ${voice.voiceURI}`)) ?? pool[0];
    }

    return pool[0];
}

export async function renderBrowserSpeech(input: NarrationInput): Promise<NarrationArtifact> {
    const id = `browser-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (!isBrowserSpeechAvailable()) {
        return {
            id,
            mode: 'browser-speech',
            success: false,
            text: input.text,
            durationMs: estimateSpeechDuration(input.text),
            rendererUsed: 'browser',
            error: 'SpeechSynthesis not available',
        };
    }

    await ensureVoicesLoaded();
    const voice = pickVoice(String(input.speaker));

    return {
        id,
        mode: 'browser-speech',
        success: true,
        text: input.text,
        browserVoice: voice?.name,
        durationMs: estimateSpeechDuration(input.text),
        rendererUsed: 'browser',
    };
}

let speechQueue: Promise<void> = Promise.resolve();

export function cancelBrowserSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
}

export function playBrowserSpeech(artifact: NarrationArtifact): Promise<void> {
    if (!artifact.text || !isBrowserSpeechAvailable()) {
        return Promise.resolve();
    }

    const settings = getSettings();
    const utteranceText = artifact.text;

    speechQueue = speechQueue.then(() => new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.lang = 'zh-CN';
        utterance.rate = settings.browserSpeechRate;

        const voice = browserVoices.find((item) => item.name === artifact.browserVoice) ?? pickVoice('host1');
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
            resolve();
        };
        utterance.onerror = () => {
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    }));

    return speechQueue;
}

export function pauseBrowserSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
    }
}

export function resumeBrowserSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
    }
}
