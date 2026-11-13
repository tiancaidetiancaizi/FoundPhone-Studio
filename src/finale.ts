import type { Runtime } from "./schema";
/**
 * 《妈妈》结尾流程用到的开关。
 * 全部写在 runtime.ui 里（随存档一起保存），数据侧再用 unlock="ui:app:key"
 * 控制朋友圈、聊天记录的显隐，避免把剧情硬编码进界面。
 */
export const FINALE = {
  /** 张峻豪会话：打开过任意其它 App 后解锁 */
  chatLock: "zjUnlocked",
  /** 读完张峻豪的聊天记录 */
  chatRead: "zjRead",
  /** 给 left 的新朋友圈点了赞 */
  momentLiked: "momentLiked",
  /** 看过朋友圈（用于消除红点） */
  momentsSeen: "momentsSeen",
  /** 世界时钟点击后进入 11.19 00:00 */
  midnight: "midnight",
  /** 发送了「对不起」 */
  sent: "sent",
  /** left 回复「我爱你」 */
  replied: "replied",
} as const;
export const uiOf = (s: Runtime, app: string) => s.ui?.[app] ?? {};
/** 点赞之前，时钟打不开（仅带结局演出的作品） */
export const clockLocked = (s: Runtime, finale: boolean) =>
  finale && !uiOf(s, "wechat")[FINALE.momentLiked];
