import { describe, expect, it } from "vitest";
import { ShowTimeline } from "@shared/types/radio-core";
import { getShowConfig } from "./show-config";
import { enforceTimelineConstraints } from "./timeline-constraints";

describe("enforceTimelineConstraints", () => {
  it("在空 blocks 场景会补齐开场/音乐/结尾结构", () => {
    const config = getShowConfig("talk");
    const input: ShowTimeline = {
      id: "empty",
      estimatedDuration: 60,
      blocks: [],
    };

    const output = enforceTimelineConstraints(input, {
      showType: "talk",
      config,
      targetDuration: 420,
    });

    expect(output.estimatedDuration).toBe(420);
    expect(output.blocks.length).toBeGreaterThanOrEqual(3);
    expect(output.blocks[0].type).toBe("talk");
    expect(output.blocks.some((block) => block.type === "music")).toBe(true);
    expect(output.blocks[output.blocks.length - 1].type).toBe("talk");
  });

  it("会修正不合法顺序并补齐 talk block 最小台词数", () => {
    const config = getShowConfig("nighttalk");
    const input: ShowTimeline = {
      id: "bad-order",
      estimatedDuration: 120,
      blocks: [
        {
          type: "music",
          id: "music-1",
          action: "play",
          search: "ambient",
        },
        {
          type: "talk",
          id: "talk-1",
          scripts: [{ speaker: "host1", text: "一句话" }],
        },
      ],
    };

    const output = enforceTimelineConstraints(input, {
      showType: "nighttalk",
      config,
      targetDuration: 500,
    });

    expect(output.blocks[0].type).toBe("talk");
    expect(output.blocks[output.blocks.length - 1].type).toBe("talk");

    const talkBlocks = output.blocks.filter((block) => block.type === "talk");
    talkBlocks.forEach((block) => {
      if (block.type === "talk") {
        expect(block.scripts.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it("对中高互动节目会补齐至少一段互动 cue", () => {
    const config = getShowConfig("entertainment");
    const input: ShowTimeline = {
      id: "no-interaction",
      estimatedDuration: 200,
      blocks: [
        {
          type: "talk",
          id: "talk-1",
          scripts: [{ speaker: "host1", text: "今天我们聊一个热门话题。" }],
        },
        {
          type: "music",
          id: "music-1",
          action: "play",
          search: "pop",
        },
        {
          type: "talk",
          id: "talk-2",
          scripts: [{ speaker: "host2", text: "最后做个总结。" }],
        },
      ],
    };

    const output = enforceTimelineConstraints(input, {
      showType: "entertainment",
      config,
      targetDuration: 420,
    });

    const talkText = output.blocks
      .filter((block) => block.type === "talk")
      .flatMap((block) => (block.type === "talk" ? block.scripts.map((line) => line.text) : []))
      .join(" ");

    expect(/听众|留言|来信|点歌|提问|弹幕|投票/.test(talkText)).toBe(true);
  });
});
