import { ShowType } from './cast-system';

export type MusicPurpose = 'main' | 'background' | 'transition_only';
export type TalkDepth = 'shallow' | 'medium' | 'deep';
export type InteractionLevel = 'none' | 'low' | 'medium' | 'high';
export type ShowPacing = 'fast' | 'medium' | 'slow';

export interface ScriptDensityConfig {
    minLinesPerTalkBlock: number;
    minCharsPerLine: number;
    maxConsecutiveLinesPerSpeaker: number;
}

export interface ShowConfig {
    type: ShowType;
    talkRatio: [number, number];
    musicRatio: [number, number];
    durationRange: [number, number];
    musicPurpose: MusicPurpose;
    talkDepth: TalkDepth;
    interactionLevel: InteractionLevel;
    pacing: ShowPacing;
    scriptDensity: ScriptDensityConfig;
    requiredTools: string[];
    optionalTools: string[];
    promptTemplate: string;
    preferredSegmentOrder: Array<'opening' | 'main_topic' | 'music_break' | 'interaction' | 'closing'>;
}

export const SHOW_CONFIGS: Record<ShowType, ShowConfig> = {
    talk: {
        type: 'talk',
        talkRatio: [70, 85],
        musicRatio: [15, 30],
        durationRange: [360, 600],
        musicPurpose: 'background',
        talkDepth: 'medium',
        interactionLevel: 'low',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 6,
            minCharsPerLine: 15,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_music', 'check_artist_diversity', 'submit_show'],
        optionalTools: ['fetch_news', 'search_quotes'],
        promptTemplate: 'talk',
        preferredSegmentOrder: ['opening', 'main_topic', 'interaction', 'music_break', 'closing']
    },
    interview: {
        type: 'interview',
        talkRatio: [75, 90],
        musicRatio: [10, 25],
        durationRange: [420, 660],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'medium',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 7,
            minCharsPerLine: 18,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_music', 'check_artist_diversity', 'submit_show'],
        optionalTools: ['search_knowledge', 'fetch_trending'],
        promptTemplate: 'talk',
        preferredSegmentOrder: ['opening', 'main_topic', 'interaction', 'closing']
    },
    news: {
        type: 'news',
        talkRatio: [80, 95],
        musicRatio: [5, 20],
        durationRange: [180, 300],
        musicPurpose: 'transition_only',
        talkDepth: 'shallow',
        interactionLevel: 'none',
        pacing: 'fast',
        scriptDensity: {
            minLinesPerTalkBlock: 4,
            minCharsPerLine: 24,
            maxConsecutiveLinesPerSpeaker: 4
        },
        requiredTools: ['check_duplicate', 'fetch_news', 'submit_show'],
        optionalTools: ['fetch_weather', 'search_knowledge'],
        promptTemplate: 'news',
        preferredSegmentOrder: ['opening', 'main_topic', 'interaction', 'closing']
    },
    drama: {
        type: 'drama',
        talkRatio: [75, 90],
        musicRatio: [10, 25],
        durationRange: [300, 600],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'medium',
        pacing: 'slow',
        scriptDensity: {
            minLinesPerTalkBlock: 8,
            minCharsPerLine: 16,
            maxConsecutiveLinesPerSpeaker: 2
        },
        requiredTools: ['check_duplicate', 'search_knowledge', 'submit_show'],
        optionalTools: ['search_music', 'search_quotes'],
        promptTemplate: 'story',
        preferredSegmentOrder: ['opening', 'main_topic', 'music_break', 'closing']
    },
    entertainment: {
        type: 'entertainment',
        talkRatio: [65, 80],
        musicRatio: [20, 35],
        durationRange: [300, 480],
        musicPurpose: 'main',
        talkDepth: 'shallow',
        interactionLevel: 'high',
        pacing: 'fast',
        scriptDensity: {
            minLinesPerTalkBlock: 6,
            minCharsPerLine: 12,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_music', 'check_artist_diversity', 'submit_show'],
        optionalTools: ['fetch_trending', 'search_quotes'],
        promptTemplate: 'entertainment',
        preferredSegmentOrder: ['opening', 'interaction', 'main_topic', 'music_break', 'closing']
    },
    story: {
        type: 'story',
        talkRatio: [75, 90],
        musicRatio: [10, 25],
        durationRange: [360, 600],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'low',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 7,
            minCharsPerLine: 20,
            maxConsecutiveLinesPerSpeaker: 4
        },
        requiredTools: ['check_duplicate', 'search_knowledge', 'submit_show'],
        optionalTools: ['search_quotes', 'search_music'],
        promptTemplate: 'story',
        preferredSegmentOrder: ['opening', 'main_topic', 'music_break', 'closing']
    },
    history: {
        type: 'history',
        talkRatio: [80, 92],
        musicRatio: [8, 20],
        durationRange: [480, 720],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'none',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 8,
            minCharsPerLine: 24,
            maxConsecutiveLinesPerSpeaker: 5
        },
        requiredTools: ['check_duplicate', 'search_knowledge', 'submit_show'],
        optionalTools: ['search_quotes', 'search_music'],
        promptTemplate: 'story',
        preferredSegmentOrder: ['opening', 'main_topic', 'closing']
    },
    science: {
        type: 'science',
        talkRatio: [80, 92],
        musicRatio: [8, 20],
        durationRange: [420, 660],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'medium',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 8,
            minCharsPerLine: 22,
            maxConsecutiveLinesPerSpeaker: 4
        },
        requiredTools: ['check_duplicate', 'search_knowledge', 'submit_show'],
        optionalTools: ['fetch_trending', 'search_music'],
        promptTemplate: 'story',
        preferredSegmentOrder: ['opening', 'main_topic', 'interaction', 'closing']
    },
    mystery: {
        type: 'mystery',
        talkRatio: [75, 88],
        musicRatio: [12, 25],
        durationRange: [480, 720],
        musicPurpose: 'background',
        talkDepth: 'deep',
        interactionLevel: 'low',
        pacing: 'slow',
        scriptDensity: {
            minLinesPerTalkBlock: 7,
            minCharsPerLine: 20,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_knowledge', 'search_music', 'submit_show'],
        optionalTools: ['search_quotes'],
        promptTemplate: 'story',
        preferredSegmentOrder: ['opening', 'main_topic', 'music_break', 'closing']
    },
    nighttalk: {
        type: 'nighttalk',
        talkRatio: [70, 85],
        musicRatio: [15, 30],
        durationRange: [420, 660],
        musicPurpose: 'main',
        talkDepth: 'deep',
        interactionLevel: 'medium',
        pacing: 'slow',
        scriptDensity: {
            minLinesPerTalkBlock: 6,
            minCharsPerLine: 18,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_music', 'check_artist_diversity', 'submit_show'],
        optionalTools: ['search_quotes', 'fetch_weather'],
        promptTemplate: 'talk',
        preferredSegmentOrder: ['opening', 'interaction', 'main_topic', 'music_break', 'closing']
    },
    music: {
        type: 'music',
        talkRatio: [40, 60],
        musicRatio: [40, 60],
        durationRange: [360, 600],
        musicPurpose: 'main',
        talkDepth: 'medium',
        interactionLevel: 'medium',
        pacing: 'medium',
        scriptDensity: {
            minLinesPerTalkBlock: 5,
            minCharsPerLine: 14,
            maxConsecutiveLinesPerSpeaker: 3
        },
        requiredTools: ['check_duplicate', 'search_music', 'check_artist_diversity', 'submit_show'],
        optionalTools: ['get_lyrics', 'search_knowledge'],
        promptTemplate: 'music',
        preferredSegmentOrder: ['opening', 'main_topic', 'music_break', 'interaction', 'closing']
    }
};

export function getShowConfig(type: ShowType): ShowConfig {
    return SHOW_CONFIGS[type] || SHOW_CONFIGS.talk;
}

export function clampDurationByShowConfig(config: ShowConfig, requestedDuration: number): number {
    const [minDuration, maxDuration] = config.durationRange;
    if (!Number.isFinite(requestedDuration) || requestedDuration <= 0) {
        return minDuration;
    }

    return Math.min(Math.max(Math.round(requestedDuration), minDuration), maxDuration);
}
