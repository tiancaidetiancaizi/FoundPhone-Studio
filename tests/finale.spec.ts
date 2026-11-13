import { test, expect } from "@playwright/test";
import { unlockPhone } from "./support/unlock";

/**
 * 结局剧情链：张峻豪对话初始锁定 → 点其它 App 解锁 → 读完弹出新朋友圈 →
 * 点赞解锁时钟 → 世界时钟跳到 11-19 00:00 → left 发「生日快乐」→
 * 输入栏自动打出「我」「对不起」→ 玩家发送 → 对方正在输入 → 「我爱你」。
 */
test("finale flow: locked chat, new moment, midnight clock and scripted reply", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await unlockPhone(page);

  // 1. 微信会话顺序 + 张峻豪初始锁定
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  const rows = page.locator(".wx-chat-row strong");
  await expect(rows).toHaveCount(4);
  expect(await rows.allTextContents()).toEqual([
    "张峻豪",
    "left",
    "李老师",
    "狗东西",
  ]);
  await expect(page.locator(".wx-chat-row.locked")).toHaveCount(1);
  await page.locator(".wx-chat-row.locked").click();
  await expect(page.locator(".wx-locked-toast")).toHaveText(
    "这条对话现在还打不开",
  );

  // 2. 桌面上除时钟外的 App 全部点过之后才解锁，并给出微信提示
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  const desktopApps = [
    "打开微信",
    "打开备忘录",
    "打开相册",
    "打开邮件",
    "打开论坛",
    "打开小红书",
    "打开计算器",
    "打开设置",
    "打开地图",
    "打开文件",
    "天气小组件",
    "日历小组件",
  ];
  for (const [i, name] of desktopApps.entries()) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
      "transform",
      "none",
    );
    if (i < desktopApps.length - 1)
      await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  }
  await expect(page.locator(".device-banner")).toContainText("张峻豪");
  // 点横幅直接进张峻豪的聊天框，不用自己去翻列表
  await page.locator(".device-banner").click();
  await expect(page.locator(".wx-nav strong")).toHaveText("张峻豪");
  // 退回桌面时朋友圈还没看过，会再提醒一次（横幅可以反复出现）
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  const nudge = page.locator(".device-banner-body");
  await expect(nudge).toContainText("朋友圈有新动态");
  await page.waitForTimeout(5000);
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  await expect(page.locator(".wx-chat-row.locked")).toHaveCount(0);
  // 解锁后「发现」标签上就应有红点引导
  await expect(
    page.locator(".wx-bottom [aria-label='发现'] .wx-dot"),
  ).toBeVisible();
  await page.getByRole("button", { name: "发现", exact: true }).click();
  // 朋友圈一栏用 left 的头像引导点击
  const discoverRow = page.locator(".wx-discovery").first();
  await expect(discoverRow).toContainText("朋友圈");
  await expect(discoverRow.locator(".skin-avatar")).toBeVisible();
  await page.getByRole("button", { name: "微信", exact: true }).click();

  // 3. 读张峻豪：默认停在最后一条消息
  await page.locator(".wx-chat-row").first().click();
  await expect
    .poll(
      () =>
        page
          .locator(".skin-messages")
          .evaluate(
            (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 8,
          ),
      { timeout: 8000 },
    )
    .toBe(true);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/finale-chat.png" });

  // 4. 读完再回桌面：横幅又出来，点它直达朋友圈
  await page.locator(".wx-nav button").first().click();
  await expect(page.locator(".wx-chat-row").first()).toBeVisible();
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(nudge).toContainText("朋友圈有新动态");
  await page.locator(".device-banner").click();
  const post = page.locator(".wx-moment-post");
  await expect(post).toHaveCount(1);
  await expect(post).toContainText("我都会选你");
  await expect(post).toContainText("2分钟前");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/finale-moment.png" });
  // 详情页只显示发帖人，不显示具体发表时间
  await post.click();
  await expect(page.locator(".detail-meta")).toHaveText("left");
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await expect(post).toHaveCount(1);

  // 5. 点赞解锁时钟
  await page.locator(".wx-moment-like").click();
  await expect(page.locator(".wx-moment-like.liked")).toHaveCount(1);
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page.getByRole("button", { name: "打开时钟", exact: true }).click();
  await page.getByRole("button", { name: "世界时钟", exact: true }).click();
  await expect(page.locator(".status-time")).toHaveText("00:00");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/finale-clock.png" });

  // 6. 微信弹出「生日快乐」，输入栏自动打出「我」再删掉改成「对不起」
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  await page.locator(".wx-chat-row").filter({ hasText: "left" }).click();
  await expect(page.locator(".skin-bubble").last()).toContainText("生日快乐");
  // 会话第一条必须是机主 2039-09-10 发的那句，朋友圈内容不能混进聊天流
  await expect(page.locator(".skin-bubble").first()).toContainText(
    "为什么不让我进去呢？",
  );
  const field = page.locator(".wx-finale-field");
  await expect(field).toBeVisible();
  await field.click();
  await expect(field).toHaveText("我", { timeout: 1500 });
  await expect(field).toHaveText("对不起", { timeout: 8000 });
  await page.locator(".phone-screen").screenshot({ path: "docs/images/finale-typing.png" });

  // 7. 玩家发送 → 对方正在输入 → 我爱你
  const send = page.getByRole("button", { name: "发送消息" });
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.locator(".wx-nav strong")).toHaveText("对方正在输入中");
  await expect(page.locator(".wx-typing-bubble")).toHaveCount(1);
  await expect(page.locator(".skin-bubble").last()).toContainText("对不起");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/finale-sent.png" });
  await expect(page.locator(".wx-nav strong")).toHaveText("left", {
    timeout: 8000,
  });
  await expect(page.locator(".skin-bubble").last()).toContainText("我爱你");
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/finale-reply.png" });
  expect(errors).toEqual([]);
});

/**
 * 探索较慢的路径：玩家不点赞、不点时钟，让时间自然流过 23:59。
 * 零点一到，时钟自动解锁、自动弹出「生日快乐」并开启回复互动。
 */
test("natural midnight unlocks the clock and starts the reply flow", async ({
  page,
  request,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const work = await (await request.get("/work.json")).json();
  work.phone.time = "23:58";
  await page.route("**/work.json", (route) => route.fulfill({ json: work }));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await unlockPhone(page);

  // 不打开任何 App，等时间自然走到 11-19 00:00，left 的消息自动弹出
  await expect(page.locator(".device-banner")).toContainText("生日快乐", {
    timeout: 160000,
  });
  await expect(page.locator(".status-time")).toHaveText("00:00");

  // 时钟无需点赞即已解锁
  await page.getByRole("button", { name: "打开时钟", exact: true }).click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();

  // 打开 left 的会话，脚本化回复互动可用
  await page.getByRole("button", { name: "打开微信", exact: true }).click();
  await page.locator(".wx-chat-row").filter({ hasText: "left" }).click();
  await expect(page.locator(".skin-bubble").last()).toContainText("生日快乐");
  const field = page.locator(".wx-finale-field");
  await expect(field).toBeVisible();
  await field.click();
  await expect(field).toHaveText("对不起", { timeout: 8000 });
  await page.getByRole("button", { name: "发送消息" }).click();
  await expect(page.locator(".skin-bubble").last()).toContainText("我爱你", {
    timeout: 8000,
  });
  expect(errors).toEqual([]);
});
