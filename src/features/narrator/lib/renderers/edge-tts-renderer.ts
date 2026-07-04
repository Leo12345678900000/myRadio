import { estimateSpeechDuration } from '../duration-estimator';
import { getEdgeBackendBaseUrl, resolveEdgeVoice } from '../voice-mapping';
import { NarrationArtifact, NarrationInput } from '../types';

const SPEAK_TIMEOUT_MS = 15000;

export async function renderEdgeSpeech(input: NarrationInput, signal?: AbortSignal): Promise<NarrationArtifact> {
    const id = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const voice = input.voiceName && input.voiceName.includes('-Neural')
        ? input.voiceName
        : resolveEdgeVoice(input.speaker);
    const baseUrl = getEdgeBackendBaseUrl();

    try {
        const response = await fetch(`${baseUrl}/api/tts/speak`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input.text, voice }),
            signal: signal ?? AbortSignal.timeout(SPEAK_TIMEOUT_MS),
        });

        if (!response.ok) {
            const detail = await response.text();
            return {
                id,
                mode: 'edge-audio',
                success: false,
                durationMs: estimateSpeechDuration(input.text),
                rendererUsed: 'edge-tts',
                error: `Edge TTS HTTP ${response.status}: ${detail.slice(0, 120)}`,
            };
        }

        const audioData = await response.arrayBuffer();
        if (!audioData.byteLength) {
            return {
                id,
                mode: 'edge-audio',
                success: false,
                durationMs: estimateSpeechDuration(input.text),
                rendererUsed: 'edge-tts',
                error: 'Edge TTS returned empty audio',
            };
        }

        return {
            id,
            mode: 'edge-audio',
            success: true,
            audioData,
            audioFormat: 'mp3',
            text: input.text,
            durationMs: estimateSpeechDuration(input.text),
            rendererUsed: 'edge-tts',
        };
    } catch (error) {
        return {
            id,
            mode: 'edge-audio',
            success: false,
            durationMs: estimateSpeechDuration(input.text),
            rendererUsed: 'edge-tts',
            error: String(error),
        };
    }
}

export async function checkEdgeBackendHealth(timeoutMs = 3000): Promise<boolean> {
    const baseUrl = getEdgeBackendBaseUrl();
    try {
        const response = await fetch(`${baseUrl}/api/tts/health`, {
            signal: AbortSignal.timeout(timeoutMs),
        });
        if (!response.ok) return false;
        const data = await response.json() as { status?: string };
        return data.status === 'ok';
    } catch {
        return false;
    }
}
