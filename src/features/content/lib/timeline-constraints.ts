import { ShowTimeline, TimelineBlock, TalkBlock, MusicBlock } from "@shared/types/radio-core";
import { ShowType } from "./cast-system";
import { ShowConfig } from "./show-config";
import { getInteractionFallbackLine } from "./interaction-types";

interface ConstraintContext {
  showType: ShowType;
  config: ShowConfig;
  targetDuration: number;
}

function createTalkBlock(id: string, text: string): TalkBlock {
  return {
    type: "talk",
    id,
    scripts: [
      {
        speaker: "host1",
        text,
        mood: "warm",
      },
    ],
  };
}

function createInteractionTalkBlock(id: string, text: string): TalkBlock {
  return {
    type: "talk",
    id,
    scripts: [
      {
        speaker: "host1",
        text,
        mood: "warm",
      },
      {
        speaker: "host2",
        text: "这个问题很有代表性，我们结合本期主题给出一个更具体的回应。",
        mood: "calm",
      },
    ],
  };
}

function createMusicBlock(id: string, duration: number): MusicBlock {
  return {
    type: "music",
    id,
    action: "play",
    search: "轻松电台过渡音乐",
    duration: Math.max(20, Math.min(duration, 90)),
  };
}

function isTalkBlock(block: TimelineBlock): block is TalkBlock {
  return block.type === "talk";
}

function hasInteractionCue(block: TalkBlock): boolean {
  const interactionKeywords = ["听众", "留言", "来信", "点歌", "提问", "弹幕", "投票"];
  return block.scripts.some((line) =>
    interactionKeywords.some((keyword) => line.text.includes(keyword))
  );
}

function appendSafetyLines(block: TalkBlock, minLines: number): void {
  const target = Math.max(1, Math.min(minLines, 4));
  const fallbackLines = [
    "先把这个核心观点说清楚，再往下展开。",
    "你这个角度很有意思，我补充一个更具体的例子。",
    "我们把原因和影响分开聊，会更容易理解。",
    "最后给听众一个可执行的小建议，便于落地。",
  ];

  if (!Array.isArray(block.scripts)) {
    block.scripts = [];
  }

  if (block.scripts.length === 0) {
    block.scripts.push({
      speaker: "host1",
      text: "我们先从今天的核心话题开始。",
      mood: "warm",
    });
  }

  let index = 0;
  while (block.scripts.length < target) {
    const speaker = block.scripts.length % 2 === 0 ? "host1" : "host2";
    block.scripts.push({
      speaker,
      text: fallbackLines[index % fallbackLines.length],
      mood: "calm",
    });
    index += 1;
  }
}

export function enforceTimelineConstraints(
  rawTimeline: ShowTimeline,
  context: ConstraintContext
): ShowTimeline {
  const timeline: ShowTimeline = {
    ...rawTimeline,
    id: rawTimeline.id || `timeline-${Date.now()}`,
    title: rawTimeline.title || "电台节目",
    estimatedDuration: context.targetDuration,
    blocks: Array.isArray(rawTimeline.blocks) ? [...rawTimeline.blocks] : [],
  };

  if (timeline.blocks.length === 0) {
    timeline.blocks.push(
      createTalkBlock("opening-1", "欢迎来到本期节目，我们先快速进入主题。"),
      createMusicBlock("music-1", 45),
      createTalkBlock("closing-1", "感谢收听，我们下期节目再见。")
    );
  }

  // 统一补齐 block id，避免下游播放流程异常
  timeline.blocks = timeline.blocks.map((block, index) => ({
    ...block,
    id: block.id || `block-${index + 1}`,
  }));

  if (!isTalkBlock(timeline.blocks[0])) {
    timeline.blocks.unshift(
      createTalkBlock("opening-fallback", "欢迎收听，先和你聊聊今天最值得关注的话题。")
    );
  }

  const lastBlock = timeline.blocks[timeline.blocks.length - 1];
  if (!isTalkBlock(lastBlock)) {
    timeline.blocks.push(createTalkBlock("closing-fallback", "这期先到这里，祝你今天顺利。"));
  }

  const hasMusic = timeline.blocks.some((block) => block.type === "music");
  const needMusic = context.config.musicRatio[1] > 0;
  if (needMusic && !hasMusic) {
    const insertIndex = Math.max(1, timeline.blocks.length - 1);
    timeline.blocks.splice(insertIndex, 0, createMusicBlock("music-fallback", 40));
  }

  const talkBlocks = timeline.blocks.filter(isTalkBlock);
  const preferredTalkSegments = context.config.preferredSegmentOrder.filter(
    (segment) => segment !== "music_break"
  ).length;
  const minTalkBlocks = Math.max(2, Math.min(preferredTalkSegments, 3));

  while (talkBlocks.length < minTalkBlocks) {
    const insertIndex = Math.max(1, timeline.blocks.length - 1);
    const id = `talk-fallback-${talkBlocks.length + 1}`;
    timeline.blocks.splice(
      insertIndex,
      0,
      createTalkBlock(id, "我们继续沿着主线推进，把这个问题讲得更具体一点。")
    );
    talkBlocks.push(timeline.blocks[insertIndex] as TalkBlock);
  }

  const requiresInteraction =
    context.config.interactionLevel === "medium" || context.config.interactionLevel === "high";
  if (requiresInteraction) {
    const hasInteractionTalk = timeline.blocks
      .filter(isTalkBlock)
      .some((block) => hasInteractionCue(block));

    if (!hasInteractionTalk) {
      const insertIndex = Math.max(1, timeline.blocks.length - 1);
      timeline.blocks.splice(
        insertIndex,
        0,
        createInteractionTalkBlock(
          `interaction-fallback-${Date.now()}`,
          getInteractionFallbackLine(context.showType)
        )
      );
    }
  }

  timeline.blocks.forEach((block) => {
    if (isTalkBlock(block)) {
      appendSafetyLines(block, context.config.scriptDensity.minLinesPerTalkBlock);
    }
  });

  return timeline;
}
