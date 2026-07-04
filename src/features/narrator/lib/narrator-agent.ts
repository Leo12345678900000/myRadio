import { Cast } from '@features/content/lib/cast-system';
import { getSettings } from '@shared/services/storage-service/settings';
import { radioMonitor } from '@shared/services/monitor-service';
import { MoodType, SpeakerId } from '@shared/types/radio-core';
import { estimateSpeechDuration } from './duration-estimator';
import {
    cancelBrowserSpeech,
    pauseBrowserSpeech,
    renderBrowserSpeech,
    resumeBrowserSpeech,
} from './renderers/browser-voice-renderer';
import { checkEdgeBackendHealth, renderEdgeSpeech } from './renderers/edge-tts-renderer';
import { renderSubtitleSpeech } from './renderers/subtitle-voice-renderer';
import {
    NarrationArtifact,
    NarrationInput,
    NarrationPlaybackOptions,
    NarrationRenderer,
} from './types';

const EDGE_HEALTH_TTL_MS = 30000;

class NarratorAgent {
    private activeCast: Cast | null = null;
    private abortController: AbortController | null = null;
    private isAborted = false;
    private cache = new Map<string, NarrationArtifact>();
    private lastRendererUsed: NarrationRenderer = 'subtitle';
    private edgeHealthCache: { ok: boolean; checkedAt: number } | null = null;

    setActiveCast(cast: Cast): void {
        this.activeCast = cast;
        radioMonitor.log('NARRATOR', `Active cast set: ${cast.members.map((member) => member.roleName).join(', ')}`, 'info');
    }

    getLastRendererUsed(): NarrationRenderer {
        return this.lastRendererUsed;
    }

    reset(): void {
        this.isAborted = false;
        this.abortController = null;
        radioMonitor.log('NARRATOR', 'Narrator Agent reset', 'info');
    }

    abort(): void {
        this.isAborted = true;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        cancelBrowserSpeech();
        radioMonitor.log('NARRATOR', 'All narration requests aborted', 'warn');
    }

    pause(): void {
        pauseBrowserSpeech();
    }

    resume(): void {
        resumeBrowserSpeech();
    }

    async narrateSpeech(
        text: string,
        speaker: SpeakerId | string,
        options?: NarrationPlaybackOptions
    ): Promise<NarrationArtifact> {
        const input: NarrationInput = {
            text,
            speaker,
            mood: options?.mood,
            voiceName: options?.voiceName,
            voiceStyle: options?.customStyle,
        };

        const cacheKey = this.getCacheKey(input);
        const cached = this.cache.get(cacheKey);
        if (cached?.success) {
            this.lastRendererUsed = cached.rendererUsed;
            return cached;
        }

        if (this.isAborted) {
            return this.failedArtifact(input, 'Request aborted');
        }

        this.abortController = new AbortController();
        const artifact = await this.renderWithFallback(input, this.abortController.signal);
        this.lastRendererUsed = artifact.rendererUsed;

        if (artifact.success) {
            this.cache.set(cacheKey, artifact);
        }

        radioMonitor.updateStatus('NARRATOR', artifact.success ? 'READY' : 'ERROR', `${artifact.rendererUsed}: ${text.slice(0, 20)}`);
        return artifact;
    }

    async narrateLines(
        scripts: Array<{ speaker: string; text: string; mood?: MoodType; voiceName?: string; voiceStyle?: string }>
    ): Promise<NarrationArtifact[]> {
        const results: NarrationArtifact[] = [];
        for (const script of scripts) {
            if (this.isAborted) break;
            results.push(await this.narrateSpeech(script.text, script.speaker, {
                mood: script.mood,
                voiceName: script.voiceName,
                customStyle: script.voiceStyle,
            }));
        }
        return results;
    }

    private async renderWithFallback(input: NarrationInput, signal: AbortSignal): Promise<NarrationArtifact> {
        const settings = getSettings();
        const mode = settings.voiceMode;

        if (mode === 'subtitle-only') {
            return this.useSubtitle(input);
        }

        if (mode === 'edge' || mode === 'auto') {
            if (await this.isEdgeAvailable()) {
                radioMonitor.updateStatus('NARRATOR', 'BUSY', `edge-tts: ${input.text.slice(0, 20)}...`);
                const edge = await renderEdgeSpeech(input, signal);
                if (edge.success) return edge;
                radioMonitor.log('NARRATOR', `Fallback from edge-tts: ${edge.error}`, 'warn');
                if (mode === 'edge') return edge;
            } else if (mode === 'edge') {
                return this.failedArtifact(input, 'Edge TTS backend unavailable');
            }
        }

        if ((mode === 'browser' || mode === 'auto') && settings.browserSpeechEnabled) {
            radioMonitor.updateStatus('NARRATOR', 'BUSY', `browser: ${input.text.slice(0, 20)}...`);
            const browser = await renderBrowserSpeech(input);
            if (browser.success) return browser;
            radioMonitor.log('NARRATOR', `Fallback from browser: ${browser.error}`, 'warn');
            if (mode === 'browser') return browser;
        }

        return this.useSubtitle(input);
    }

    private useSubtitle(input: NarrationInput): NarrationArtifact {
        radioMonitor.updateStatus('NARRATOR', 'READY', `subtitle: ${input.text.slice(0, 20)}...`);
        return renderSubtitleSpeech(input);
    }

    private failedArtifact(input: NarrationInput, error: string): NarrationArtifact {
        return {
            id: `error-${Date.now()}`,
            mode: 'subtitle-timed',
            success: false,
            text: input.text,
            durationMs: estimateSpeechDuration(input.text),
            rendererUsed: 'subtitle',
            error,
        };
    }

    private async isEdgeAvailable(): Promise<boolean> {
        const now = Date.now();
        if (this.edgeHealthCache && now - this.edgeHealthCache.checkedAt < EDGE_HEALTH_TTL_MS) {
            return this.edgeHealthCache.ok;
        }

        const ok = await checkEdgeBackendHealth();
        this.edgeHealthCache = { ok, checkedAt: now };
        return ok;
    }

    private getCacheKey(input: NarrationInput): string {
        const settings = getSettings();
        return `${settings.voiceMode}|${input.speaker}|${input.voiceName ?? ''}|${input.text}`;
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export const narratorAgent = new NarratorAgent();

/** @deprecated Use narratorAgent */
export const ttsAgent = narratorAgent;
