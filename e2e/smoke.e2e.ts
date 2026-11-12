import { expect, test, type Page } from "@playwright/test";

function iso(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function nav(page: Page, name: string) {
  return page.getByRole("navigation").getByRole("button", { name, exact: true });
}

async function createGoal(page: Page) {
  await page.getByLabel("Goal name").fill("Autumn 10K");
  await page.getByLabel("Plan start date").fill(iso(-1));
  await page.getByLabel("Race date").fill(iso(42));
  await page.getByRole("button", { name: "Create goal" }).click();
  await expect(page.getByRole("heading", { name: "Autumn 10K" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("shows the empty dashboard first", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set the finish line." })).toBeVisible();
});

test("creates a goal, schedules a session, logs it and keeps the data after reload", async ({ page }) => {
  await createGoal(page);
  await expect(page.getByText("days to go")).toBeVisible();

  await nav(page, "Planner").click();
  await page.getByRole("button", { name: "Add Session" }).click();
  await page.getByLabel("Target distance (km)").fill("8");
  await page.getByRole("button", { name: "Add session", exact: true }).click();
  await expect(page.getByText("8 km")).toBeVisible();

  await page.getByRole("button", { name: "Log result" }).click();
  await page.getByLabel("Duration (hh:mm:ss)").fill("45:00");
  await page.getByRole("button", { name: "Save run" }).click();
  await expect(page.locator(".activity-card").getByText("Completed")).toBeVisible();

  await page.reload();
  await nav(page, "Run log").click();
  await expect(page.getByText("Planned workout")).toBeVisible();
  await nav(page, "Dashboard").click();
  await expect(page.getByRole("heading", { name: "Autumn 10K" })).toBeVisible();
});

test("counts an unplanned run on the dashboard and lets it be deleted", async ({ page }) => {
  await createGoal(page);
  await page.getByRole("button", { name: "Log a run" }).first().click();
  await page.getByLabel("Actual distance (km)").fill("5");
  await page.getByLabel("Duration (hh:mm:ss)").fill("1:05:30");
  await page.getByRole("button", { name: "Save run" }).click();

  await nav(page, "Dashboard").click();
  await expect(page.getByText("Includes 1 unplanned run")).toBeVisible();

  await nav(page, "Run log").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete run" }).click();
  await expect(page.getByText("No runs logged")).toBeVisible();
});

test("saves and reuses a session template", async ({ page }) => {
  await createGoal(page);
  await nav(page, "Session builder").click();
  await page.getByLabel("Session name").fill("Track 6x400");
  await page.getByRole("button", { name: "Save reusable session" }).click();
  await expect(page.getByRole("complementary", { name: "Saved session templates" }).getByText("Track 6x400")).toBeVisible();

  await nav(page, "Planner").click();
  await page.getByRole("button", { name: "Add Session" }).click();
  await page.getByLabel("Run type").selectOption({ label: "Track 6x400" });
  await page.getByRole("button", { name: "Add session", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Track 6x400" })).toBeVisible();
});

test("keeps the chosen theme after reload", async ({ page }) => {
  await nav(page, "Settings").click();
  await page.getByLabel("Dark").check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("shows a retry screen when storage cannot be read, then recovers", async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("fail-once")) {
      sessionStorage.setItem("fail-once", "1");
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key: string) {
        if (key === "training-planner-local-v3") { Storage.prototype.getItem = original; throw new Error("blocked"); }
        return original.call(this, key);
      };
    }
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("could not be opened");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
