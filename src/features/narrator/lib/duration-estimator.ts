const MIN_MS = 2000;
const MAX_MS = 30000;
const MS_PER_CJK_CHAR = 280;
const MS_PER_LATIN_WORD = 320;

function countCjkChars(text: string): number {
    return (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
}

function countLatinWords(text: string): number {
    const latin = text.replace(/[\u4e00-\u9fff]/g, ' ').trim();
    if (!latin) return 0;
    return latin.split(/\s+/).filter(Boolean).length;
}

export function estimateSpeechDuration(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) return MIN_MS;

    const cjk = countCjkChars(trimmed);
    const words = countLatinWords(trimmed);
    const estimated = cjk * MS_PER_CJK_CHAR + words * MS_PER_LATIN_WORD;

    return Math.max(MIN_MS, Math.min(MAX_MS, estimated));
}
