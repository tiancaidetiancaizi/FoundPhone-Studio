import { NativeComposer } from "./DeviceSystem";
import { useSkinState } from "./skinState";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Plus,
  CirclePlus,
  Search,
  MessageCircle,
  Users,
  Compass,
  User,
  Camera,
  Phone,
  Video,
  Settings,
  Heart,
  Send,
  Home,
  Play,
  Bookmark,
  MoreHorizontal,
  Mic,
  Smile,
  Grid,
  CheckCheck,
  AtSign,
  Star,
  Music,
  Image as ImageIcon,
  Layers,
  ShoppingBag,
  FileText,
  MapPin,
  Lock,
} from "lucide-react";
import { safeMedia, type Item, type Runtime, type UiValue } from "./schema";
import { ownerAvatarFor } from "./ownerAvatar";
import { FINALE } from "./finale";
export type SkinProps = {
  ui?: Record<string, UiValue>;
  deviceUi?: Record<string, Record<string, UiValue>>;
  onUi?: (key: string, value: UiValue) => void;
  onRuntime?: (patch: Partial<Runtime>) => void;
  appId?: string;
  owner?: string;
  wechatId?: string;
  finale?: boolean;
  virtualTime?: string;
  date?: string;
  momentsCover?: string;
  name: string;
  items: Item[];
  creator: boolean;
  onRead: (id: string) => void;
  onItem: (i: Item) => void;
  onAdd: () => void;
  onBack: () => void;
  thread: string;
  onThread: (s: string) => void;
};
function Avatar({
  name,
  round = false,
  src = "",
}: {
  name: string;
  round?: boolean;
  src?: string;
}) {
  const resolved = src || ownerAvatarFor(name);
  return (
    <span className={`skin-avatar ${round ? "round" : ""}`}>
      {safeMedia(resolved)?.startsWith("data:image/") ? (
        <img src={safeMedia(resolved)} alt="" />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
function ItemMedia({ item }: { item: Item }) {
  const src = safeMedia(item.media);
  return src ? (
    item.kind === "audio" ? (
      <audio controls src={src} />
    ) : item.kind === "video" ? (
      <video controls playsInline src={src} />
    ) : (
      <img loading="lazy" alt={item.title} src={src} />
    )
  ) : (
    <div className="skin-photo">
      <span>{item.title}</span>
    </div>
  );
}
function MessageCard({ item }: { item: Item }) {
  return item.kind === "file" ? (
    <div className="skin-file-card">
      <FileText size={26} />
      <div>
        <strong>{item.meta?.name || "文件"}</strong>
        <small>{item.meta?.size || "文件"}</small>
      </div>
    </div>
  ) : (
    <div className="skin-location-card">
      <MapPin size={26} />
      <div>
        <strong>{item.meta?.place || "位置"}</strong>
        <small>{item.body || "位置信息"}</small>
      </div>
    </div>
  );
}
function timeSeparator(prev?: string, current?: string) {
  if (!prev || !current) return "";
  const before = new Date(prev.replace(" ", "T")).getTime();
  const after = new Date(current.replace(" ", "T")).getTime();
  if (!Number.isFinite(before) || !Number.isFinite(after)) return "";
  if (after - before < 10 * 60 * 1000) return "";
  const clock = current.slice(11, 16);
  const year = current.slice(0, 4);
  if (prev.slice(0, 10) === current.slice(0, 10)) return clock;
  const month = Number(current.slice(5, 7)),
    day = Number(current.slice(8, 10));
  if (prev.slice(0, 4) !== year) return `${year}年${month}月${day}日 ${clock}`;
  return `${month}月${day}日 ${clock}`;
}
function MessageList({
  items,
  creator,
  onItem,
  onRead,
  whatsapp = false,
}: {
  items: Item[];
  creator: boolean;
  onItem: (i: Item) => void;
  onRead: (id: string) => void;
  whatsapp?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  // 进入聊天默认停在最后一条消息，想翻旧内容自己往上滑
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items.length]);
  return (
    <div
      className={`skin-messages ${whatsapp ? "wa-wallpaper" : ""}`}
      ref={box}
    >
      <div className="skin-date">{items[0]?.time.slice(0, 10)}</div>
      {items.map((i, index) => (
        <Fragment key={i.id}>
          {index > 0 && timeSeparator(items[index - 1].time, i.time) && (
            <div className="skin-time-sep">
              {timeSeparator(items[index - 1].time, i.time)}
            </div>
          )}
          {i.kind === "call" ? (
            <div className="skin-call-log">
              <Phone size={11} />
              {i.body}
            </div>
          ) : i.kind === "system" ? (
            <div className="skin-system-msg">{i.body}</div>
          ) : (
            <div className={`skin-message ${i.outgoing ? "outgoing" : ""}`}>
              {!whatsapp && !i.outgoing && (
                <Avatar name={i.sender} src={i.avatar} />
              )}
              <button
                className="skin-bubble"
                onClick={() => (creator ? onItem(i) : onRead(i.id))}
              >
                {["image", "audio", "video"].includes(i.kind) ? (
                  <ItemMedia item={i} />
                ) : i.kind === "file" || i.kind === "location" ? (
                  <MessageCard item={i} />
                ) : i.kind === "transfer" ? (
                  <div className="skin-transfer">
                    ¥ {i.body}
                    <small>转账记录 · 虚构</small>
                  </div>
                ) : (
                  i.body
                )}
                <small className={whatsapp ? undefined : "wx-message-time"}>
                  {i.time.slice(-5)}{" "}
                  {whatsapp && i.outgoing && <CheckCheck size={11} />}
                </small>
              </button>
              {!whatsapp && i.outgoing && (
                <Avatar name={i.sender} src={i.avatar} />
              )}
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
function Compose({
  creator,
  onAdd,
  wa = false,
}: {
  creator: boolean;
  onAdd: () => void;
  wa?: boolean;
}) {
  return (
    <div className={`skin-compose ${wa ? "wa-compose" : ""}`}>
      {wa ? <Plus size={20} /> : <Mic size={20} />}
      <NativeComposer creator={creator} onAdd={onAdd} />

      <Smile size={21} />
      {wa ? <Mic size={20} /> : <Plus size={22} />}
    </div>
  );
}
function FinaleComposer({ onSent }: { onSent: () => void }) {
  const [text, setText] = useState(""),
    [phase, setPhase] = useState<"idle" | "writing" | "ready">("idle"),
    timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach((t) => clearTimeout(t));
    },
    [],
  );
  const at = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(fn, ms));
  const start = () => {
    if (phase !== "idle") return;
    setPhase("writing");
    at(0, () => setText("我"));
    // 停顿几秒，删掉，再一个字一个字敲出「对不起」
    at(2300, () => setText(""));
    at(2750, () => setText("对"));
    at(3050, () => setText("对不"));
    at(3350, () => setText("对不起"));
    at(3450, () => setPhase("ready"));
  };
  return (
    <div className="skin-compose wx-finale-compose">
      <Mic size={20} />
      <button
        className={"wx-finale-field" + (text ? " has-text" : "")}
        aria-label="输入消息"
        onClick={start}
      >
        <span>{text}</span>
        {phase === "writing" && <i className="wx-caret" />}
      </button>
      <Smile size={21} />
      <button
        className={
          "wx-finale-send" + (phase === "ready" && text ? " ready" : "")
        }
        aria-label="发送消息"
        disabled={phase !== "ready" || !text}
        onClick={() => {
          setText("");
          onSent();
        }}
      >
        <Send size={17} />
      </button>
    </div>
  );
}
export function WeChatSkin(p: SkinProps) {
  const [tab, setTab] = useState("微信"),
    [query, setQuery] = useState(""),
    [moments, setMoments] = useState(false),
    [menu, setMenu] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [utility, setUtility] = useState(""),
    [lockedHint, setLockedHint] = useState("");
  const [readThreads, setReadThreads] = useSkinState<string[]>(
    p,
    "readThreads",
    [],
  );
  const threads = (() => {
    const map = new Map<string, Item[]>();
    for (const i of p.items) {
      if (["朋友圈", "我"].includes(i.folder)) continue;
      const arr = map.get(i.title) ?? [];
      arr.push(i);
      map.set(i.title, arr);
    }
    const rows = [...map.entries()].map(([title, list]) => {
      const rank = Number(list[0]?.meta?.pinOrder ?? "");
      return {
        title,
        list,
        last: list.at(-1)!,
        pinBottom: list.some((i) => i.meta?.pinBottom === "true"),
        rank: Number.isFinite(rank) ? rank : Number.POSITIVE_INFINITY,
        lockedBy: list[0]?.meta?.lockedBy || "",
      };
    });
    // 作者指定的顺序优先；其余按「置底 → 最后一条消息时间」倒序
    rows.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.pinBottom !== b.pinBottom) return a.pinBottom ? 1 : -1;
      return b.last.time.localeCompare(a.last.time);
    });
    return rows;
  })();
  const conversations = threads.map((r) => r.title);
  const contacts = [
    ...new Set(p.items.map((i) => i.sender).filter((s) => s !== "我")),
  ];
  const posts = p.items.filter(
    (i) => i.folder === "朋友圈" || i.kind === "post",
  );
  const cover = safeMedia(p.momentsCover || "") || "";
  const coverSrc = cover.startsWith("data:image/") ? cover : "";
  const typing =
    p.thread === "left" && !!p.ui?.[FINALE.sent] && !p.ui?.[FINALE.replied];
  const hasNewMoment =
    posts.some((i) => i.meta?.newMoment === "true") &&
    !p.ui?.[FINALE.momentsSeen];
  const seeMoments = () => {
    setMoments(true);
    p.onUi?.(FINALE.momentsSeen, true);
  };
  // 读完张峻豪的聊天记录（进入会话默认停在最后一条）
  useEffect(() => {
    if (p.thread !== "张峻豪" || p.ui?.[FINALE.chatRead] || !p.onUi) return;
    const timer = setTimeout(() => p.onUi?.(FINALE.chatRead, true), 1500);
    return () => clearTimeout(timer);
  }, [p.thread, p.ui]);
  // 发送「对不起」之后，left 正在输入，随后发来「我爱你」
  useEffect(() => {
    if (p.thread !== "left" || !p.ui?.[FINALE.sent] || p.ui?.[FINALE.replied])
      return;
    const timer = setTimeout(() => p.onUi?.(FINALE.replied, true), 3200);
    return () => clearTimeout(timer);
  }, [p.thread, p.ui]);
  return (
    <div
      className="wechat-ui independent-skin"
      data-tab={tab}
      data-thread={!!p.thread}
      data-moments={moments}
      data-utility={!!utility}
    >
      <div className="app-nav wx-nav">
        <button
          aria-label={utility || p.thread || moments ? "返回" : "收藏"}
          onClick={() =>
            utility
              ? setUtility("")
              : p.thread
                ? p.onThread("")
                : moments
                  ? setMoments(false)
                  : setUtility("收藏")
          }
        >
          {utility || p.thread || moments ? (
            <ChevronLeft size={22} />
          ) : (
            <Star size={22} />
          )}
        </button>
        <strong>
          {utility ||
            (p.thread
              ? typing
                ? "对方正在输入中"
                : p.thread
              : moments
                ? "朋友圈"
                : tab === "微信"
                  ? p.name
                  : tab)}
        </strong>
        <button
          aria-label={
            p.creator ? "新增内容" : p.thread ? "聊天详情" : "微信菜单"
          }
          onClick={
            p.creator
              ? p.onAdd
              : () => (p.thread ? setUtility("聊天信息") : setMenu(!menu))
          }
        >
          {p.thread ? <MoreHorizontal size={22} /> : <CirclePlus size={22} />}
        </button>
      </div>
      {menu && (
        <div className="wx-popup-menu" role="menu">
          {["搜索", "发起群聊", "添加朋友", "扫一扫", "收付款"].map((label) => (
            <button
              role="menuitem"
              key={label}
              onClick={() => {
                setMenu(false);
                if (label === "搜索") {
                  setSearchOpen(true);
                } else setUtility(label);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {utility ? (
        <div className="skin-scroll wx-utility">
          {utility === "聊天信息" && (
            <div className="wx-members">
              {[
                ...new Set(
                  p.items
                    .filter((i) => i.title === p.thread)
                    .map((i) => i.sender),
                ),
              ].map((name) => (
                <div key={name}>
                  <Avatar
                    name={name}
                    src={p.items.find((i) => i.sender === name)?.avatar}
                  />
                  <small>{name}</small>
                </div>
              ))}
            </div>
          )}
          {p.items
            .filter((i) => i.folder === utility)
            .map((i) => (
              <button
                key={i.id}
                className="wx-discovery"
                onClick={() => p.onItem(i)}
              >
                {i.title}
                <span>›</span>
              </button>
            ))}
          {!p.items.some((i) => i.folder === utility) &&
            utility !== "聊天信息" && <p className="skin-empty">暂无内容</p>}
        </div>
      ) : p.thread ? (
        <>
          <MessageList
            key={p.thread}
            items={p.items.filter(
              (i) =>
                i.title === p.thread &&
                i.kind !== "post" &&
                !["朋友圈", "我"].includes(i.folder),
            )}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
          />
          {p.finale &&
          p.thread === "left" &&
          p.deviceUi?.clock?.[FINALE.midnight] &&
          !p.ui?.[FINALE.sent] &&
          !p.creator ? (
            <FinaleComposer onSent={() => p.onUi?.(FINALE.sent, true)} />
          ) : (
            <Compose creator={p.creator} onAdd={p.onAdd} />
          )}
          {typing && (
            <div className="wx-typing-bubble" aria-live="polite">
              <i />
              <i />
              <i />
            </div>
          )}
        </>
      ) : moments ? (
        <div className="wx-moments">
          <div
            className={`wx-moment-cover${coverSrc ? " has-photo" : ""}`}
            style={
              coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined
            }
          >
            {coverSrc ? (
              <b className="wx-moment-owner">
                <span>{p.owner}</span>
                <Avatar name={p.owner || ""} />
              </b>
            ) : (
              <>
                <Camera size={32} />
                <span>朋友圈</span>
              </>
            )}
          </div>
          {posts.map((i) => {
            const likeKey = String(i.meta?.likeKey || "");
            const liked = !!likeKey && !!p.ui?.[likeKey];
            const hint = i.meta?.likeHint === "true" && !liked;
            return (
              <div className="wx-moment-item" key={i.id}>
                <button
                  className="wx-moment-post"
                  onClick={() => {
                    p.onItem(i);
                    p.onUi?.(FINALE.momentsSeen, true);
                  }}
                >
                  <Avatar name={i.sender} src={i.avatar} />
                  <div>
                    <strong>{i.sender}</strong>
                    <p>{i.body}</p>
                    {i.media && <ItemMedia item={i} />}
                    <small>{i.meta?.relative || i.time}</small>
                  </div>
                </button>
                {likeKey && (
                  <div className="wx-moment-actions">
                    <button
                      className={
                        "wx-moment-like" +
                        (hint ? " hint" : "") +
                        (liked ? " liked" : "")
                      }
                      aria-label={liked ? "已赞这条朋友圈" : "赞这条朋友圈"}
                      aria-pressed={liked}
                      onClick={() => p.onUi?.(likeKey, true)}
                    >
                      <Heart
                        size={17}
                        fill={liked ? "#ed4956" : "none"}
                        color={liked ? "#ed4956" : "currentColor"}
                      />
                      <span>{liked ? "已赞" : "赞"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {!posts.length && <p className="skin-empty">暂无朋友圈动态</p>}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加朋友圈动态
            </button>
          )}
        </div>
      ) : (
        <div className="skin-scroll">
          {tab === "微信" ? (
            <>
              {searchOpen && (
                <label className="wx-search">
                  <Search size={14} />
                  <input
                    aria-label="搜索微信内容"
                    placeholder="搜索"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              )}
              {threads
                .filter(
                  ({ title, list }) =>
                    title.includes(query) ||
                    list.some((i) => i.body.includes(query)),
                )
                .map(({ title: t, list, last, lockedBy }) => {
                  const peer =
                    [...list].reverse().find((i) => !i.outgoing) || last;
                  const locked = !!lockedBy && !p.ui?.[lockedBy];
                  return (
                    <button
                      className={"wx-chat-row" + (locked ? " locked" : "")}
                      key={t}
                      onClick={() => {
                        if (locked) {
                          setLockedHint("这条对话现在还打不开");
                          setTimeout(() => setLockedHint(""), 2200);
                          return;
                        }
                        setReadThreads((v) => (v.includes(t) ? v : [...v, t]));
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <span className="wx-chat-avatar">
                        <Avatar name={t} src={peer.avatar} />
                        {!readThreads.includes(t) &&
                          list.some((i) => !i.read) &&
                          !locked && (
                            <b className="wx-unread">
                              {list.filter((i) => !i.read).length}
                            </b>
                          )}
                        {locked && (
                          <b className="wx-chat-lock">
                            <Lock size={9} />
                          </b>
                        )}
                      </span>
                      <div>
                        <strong>{t}</strong>
                        <p>
                          {locked
                            ? "对话暂时打不开"
                            : last.kind === "file"
                              ? "[文件]"
                              : last.kind === "location"
                                ? "[位置]"
                                : last.body}
                        </p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
              {!conversations.length && <p className="skin-empty">暂无聊天</p>}
            </>
          ) : tab === "通讯录" ? (
            <>
              <div className="wx-section-label">联系人</div>
              {contacts.map((c) => (
                <button
                  key={c}
                  className="wx-contact"
                  onClick={() => {
                    const item = p.items.find((i) => i.sender === c);
                    if (item) {
                      p.onThread(item.title);
                      p.onRead(item.title);
                    }
                  }}
                >
                  <Avatar
                    name={c}
                    src={p.items.find((i) => i.sender === c)?.avatar}
                  />
                  {c}
                </button>
              ))}
            </>
          ) : tab === "发现" ? (
            <div className="wx-discover-groups">
              {[
                [Camera, "朋友圈", "#26a958"],
                [Play, "视频号", "#fa9d3b"],
                [Music, "听一听", "#fa5151"],
              ].map(([Icon, label, color]) => {
                const Glyph = Icon as typeof Camera;
                return (
                  <button
                    key={String(label)}
                    className="wx-discovery"
                    onClick={() =>
                      label === "朋友圈"
                        ? seeMoments()
                        : setUtility(String(label))
                    }
                  >
                    <Glyph size={22} style={{ color: String(color) }} />
                    {String(label)}
                    {label === "朋友圈" && hasNewMoment && (
                      <b className="wx-dot" aria-hidden="true" />
                    )}
                    <span>›</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="wx-profile">
                <Avatar name={p.owner || "机主"} />
                <div>
                  <h2>{p.owner || "机主"}</h2>
                  <small>微信号：{p.wechatId || "未设置"}</small>
                  <button
                    className="wx-profile-status"
                    onClick={() => setUtility("状态")}
                  >
                    ＋ 状态
                  </button>
                </div>
              </div>
              <div className="wx-profile-menu">
                {[
                  [MessageCircle, "服务", "#07c160"],
                  [Layers, "收藏", "#e8a828"],
                  [ImageIcon, "朋友圈", "#3a9bd9"],
                  [Layers, "作品", "#329dd8"],
                  [ShoppingBag, "小店与卡包", "#ed7c59"],
                  [Smile, "表情", "#f7b900"],
                  [Settings, "设置", "#1696d2"],
                ].map(([Icon, label, color]) => {
                  const Glyph = Icon as typeof Settings;
                  return (
                    <button
                      key={String(label)}
                      className="wx-discovery"
                      onClick={() =>
                        label === "朋友圈"
                          ? seeMoments()
                          : setUtility(String(label))
                      }
                    >
                      <Glyph size={22} style={{ color: String(color) }} />
                      {String(label)}
                      {label === "朋友圈" && hasNewMoment && (
                        <b className="wx-dot" aria-hidden="true" />
                      )}
                      <span>›</span>
                    </button>
                  );
                })}
              </div>
              {p.items
                .filter((i) => i.folder === "我")
                .map((i) => (
                  <button
                    className="wx-discovery"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <User size={18} />
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
              {p.creator && (
                <button className="phone-add" onClick={p.onAdd}>
                  编辑个人资料内容
                </button>
              )}
            </>
          )}
        </div>
      )}
      {!p.thread && !moments && !utility && (
        <nav className="wx-bottom">
          {[
            { label: "微信", icon: MessageCircle },
            { label: "通讯录", icon: Users },
            { label: "发现", icon: Compass },
            { label: "我", icon: User },
          ].map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              aria-label={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={21} />
              <span>{t.label}</span>
              {t.label === "发现" && hasNewMoment && (
                <b className="wx-dot" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
      )}
      {lockedHint && <div className="wx-locked-toast">{lockedHint}</div>}
    </div>
  );
}
export function WhatsAppSkin(p: SkinProps) {
  const [tab, setTab] = useState("聊天"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("全部");
  const tabs = [
    { label: "动态", icon: Compass },
    { label: "通话", icon: Phone },
    { label: "社区", icon: Users },
    { label: "聊天", icon: MessageCircle },
    { label: "设置", icon: Settings },
  ];
  const conversations = [
    ...new Set(
      p.items
        .filter((i) => !["动态", "通话", "社区", "设置"].includes(i.folder))
        .filter((i) => filter !== "未读" || !i.read)
        .map((i) => i.title),
    ),
  ];
  const name = tab === "聊天" ? p.name : tab;
  return (
    <div className="whatsapp-ui independent-skin">
      <div className="app-nav wa-nav">
        <button
          aria-label="返回"
          onClick={() => (p.thread ? p.onThread("") : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{p.thread || name}</strong>
        <button
          aria-label={p.creator ? "新增内容" : "搜索内容"}
          onClick={
            p.creator
              ? p.onAdd
              : () =>
                  document
                    .querySelector<HTMLInputElement>(".wa-search input")
                    ?.focus()
          }
        >
          {p.creator ? <Plus size={21} /> : <Search size={20} />}
        </button>
      </div>
      {p.thread ? (
        <>
          <div className="wa-thread-profile">
            <button aria-label="返回聊天列表" onClick={() => p.onThread("")}>
              <ChevronLeft size={23} />
            </button>
            <Avatar
              name={p.thread}
              src={p.items.find((i) => i.title === p.thread)?.avatar}
              round
            />
            <div>
              <strong>{p.thread}</strong>
              <small>联系人</small>
            </div>
            <Video size={18} />
            <Phone size={17} />
          </div>
          <MessageList
            key={p.thread}
            items={p.items.filter((i) => i.title === p.thread)}
            creator={p.creator}
            onItem={p.onItem}
            onRead={p.onRead}
            whatsapp
          />
          <Compose creator={p.creator} onAdd={p.onAdd} wa />
        </>
      ) : (
        <div className="skin-scroll">
          <h1 className="wa-large-title">{tab}</h1>
          {tab === "聊天" ? (
            <>
              <label className="wa-search">
                <Search size={16} />
                <input
                  placeholder="搜索"
                  aria-label="搜索WhatsApp"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <div className="wa-filters">
                {["全部", "未读", "群组"].map((f) => (
                  <button
                    key={f}
                    className={filter === f ? "selected" : ""}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {conversations
                .filter((t) => t.includes(query))
                .filter(
                  (t) =>
                    filter !== "群组" ||
                    p.items.some((i) => i.title === t && i.folder === "群组"),
                )
                .map((t) => {
                  const last = p.items.filter((i) => i.title === t).at(-1)!;
                  return (
                    <button
                      className="wa-chat-row"
                      key={t}
                      onClick={() => {
                        p.onThread(t);
                        p.onRead(t);
                      }}
                    >
                      <Avatar name={t} src={last.avatar} round />
                      <div>
                        <strong>{t}</strong>
                        <p>
                          {last.outgoing && <CheckCheck size={12} />}{" "}
                          {last.body}
                        </p>
                      </div>
                      <time>{last.time.slice(-5)}</time>
                    </button>
                  );
                })}
            </>
          ) : tab === "设置" ? (
            <>
              <div className="wa-settings-profile">
                <Avatar name="我" round />
                <h2>个人资料</h2>
              </div>
              {p.items
                .filter((i) => i.folder === "设置")
                .map((i) => (
                  <button
                    key={i.id}
                    className="wa-record"
                    onClick={() => p.onItem(i)}
                  >
                    {i.title}
                    <span>›</span>
                  </button>
                ))}
            </>
          ) : (
            <>
              {tab === "动态" && (
                <div className="wa-status">
                  <Avatar name="我" round />
                  <span>我的状态</span>
                  {p.creator && (
                    <button aria-label="添加状态" onClick={p.onAdd}>
                      <Plus size={17} />
                    </button>
                  )}
                </div>
              )}
              {p.items
                .filter(
                  (i) =>
                    i.folder === tab || (tab === "通话" && i.kind === "call"),
                )
                .map((i) => (
                  <button
                    className="wa-record"
                    key={i.id}
                    onClick={() => p.onItem(i)}
                  >
                    <Avatar name={i.sender} src={i.avatar} round />
                    <div>
                      <strong>{i.title}</strong>
                      <p>{i.body}</p>
                    </div>
                    <span>
                      {tab === "通话" ? (
                        <Phone size={17} />
                      ) : (
                        <ChevronLeft size={15} />
                      )}
                    </span>
                  </button>
                ))}
              {!p.items.some((i) => i.folder === tab) && (
                <p className="skin-empty">暂无{tab}内容</p>
              )}
            </>
          )}
          {p.creator && (
            <button className="phone-add" onClick={p.onAdd}>
              添加{tab === "聊天" ? "聊天" : tab}内容
            </button>
          )}
        </div>
      )}
      {!p.thread && (
        <nav className="wa-bottom">
          {tabs.map((t) => (
            <button
              className={tab === t.label ? "selected" : ""}
              key={t.label}
              aria-label={t.label}
              onClick={() => setTab(t.label)}
            >
              <t.icon size={20} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
export function InstagramSkin(p: SkinProps) {
  const [tab, setTab] = useState("首页"),
    [dm, setDm] = useState(false),
    [query, setQuery] = useState(""),
    [likes, setLikes] = useSkinState<string[]>(p, "likes", []),
    [saved, setSaved] = useSkinState<string[]>(p, "saved", []),
    [showSaved, setShowSaved] = useState(false);
  const posts = p.items.filter(
      (i) =>
        i.kind === "post" ||
        !["私信", "Story", "Reels", "个人主页"].includes(i.folder),
    ),
    stories = p.items.filter((i) => i.folder === "Story"),
    reels = p.items.filter((i) => i.kind === "video" || i.folder === "Reels"),
    messages = p.items.filter((i) => i.folder === "私信");
  const tabs = [
    { label: "首页", icon: Home },
    { label: "搜索", icon: Search },
    { label: "Reels", icon: Play },
    { label: "个人主页", icon: User },
  ];
  const shown = (
    showSaved ? posts.filter((i) => saved.includes(i.id)) : posts
  ).filter((i) => (i.title + i.body + i.sender).includes(query));
  return (
    <div className="instagram-ui independent-skin">
      <div className="app-nav ig-nav">
        <button
          aria-label="返回"
          onClick={() => (dm ? setDm(false) : p.onBack())}
        >
          <ChevronLeft size={22} />
        </button>
        <strong>{dm ? "私信" : p.name}</strong>
        <div>
          {p.creator && (
            <button aria-label="新增内容" onClick={p.onAdd}>
              <Plus size={21} />
            </button>
          )}
          <button aria-label="Instagram 私信" onClick={() => setDm(!dm)}>
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="skin-scroll ig-scroll">
        {dm ? (
          <>
            {messages.map((i) => (
              <button
                key={i.id}
                className="ig-dm-row"
                onClick={() => p.onItem(i)}
              >
                <Avatar name={i.sender} round />
                <div>
                  <strong>{i.sender}</strong>
                  <p>{i.body}</p>
                </div>
              </button>
            ))}
            {!messages.length && <p className="skin-empty">暂无私信</p>}
            {p.creator && (
              <button className="phone-add" onClick={p.onAdd}>
                添加私信
              </button>
            )}
          </>
        ) : tab === "首页" ? (
          <>
            <div className="ig-stories">
              <button
                className="ig-story"
                onClick={
                  p.creator
                    ? p.onAdd
                    : () => {
                        if (stories[0]) p.onItem(stories[0]);
                      }
                }
                disabled={!p.creator && !stories.length}
              >
                <span>
                  <Avatar name="我" round />
                </span>
                <small>你的快拍</small>
              </button>
              {stories.map((i) => (
                <button
                  key={i.id}
                  className="ig-story"
                  onClick={() => p.onItem(i)}
                >
                  <span>
                    <Avatar name={i.sender} round />
                  </span>
                  <small>{i.sender}</small>
                </button>
              ))}
            </div>
            {posts.map((i) => (
              <article className="ig-post" key={i.id}>
                <div className="ig-post-author">
                  <Avatar name={i.sender} round />
                  <strong>{i.sender}</strong>
                  <button
                    aria-label={`帖子详情${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </div>
                <button className="ig-post-media" onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
                <div className="ig-post-controls">
                  <button
                    aria-label={`喜欢${i.title}`}
                    onClick={() =>
                      setLikes(
                        likes.includes(i.id)
                          ? likes.filter((x) => x !== i.id)
                          : [...likes, i.id],
                      )
                    }
                  >
                    <Heart
                      size={23}
                      fill={likes.includes(i.id) ? "#ed4956" : "none"}
                      color={likes.includes(i.id) ? "#ed4956" : "currentColor"}
                    />
                  </button>
                  <button
                    aria-label={`评论${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <MessageCircle size={22} />
                  </button>
                  <button
                    aria-label={`查看${i.title}`}
                    onClick={() => p.onItem(i)}
                  >
                    <Send size={21} />
                  </button>
                  <button
                    aria-label={`收藏${i.title}`}
                    onClick={() =>
                      setSaved(
                        saved.includes(i.id)
                          ? saved.filter((x) => x !== i.id)
                          : [...saved, i.id],
                      )
                    }
                  >
                    <Bookmark
                      size={22}
                      fill={saved.includes(i.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="ig-post-caption">
                  <strong>
                    {i.likes + (likes.includes(i.id) ? 1 : 0)} 次赞
                  </strong>
                  <p>
                    <b>{i.sender}</b> {i.body}
                  </p>
                  <button onClick={() => p.onItem(i)}>
                    查看全部 {i.comments.length} 条评论
                  </button>
                  <time>{i.time}</time>
                </div>
              </article>
            ))}
          </>
        ) : tab === "搜索" ? (
          <>
            <label className="ig-search">
              <Search size={15} />
              <input
                value={query}
                aria-label="搜索Instagram"
                placeholder="搜索"
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        ) : tab === "Reels" ? (
          <>
            {reels.map((i) => (
              <div className="ig-reel" key={i.id}>
                <ItemMedia item={i} />
                <button onClick={() => p.onItem(i)}>
                  {i.sender} · {i.title}
                </button>
              </div>
            ))}
            {!reels.length && <p className="skin-empty">暂无 Reels</p>}
          </>
        ) : (
          <>
            <div className="ig-profile">
              <Avatar name={posts[0]?.sender ?? "我"} round />
              <div>
                <strong>{posts.length}</strong>
                <small>帖子</small>
              </div>
              <div>
                <strong>0</strong>
                <small>关注者</small>
              </div>
              <div>
                <strong>0</strong>
                <small>正在关注</small>
              </div>
            </div>
            <h3 className="ig-profile-name">{posts[0]?.sender ?? "我"}</h3>
            <div className="ig-profile-tabs">
              <button aria-label="帖子网格" onClick={() => setShowSaved(false)}>
                <Grid size={21} />
              </button>
              <button
                aria-label="已收藏帖子"
                onClick={() => setShowSaved(true)}
              >
                <Bookmark size={21} />
              </button>
              <button
                aria-label="资料内容"
                onClick={() => {
                  const i = p.items.find((i) => i.folder === "个人主页");
                  if (i) p.onItem(i);
                  else if (p.creator) p.onAdd();
                }}
              >
                <AtSign size={21} />
              </button>
            </div>
            <div className="ig-explore">
              {shown.map((i) => (
                <button key={i.id} onClick={() => p.onItem(i)}>
                  <ItemMedia item={i} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <nav className="ig-bottom">
        {tabs.map((t) => (
          <button
            key={t.label}
            className={tab === t.label ? "selected" : ""}
            aria-label={`Instagram ${t.label}`}
            onClick={() => {
              setTab(t.label);
              setDm(false);
            }}
          >
            <t.icon size={23} />
          </button>
        ))}
      </nav>
    </div>
  );
}
