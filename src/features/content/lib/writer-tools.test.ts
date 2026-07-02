import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeToolCall } from "./writer-tools";

vi.mock("@shared/services/ai-service", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@shared/services/ai-service";

const parseTimeline = vi.fn(() => ({
  id: "timeline-test",
  estimatedDuration: 120,
  blocks: [{ type: "talk", id: "talk-1", scripts: [{ speaker: "host1", text: "ok" }] }],
}));

function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(""),
  } as unknown as Response;
}

describe("writer tools extensions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("search_knowledge 在远端可用时返回百科结果", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      mockJsonResponse([
        "量子力学",
        ["量子力学", "量子叠加"],
        ["描述微观粒子行为的理论", "多个状态可同时存在"],
        ["https://zh.wikipedia.org/wiki/量子力学", "https://zh.wikipedia.org/wiki/量子叠加"],
      ])
    );

    const result = await executeToolCall(
      "search_knowledge",
      { query: "量子力学", limit: 2 },
      parseTimeline
    );

    expect(result.success).toBe(true);
    const data = result.data as { source: string; items: Array<{ title: string }> };
    expect(data.source).toBe("wikipedia_opensearch");
    expect(data.items.length).toBe(2);
    expect(data.items[0].title).toContain("量子");
  });

  it("fetch_trending 会优先从新闻提取热点", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(
      mockJsonResponse({
        code: 201,
        data: {
          date: "2026-07-02",
          title: "今日快讯",
          news: [
            { title: "科技公司发布新 AI 终端" },
            { title: "文娱行业暑期档热度上升" },
            { title: "城市夜间经济持续复苏" },
          ],
        },
      })
    );

    const result = await executeToolCall(
      "fetch_trending",
      { topic: "科技", count: 2 },
      parseTimeline
    );

    expect(result.success).toBe(true);
    const data = result.data as { source: string; items: string[] };
    expect(data.source).toBe("news_service");
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.join(" ")).toContain("科技");
  });

  it("search_quotes 会优先返回主题相关金句", async () => {
    const result = await executeToolCall(
      "search_quotes",
      { theme: "成长", count: 2 },
      parseTimeline
    );

    expect(result.success).toBe(true);
    const data = result.data as { quotes: Array<{ quote: string }> };
    expect(data.quotes.length).toBe(2);
    expect(data.quotes[0].quote).toContain("成长");
  });
});
