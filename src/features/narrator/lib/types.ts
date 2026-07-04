import { MoodType, SpeakerId } from '@shared/types/radio-core';

export type NarrationMode = 'edge-audio' | 'browser-speech' | 'subtitle-timed';

export type NarrationRenderer = 'edge-tts' | 'browser' | 'subtitle';

export type VoiceMode = 'auto' | 'edge' | 'browser' | 'subtitle-only';

export interface NarrationInput {
    text: string;
    speaker: SpeakerId | string;
    mood?: MoodType;
    voiceName?: string;
    voiceStyle?: string;
}

export interface NarrationArtifact {
    id: string;
    mode: NarrationMode;
    success: boolean;
    audioData?: ArrayBuffer;
    audioFormat?: 'mp3';
    text?: string;
    browserVoice?: string;
    durationMs: number;
    rendererUsed: NarrationRenderer;
    error?: string;
}

export interface NarrationPlaybackOptions {
    mood?: MoodType;
    customStyle?: string;
    voiceName?: string;
}
