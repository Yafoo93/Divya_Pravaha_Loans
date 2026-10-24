import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844, mobileNavigation: true },
  { name: "tablet", width: 768, height: 1024, mobileNavigation: true },
  { name: "desktop", width: 1440, height: 900, mobileNavigation: false },
] as const;

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function signInAsManager(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("Staff email address")
    .fill("abdul.kassim@divyapravaha.example");
  await page.getByLabel("Password").fill("DemoLoan!2026");
  await page.getByRole("button", { name: "Continue securely" }).click();
  await expect(page).toHaveURL(/\/workspace$/);
}

for (const viewport of viewports) {
  test.describe(`${viewport.name} workspace`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("login, navigation, and core pages fit the viewport", async ({
      page,
    }) => {
      await page.goto("/login");
      await expectNoPageOverflow(page);
      await signInAsManager(page);
      await expectNoPageOverflow(page);

      const mobileMenu = page.getByRole("button", {
        name: "Open workspace navigation",
      });
      if (viewport.mobileNavigation) {
        await expect(mobileMenu).toBeVisible();
        await mobileMenu.click();
        const drawer = page.getByRole("complementary", {
          name: "Mobile workspace navigation",
        });
        await expect(drawer).toBeVisible();
        await drawer.getByRole("link", { name: /Borrowers/ }).click();
        await expect(page).toHaveURL(/\/workspace\/borrowers$/);
      } else {
        await expect(mobileMenu).toBeHidden();
        await expect(
          page.getByRole("complementary", { name: "Workspace navigation" }),
        ).toBeVisible();
      }

      for (const path of [
        "/workspace/borrowers",
        "/workspace/loan-applications",
        "/workspace/accounting",
        "/workspace/capital",
      ]) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        await expectNoPageOverflow(page);
      }

      await expect(page.getByText("RCT-RECOVERY-CAP-002")).toBeVisible();
      await expect(page.getByText("GHS 1,666.67").first()).toBeVisible();
      await expect(page.getByText("GHS 333.33").first()).toBeVisible();
    });
  });
}
