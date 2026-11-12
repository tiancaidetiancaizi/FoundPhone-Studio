import { test, expect } from "@playwright/test";
import { unlockPhone } from "./support/unlock";
test("published default story, four dock apps and updated status bar", async ({
  page,
  request,
}) => {
  const work = await (await request.get("/work.json")).json();
  expect(work.id).toBe("foundphone-left");
  expect(work.title).toBe("妈妈");
  expect(
    work.apps.filter((a: { installed: boolean }) => a.installed),
  ).toHaveLength(12);
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
  ).toHaveLength(4);
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
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  await expect(page.locator(".status-silent")).toBeVisible();
  await expect(page.locator(".status-cellular")).toBeVisible();
  await expect(page.locator(".status-wifi")).toBeVisible();
  await page
    .locator(".phone-screen")
    .screenshot({ path: "docs/images/home.png" });
  await page
    .locator(".status-bar")
    .screenshot({ path: "outputs/release/status-bar.png" });
  // 精简版只保留 12 个 App，桌面不应再有 App Store / 其它内置应用
  await expect(
    page.getByRole("button", { name: "打开App Store", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "打开抖音", exact: true }),
  ).toHaveCount(0);
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
  await expect(page.locator(".dock [data-home-key]")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
