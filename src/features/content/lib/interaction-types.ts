import { ShowType } from "./cast-system";
import { InteractionLevel } from "./show-config";

export type InteractionType =
  | "letter_reading"
  | "song_request"
  | "question"
  | "story_share"
  | "topic_vote";

interface InteractionTemplate {
  type: InteractionType;
  cue: string;
  pattern: string;
}

const INTERACTION_LIBRARY: Record<ShowType, InteractionTemplate[]> = {
  talk: [
    { type: "letter_reading", cue: "听众来信", pattern: "主持人读信 -> 另一位主持人回应 -> 给建议" },
    { type: "question", cue: "听众提问", pattern: "提问 -> 观点分歧 -> 收束共识" },
  ],
  interview: [
    { type: "question", cue: "听众追问", pattern: "快问快答 -> 嘉宾补充案例" },
    { type: "story_share", cue: "听众经历", pattern: "听众故事 -> 主持人与嘉宾反馈" },
  ],
  news: [
    { type: "question", cue: "听众关切", pattern: "新闻事实 -> 听众疑问 -> 主持人解释影响" },
  ],
  drama: [
    { type: "story_share", cue: "角色来信", pattern: "角色困境 -> 另一角色回应 -> 剧情推进" },
  ],
  entertainment: [
    { type: "topic_vote", cue: "弹幕投票", pattern: "公布选项 -> 票选结果 -> 主持人抛梗" },
    { type: "question", cue: "快问快答", pattern: "连环短问 -> 反转回答 -> 热点回扣" },
  ],
  story: [
    { type: "story_share", cue: "听众投稿", pattern: "投稿引子 -> 主持人讲述 -> 共鸣收束" },
  ],
  history: [
    { type: "question", cue: "历史提问", pattern: "听众提问 -> 背景补充 -> 当代启示" },
  ],
  science: [
    { type: "question", cue: "误区提问", pattern: "听众误区 -> 原理解释 -> 生活类比" },
  ],
  mystery: [
    { type: "story_share", cue: "匿名来信", pattern: "来信线索 -> 主持人推理 -> 开放结尾" },
  ],
  nighttalk: [
    { type: "letter_reading", cue: "深夜来信", pattern: "读信共情 -> 主持人温柔回应 -> 晚安收束" },
    { type: "story_share", cue: "听众倾诉", pattern: "倾诉 -> 共鸣 -> 具体建议" },
  ],
  music: [
    { type: "song_request", cue: "点歌请求", pattern: "听众点歌 -> 主持人讲选曲理由 -> 放歌" },
  ],
};

export function getInteractionTemplates(showType: ShowType): InteractionTemplate[] {
  return INTERACTION_LIBRARY[showType] || INTERACTION_LIBRARY.talk;
}

export function buildInteractionPromptSection(showType: ShowType, level: InteractionLevel): string {
  if (level === "none") {
    return "## 📬 互动策略\n本期无需强制互动段，但可保留一句简短听众视角转场。";
  }

  const templates = getInteractionTemplates(showType).slice(0, 2);
  const minCount = level === "high" ? 2 : 1;

  const examples = templates
    .map((template, index) => `${index + 1}. ${template.type}（${template.cue}）：${template.pattern}`)
    .join("\n");

  return `## 📬 互动策略
本期至少包含 ${minCount} 段互动内容（可真实来信或“虚拟听众互动”）。
推荐模板：
${examples}

可用开场句示例：
- “刚收到一条听众消息说……”
- “有位朋友在留言区问到……”
- “我们来看看今天这条点歌请求……”`;
}

export function getInteractionFallbackLine(showType: ShowType): string {
  const firstTemplate = getInteractionTemplates(showType)[0];
  if (!firstTemplate) {
    return "有听众留言问到这个问题，我们就从这里展开。";
  }

  return `插播一条${firstTemplate.cue}：我们按这个问题继续展开聊聊。`;
}
