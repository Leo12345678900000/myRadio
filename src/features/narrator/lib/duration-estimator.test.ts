import { describe, expect, it } from 'vitest';
import { estimateSpeechDuration } from './duration-estimator';

describe('estimateSpeechDuration', () => {
    it('returns minimum duration for short text', () => {
        expect(estimateSpeechDuration('好')).toBeGreaterThanOrEqual(2000);
    });

    it('scales with Chinese characters', () => {
        const short = estimateSpeechDuration('你好世界');
        const long = estimateSpeechDuration('你好世界，这里是 AetherWave 电台，今天我们一起聊聊科技与生活。');
        expect(long).toBeGreaterThan(short);
    });

    it('caps very long text', () => {
        const longText = '测'.repeat(200);
        expect(estimateSpeechDuration(longText)).toBeLessThanOrEqual(30000);
    });
});
