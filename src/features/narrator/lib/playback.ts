import { audioMixer } from '@shared/services/audio-service/mixer';
import { playBrowserSpeech, waitSubtitleSpeech } from '@features/narrator';
import { NarrationArtifact } from '@features/narrator/lib/types';

export async function playNarrationArtifact(artifact: NarrationArtifact): Promise<void> {
    if (!artifact.success) {
        if (artifact.mode === 'subtitle-timed') {
            await waitSubtitleSpeech(artifact);
        }
        return;
    }

    switch (artifact.mode) {
        case 'edge-audio':
            if (artifact.audioData) {
                await audioMixer.playVoiceMp3(artifact.audioData);
            }
            break;
        case 'browser-speech':
            await playBrowserSpeech(artifact);
            break;
        case 'subtitle-timed':
            await waitSubtitleSpeech(artifact);
            break;
    }
}

export function getScriptArtifactId(blockId: string, speaker: string, text: string): string {
    return `${blockId}-${speaker}-${text.slice(0, 20)}`;
}

export function isNarrationReady(artifact?: NarrationArtifact): boolean {
    return Boolean(artifact && (artifact.success || artifact.mode === 'subtitle-timed'));
}
