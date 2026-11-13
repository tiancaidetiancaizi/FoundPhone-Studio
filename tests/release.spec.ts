import { test, expect } from "@playwright/test";
import { unlockPhone } from "./support/unlock";
test("published default story, home widgets and two dock apps", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.id).toBe("foundphone-left");
  expect(work.title).toBe("妈妈");
  expect(
    work.apps.filter((a: { installed: boolean }) => a.installed),
  ).toHaveLength(13);
  expect(work.nodes).toHaveLength(0);
  const leftThread = (work.data.wechat ?? []).filter(
    (i: { title: string }) => i.title === "left",
  );
  expect(leftThread).toHaveLength(128);
  expect(
    (work.data.notes ?? []).some(
      (n: { meta?: Record<string, string> }) => n.meta?.pinned === "true",
    ),
  ).toBe(true);
  expect(
    work.apps.filter(
      (a: { installed: boolean; dock: boolean }) => a.installed && a.dock,
    ),
  ).toHaveLength(2);
  expect(work.data.weather?.[0]?.title).toBe("杭市");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/");
  await page.getByRole("button", { name: "轻触解锁" }).waitFor();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/lock.png" });
  await unlockPhone(page);
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator(".interactive-home")).toHaveCSS("opacity", "1");
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(2);
  await expect(page.locator(".status-silent")).toBeVisible();
  await expect(page.locator(".status-cellular")).toBeVisible();
  await expect(page.locator(".status-wifi")).toBeVisible();
  // 天气卡 + 放大的日历卡靠上，其余 App 下移
  const weatherWidget = page.getByRole("button", { name: "天气小组件" });
  const calendarWidget = page.getByRole("button", { name: "日历小组件" });
  await expect(weatherWidget).toBeVisible();
  await expect(calendarWidget).toBeVisible();
  const weatherBox = await weatherWidget.boundingBox();
  const settingsBox = await page
    .getByRole("button", { name: "打开设置" })
    .boundingBox();
  expect(weatherBox!.y).toBeLessThan(settingsBox!.y);
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/home.png" });
  await page
    .locator(".status-bar")
    .screenshot({ path: "outputs/release/status-bar.png" });
  // 精简版桌面不应再有 App Store / 其它内置应用
  await expect(
    page.getByRole("button", { name: "打开App Store", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "打开抖音", exact: true }),
  ).toHaveCount(0);
  // 天气小组件点击进入天气 App
  await weatherWidget.click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.getByText("乌云转晴").first()).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/weather.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  // 日历小组件点开日历 App，默认停在系统日期所在月份
  await calendarWidget.click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.getByText("2040 年 11 月")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/calendar.png" });
  await page.getByRole("button", { name: "返回桌面", exact: true }).click();
  await expect(page.locator(".app-screen")).toHaveCount(0);
  await page.getByRole("button", { name: "打开设置", exact: true }).click();
  await expect(page.getByRole("switch", { name: "飞行模式" })).toBeVisible();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/settings.png" });
  await page.reload();
  await unlockPhone(page);
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
