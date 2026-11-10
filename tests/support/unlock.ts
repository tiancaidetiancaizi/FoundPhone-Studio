import { expect, type Locator, type Page } from "@playwright/test";

/**
 * 点击锁屏底部的解锁把手。若作品设置了锁屏密码（phone.passcode），
 * 则从 /work.json 读出密码并依次点击数字键盘，直到锁屏消失。
 */
export async function unlockPhone(shell: Page | Locator) {
  const page = (
    typeof (shell as Page).goto === "function"
      ? (shell as Page)
      : (shell as Locator).page()
  ) as Page;
  await shell.getByRole("button", { name: "轻触解锁" }).click();
  if (await shell.locator(".device-passcode").count()) {
    const passcode = await page.evaluate(async () => {
      const response = await fetch("/work.json");
      if (!response.ok) return "";
      const work = (await response.json()) as { phone?: { passcode?: string } };
      return work.phone?.passcode ?? "";
    });
    expect(passcode, "设置了锁屏密码时应能从 work.json 读取").not.toBe("");
    for (const digit of passcode) {
      await shell.getByRole("button", { name: "密码键" + digit }).click();
    }
  }
  await expect(shell.locator(".lock-screen")).toHaveCount(0);
}
