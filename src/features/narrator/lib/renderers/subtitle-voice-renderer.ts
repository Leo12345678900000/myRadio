import { estimateSpeechDuration } from '../duration-estimator';
import { NarrationArtifact, NarrationInput } from '../types';

export function renderSubtitleSpeech(input: NarrationInput): NarrationArtifact {
    const id = `subtitle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
        id,
        mode: 'subtitle-timed',
        success: true,
        text: input.text,
        durationMs: estimateSpeechDuration(input.text),
        rendererUsed: 'subtitle',
    };
}

export async function waitSubtitleSpeech(artifact: NarrationArtifact): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, artifact.durationMs));
}
