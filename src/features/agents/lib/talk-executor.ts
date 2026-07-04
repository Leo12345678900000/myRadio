/**
 * Talk Executor - 对话执行模块（Narrator Agent）
 */

import { TalkBlock } from '@shared/types/radio-core';
import { narratorAgent } from '@features/narrator';
import {
    getScriptArtifactId,
    isNarrationReady,
    playNarrationArtifact,
} from '@features/narrator/lib/playback';
import { NarrationArtifact } from '@features/narrator/lib/types';
import { radioMonitor } from '@shared/services/monitor-service';
import { globalState } from '@shared/stores/global-state';
import { AUDIO } from '@shared/utils/constants';
import { audioMixer } from '@shared/services/audio-service/mixer';
import { DirectorState } from './director-types';

async function prepareScriptLine(
    state: DirectorState,
    blockId: string,
    script: TalkBlock['scripts'][number]
): Promise<void> {
    const artifactId = getScriptArtifactId(blockId, script.speaker, script.text);
    if (state.preparedNarration.has(artifactId)) return;

    const artifact = await narratorAgent.narrateSpeech(script.text, script.speaker, {
        mood: script.mood,
        customStyle: script.voiceStyle,
        voiceName: script.voiceName,
    });

    if (artifact.success || artifact.mode === 'subtitle-timed') {
        state.preparedNarration.set(artifactId, artifact);
    }
}

export async function prepareTalkBlock(state: DirectorState, block: TalkBlock): Promise<void> {
    for (const script of block.scripts) {
        await prepareScriptLine(state, block.id, script);
    }
}

export async function prepareTalkBlockBatched(state: DirectorState, block: TalkBlock): Promise<void> {
    await prepareTalkBlock(state, block);
}

export async function prepareTalkBlockSingle(state: DirectorState, block: TalkBlock): Promise<void> {
    await prepareTalkBlock(state, block);
}

export async function executeTalkBlock(
    state: DirectorState,
    block: TalkBlock,
    delay: (ms: number) => Promise<void>
): Promise<void> {
    const hadBackgroundMusic = block.backgroundMusic;

    if (block.backgroundMusic) {
        const { action, volume } = block.backgroundMusic;
        switch (action) {
            case 'fade':
                await audioMixer.fadeMusic(volume || 0.1, 1000);
                break;
            case 'pause':
                audioMixer.pauseMusic();
                break;
            case 'continue':
                if (volume !== undefined) {
                    audioMixer.setMusicVolume(volume);
                }
                break;
        }
    }

    await executeTalkBlockSingle(state, block, delay);

    if (hadBackgroundMusic) {
        if (hadBackgroundMusic.action === 'fade') {
            await audioMixer.fadeMusic(AUDIO.MUSIC_DEFAULT_VOLUME, AUDIO.FADE_DURATION_NORMAL);
            radioMonitor.log('DIRECTOR', 'Restored music volume after talk', 'trace');
        } else if (hadBackgroundMusic.action === 'pause') {
            audioMixer.resumeMusic();
            radioMonitor.log('DIRECTOR', 'Resumed music after talk', 'trace');
        }
    }
}

export async function executeTalkBlockSingle(
    state: DirectorState,
    block: TalkBlock,
    delay: (ms: number) => Promise<void>
): Promise<void> {
    const scripts = block.scripts;
    const lookaheadPromises: Map<number, Promise<void>> = new Map();

    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const artifactId = getScriptArtifactId(block.id, script.speaker, script.text);

        if (!state.preparedNarration.has(artifactId)) {
            lookaheadPromises.set(
                i,
                prepareScriptLine(state, block.id, script)
            );
        }
    }

    for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];

        if (!state.isRunning || state.skipRequested) break;

        radioMonitor.emitScript(script.speaker, script.text, block.id);

        const artifactId = getScriptArtifactId(block.id, script.speaker, script.text);
        const pendingPromise = lookaheadPromises.get(i);
        if (pendingPromise) {
            await pendingPromise;
        }

        let artifact: NarrationArtifact | undefined = state.preparedNarration.get(artifactId);

        if (!isNarrationReady(artifact)) {
            artifact = await narratorAgent.narrateSpeech(script.text, script.speaker, {
                mood: script.mood,
                customStyle: script.voiceStyle,
                voiceName: script.voiceName,
            });
            if (artifact.success || artifact.mode === 'subtitle-timed') {
                state.preparedNarration.set(artifactId, artifact);
            }
        }

        if (artifact) {
            try {
                await playNarrationArtifact(artifact);
            } catch (e) {
                console.warn('[Director] Narration playback failed:', e);
            }
        }

        if (script.pause) {
            await delay(script.pause);
        }

        globalState.addTopic(script.text.slice(0, 50), script.speaker);
    }
}

export function isTalkBlockPrepared(state: DirectorState, block: TalkBlock): boolean {
    return block.scripts.every((script) => {
        const artifactId = getScriptArtifactId(block.id, script.speaker, script.text);
        return isNarrationReady(state.preparedNarration.get(artifactId));
    });
}
