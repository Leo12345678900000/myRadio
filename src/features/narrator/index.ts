export { narratorAgent, ttsAgent } from './lib/narrator-agent';
export type {
    NarrationArtifact,
    NarrationMode,
    NarrationRenderer,
    VoiceMode,
} from './lib/types';
export { estimateSpeechDuration } from './lib/duration-estimator';
export {
    cancelBrowserSpeech,
    playBrowserSpeech,
} from './lib/renderers/browser-voice-renderer';
export { waitSubtitleSpeech } from './lib/renderers/subtitle-voice-renderer';
