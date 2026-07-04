from __future__ import annotations

import io
from typing import Any, Dict, List

import edge_tts

DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"


async def synthesize_speech(
    text: str,
    voice: str = DEFAULT_VOICE,
    rate: str = "+0%",
    volume: str = "+0%",
    pitch: str = "+0Hz",
) -> bytes:
    cleaned = text.strip()
    if not cleaned:
        raise ValueError("Text is required")

    communicate = edge_tts.Communicate(
        cleaned,
        voice or DEFAULT_VOICE,
        rate=rate,
        volume=volume,
        pitch=pitch,
    )

    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])

    audio = buffer.getvalue()
    if not audio:
        raise RuntimeError("edge-tts returned empty audio")
    return audio


async def list_voices(locale_prefix: str | None = "zh-CN") -> List[Dict[str, Any]]:
    voices = await edge_tts.list_voices()
    if locale_prefix:
        voices = [voice for voice in voices if voice.get("Locale", "").startswith(locale_prefix)]
    return [
        {
            "name": voice.get("ShortName"),
            "locale": voice.get("Locale"),
            "gender": voice.get("Gender"),
            "friendlyName": voice.get("FriendlyName"),
        }
        for voice in voices
        if voice.get("ShortName")
    ]


async def health_status() -> Dict[str, Any]:
    voices = await list_voices(None)
    return {
        "status": "ok",
        "engine": "edge-tts",
        "voiceCount": len(voices),
    }
