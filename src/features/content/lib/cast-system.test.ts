import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CastDirector, ShowType } from "./cast-system";

const SHOW_TYPES: ShowType[] = [
  "talk",
  "interview",
  "news",
  "drama",
  "entertainment",
  "story",
  "history",
  "science",
  "mystery",
  "nighttalk",
  "music",
];

function sampleDistribution(iterations: number): Record<ShowType, number> {
  const director = new CastDirector();
  const counts = Object.fromEntries(
    SHOW_TYPES.map((type) => [type, 0])
  ) as Record<ShowType, number>;

  for (let i = 0; i < iterations; i += 1) {
    const selected = director.randomShowType();
    counts[selected] += 1;
  }

  return counts;
}

describe("CastDirector.randomShowType", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("在常规时段可覆盖全部节目类型且包含 news/drama", () => {
    vi.setSystemTime(new Date("2026-07-02T14:00:00.000Z"));
    const counts = sampleDistribution(3000);

    SHOW_TYPES.forEach((type) => {
      expect(counts[type]).toBeGreaterThan(0);
    });

    // news/drama 是低频类型，但应明确可被采样到
    expect(counts.news).toBeGreaterThan(60);
    expect(counts.drama).toBeGreaterThan(40);

    // talk 的权重显著高于 drama，抽样中应体现这一趋势
    expect(counts.talk).toBeGreaterThan(counts.drama);
  });

  it("早间时段 news 出现率高于常规时段", () => {
    // 使用本地时间字符串，避免 UTC(Z) 导致时区偏移误测
    vi.setSystemTime(new Date("2026-07-02T14:00:00"));
    const neutralCounts = sampleDistribution(4000);
    const neutralNewsRate = neutralCounts.news / 4000;

    vi.setSystemTime(new Date("2026-07-02T08:00:00"));
    const morningCounts = sampleDistribution(4000);
    const morningNewsRate = morningCounts.news / 4000;

    // 早间权重提升后，新闻占比应有统计可见提升（保留随机波动余量）
    expect(morningNewsRate).toBeGreaterThan(neutralNewsRate + 0.005);
  });
});
