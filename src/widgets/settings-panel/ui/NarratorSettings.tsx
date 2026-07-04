"use client";

import React from 'react';
import { Loader2, Zap } from 'lucide-react';
import { EDGE_TTS_VOICES, IApiSettings, VoiceMode } from '@shared/services/storage-service/settings';
import { TestStatus } from '../types';

interface NarratorSettingsProps {
    settings: IApiSettings;
    narratorTestStatus: TestStatus;
    narratorTestMessage: string;
    onSettingChange: (field: keyof IApiSettings, value: string | boolean | number) => void;
    onNarratorTest: () => Promise<void>;
}

const VOICE_MODES: Array<{ id: VoiceMode; label: string; desc: string }> = [
    { id: 'auto', label: '自动', desc: 'edge-tts → 浏览器 → 字幕' },
    { id: 'edge', label: 'Edge TTS', desc: '仅 FastAPI edge-tts（需 uvicorn）' },
    { id: 'browser', label: '浏览器', desc: '系统 SpeechSynthesis' },
    { id: 'subtitle-only', label: '字幕', desc: '无声音，按句计时' },
];

export default function NarratorSettings({
    settings,
    narratorTestStatus,
    narratorTestMessage,
    onSettingChange,
    onNarratorTest,
}: NarratorSettingsProps) {
    return (
        <div className="border-t border-neutral-800 pt-4">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">🎙️ Narrator Settings</h3>

            <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-neutral-400">语音模式</label>
                <div className="grid grid-cols-2 gap-2">
                    {VOICE_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => onSettingChange('voiceMode', mode.id)}
                            className={`px-3 py-2 rounded-xl text-left text-sm transition-all ${settings.voiceMode === mode.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                }`}
                        >
                            <div className="font-medium">{mode.label}</div>
                            <div className="text-[10px] opacity-80">{mode.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Edge TTS 服务地址</label>
                    <input
                        type="text"
                        value={settings.edgeTtsBackendUrl}
                        onChange={(e) => onSettingChange('edgeTtsBackendUrl', e.target.value)}
                        placeholder="http://localhost:8000"
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-neutral-500">L1 旁白依赖 FastAPI（uvicorn main:app --port 8000）</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">主持 A 音色</label>
                        <select
                            value={settings.edgeTtsVoiceHost1}
                            onChange={(e) => onSettingChange('edgeTtsVoiceHost1', e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                        >
                            {EDGE_TTS_VOICES.map((voice) => (
                                <option key={voice.name} value={voice.name}>{voice.desc}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">主持 B 音色</label>
                        <select
                            value={settings.edgeTtsVoiceHost2}
                            onChange={(e) => onSettingChange('edgeTtsVoiceHost2', e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                        >
                            {EDGE_TTS_VOICES.map((voice) => (
                                <option key={voice.name} value={voice.name}>{voice.desc}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.browserSpeechEnabled}
                        onChange={(e) => onSettingChange('browserSpeechEnabled', e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-neutral-800 border-neutral-700"
                    />
                    <span className="text-xs text-neutral-400">允许浏览器朗读作为 L2 降级</span>
                </label>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">浏览器朗读语速 ({settings.browserSpeechRate.toFixed(1)})</label>
                    <input
                        type="range"
                        min={0.8}
                        max={1.2}
                        step={0.1}
                        value={settings.browserSpeechRate}
                        onChange={(e) => onSettingChange('browserSpeechRate', Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            <button
                onClick={onNarratorTest}
                disabled={narratorTestStatus === 'testing'}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm"
            >
                {narratorTestStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                测试旁白（当前模式）
            </button>

            {narratorTestStatus !== 'idle' && (
                <div className={`mt-2 text-xs p-2 rounded-lg ${narratorTestStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400'
                    : narratorTestStatus === 'error' ? 'bg-red-500/20 text-red-400'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}>
                    {narratorTestMessage}
                </div>
            )}
        </div>
    );
}
