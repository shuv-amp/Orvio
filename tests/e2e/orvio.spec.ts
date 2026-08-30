import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const SCAN_PASS = "Scan the signed demo pass";

/** Serious and critical axe violations, formatted for a readable failure. */
async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    // The QR graphic is intentionally exempt from contrast analysis; the pass
    // around it carries an accessible name and a text identity.
    .exclude(".qr-wrap")
    .analyze();
  return results.violations.filter(
    (item) => item.impact === "critical" || item.impact === "serious",
  );
}

/**
 * Reveal the sidebar. On phones it is off-canvas behind the menu button, so
 * the same test can drive both projects.
 */
async function openNav(page: Page) {
  const menu = page.getByRole("button", { name: "Open navigation" });
  if (await menu.isVisible()) await menu.click();
}

/**
 * Open the palette with its keyboard shortcut.
 *
 * The shortcut is registered when React hydrates, which can land after the
 * server-rendered markup is already visible. Retrying the press waits for the
 * app to be listening instead of guessing at a fixed delay.
 */
async function openPaletteWithShortcut(page: Page) {
  await expect(async () => {
    await page.keyboard.press("ControlOrMeta+k");
    await expect(
      page.getByRole("dialog", { name: "Command palette" }),
    ).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

/** Click the visible point without Playwright re-scrolling it under the dock. */
async function clickInView(page: Page, locator: Locator) {
  await locator.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "center" }),
  );
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const receivesPointer = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    return target === element || (target !== null && element.contains(target));
  });
  expect(receivesPointer).toBe(true);
  await page.mouse.click(point.x, point.y);
}

test("communicates the operational wedge in ten seconds", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good afternoon, Shuvam." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What is about to break?" }),
  ).toBeVisible();
  await expect(page.getByText("3 risks")).toBeVisible();
});

test("event operations navigation opens distinct working sections", async ({
  page,
}) => {
  await page.goto("/");
  await openNav(page);
  await page.getByRole("button", { name: /Live signals/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Operational evidence, not vague alerts.",
    }),
  ).toBeVisible();

  await openNav(page);
  await page.getByRole("button", { name: "Broadcasts" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Send one useful message to the right people.",
    }),
  ).toBeVisible();
  const send = page.getByRole("button", { name: "Send targeted update" });
  await clickInView(page, send);
  await expect(page.getByText("Broadcast queued")).toBeVisible();

  await openNav(page);
  await page.getByRole("button", { name: "Audit trail" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Every consequential action has an owner.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Targeted broadcast sent")).toBeVisible();
});

test("requires human approval before applying recovery", async ({ page }) => {
  await page.goto("/organizer");
  await clickInView(
    page,
    page.getByRole("button", { name: "Run selected scenario" }),
  );
  await expect(
    page.getByText("Judge unavailable with 37 reviews pending"),
  ).toBeVisible();
  const approve = page.getByRole("button", { name: "Review & approve" });
  await expect(approve).toBeVisible();
  await clickInView(page, approve);
  await expect(page.getByText("Recovery active")).toBeVisible();
  await expect(page.getByText("Recovery approved")).toBeVisible();
});

test("shows a deterministic, explainable team recommendation", async ({
  page,
}) => {
  await page.goto("/participant");
  await expect(
    page.getByRole("heading", {
      name: "Not just a match. A reason to build together.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Why this match works")).toBeVisible();
  await page.getByRole("tab", { name: /Relay Health/ }).click();
  await expect(
    page.getByRole("tabpanel").getByText("Offline triage network"),
  ).toBeVisible();
});

test("exposes each match component as a labelled meter", async ({ page }) => {
  await page.goto("/participant");
  const meter = page.getByRole("meter", { name: "Skill coverage" });
  await expect(meter).toHaveAttribute("aria-valuenow", /\d+/);
  await expect(meter).toHaveAttribute("aria-valuemax", "100");
});

test("queues offline, synchronizes, and blocks replay", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name.startsWith("mobile"),
    "The desktop project owns the shared demo ticket's replay-lock test",
  );
  await page.goto("/scanner");
  await page.getByRole("button", { name: /Online Server replay/ }).click();
  await page.getByRole("button", { name: SCAN_PASS }).click();
  await expect(
    page.getByRole("main").getByText("Stored offline", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Offline mode/ }).click();
  await expect(
    page.getByRole("main").getByText("Check-in accepted", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: SCAN_PASS }).click();
  await expect(
    page.getByRole("main").getByText("Duplicate blocked", { exact: true }),
  ).toBeVisible();
});

test("finalizes a locked rubric and disables further scoring", async ({
  page,
}) => {
  await page.goto("/judge");
  await page.getByRole("button", { name: "Finalize 84/100" }).click();
  await expect(
    page.getByRole("status").getByText("Score finalized"),
  ).toBeVisible();
  await expect(page.getByRole("radio", { name: "10" }).first()).toBeDisabled();
});

test("registers a walk-up attendee and issues a unique QR pass", async ({
  page,
}) => {
  await page.goto("/participant");
  await page.getByLabel("Full name").fill("Riya Sen");
  await page
    .getByLabel("Role", { exact: true })
    .selectOption("Frontend engineer");
  await page.getByRole("checkbox", { name: "Frontend" }).check();
  await page
    .getByRole("button", { name: "Register and issue QR pass" })
    .click();
  await expect(page.getByText("Attendee registered")).toBeVisible();
  await expect(page.getByText(/Ticket ••••/).first()).toBeVisible();
});

test("re-ranks the live leaderboard after a judge finalizes a score", async ({
  page,
}) => {
  await page.goto("/participant");
  await expect(page.getByRole("row", { name: /Project Aster/ })).toContainText(
    "92.4",
  );
  await openNav(page);
  await page
    .getByRole("navigation", { name: "Role workspaces" })
    .getByRole("button", { name: "Judging portal" })
    .click();
  await page.getByRole("button", { name: "Finalize 84/100" }).click();
  await expect(
    page.getByRole("status").getByText("Score finalized"),
  ).toBeVisible();
  await openNav(page);
  await page
    .getByRole("navigation", { name: "Role workspaces" })
    .getByRole("button", { name: "Participant" })
    .click();
  await expect(page.getByRole("row", { name: /Project Aster/ })).toContainText(
    "84",
  );
  await expect(page.getByRole("row", { name: /Relay Health/ })).toContainText(
    "89.7",
  );
});

/* ------------------------------------------------------------ appearance */

test("cycles system, light, and dark colour schemes", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme-choice", "system");

  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(html).toHaveAttribute("data-theme-choice", "light");
  await expect(html).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(html).toHaveAttribute("data-theme-choice", "dark");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(html).toHaveAttribute("data-theme-choice", "system");
});

test("keeps the chosen colour scheme across a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  // Applied by the pre-paint bootstrap, before React hydrates.
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("toggles high contrast independently of the colour scheme", async ({
  page,
}) => {
  await page.goto("/");
  const contrast = page.getByRole("button", { name: "High contrast" });
  await contrast.click();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(contrast).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

/* ------------------------------------------------------- command palette */

test("opens the command palette with the keyboard and navigates", async ({
  page,
}) => {
  await page.goto("/");
  await openPaletteWithShortcut(page);
  const palette = page.getByRole("dialog", { name: "Command palette" });

  await page.getByRole("combobox", { name: /Search commands/ }).fill("judging");
  await expect(page.getByRole("option").first()).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Enter");
  await expect(palette).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Review Project Aster" }),
  ).toBeVisible();
});

test("runs an incident simulation from the command palette", async ({
  page,
}) => {
  await page.goto("/participant");
  await openPaletteWithShortcut(page);
  await page
    .getByRole("combobox", { name: /Search commands/ })
    .fill("gate surge");
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/North Gate demand exceeds capacity/),
  ).toBeVisible();
});

test("closes the command palette with escape and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Search event and run commands/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: /Search event and run commands/ }),
  ).toBeFocused();
});

/* ----------------------------------------------------------- guided demo */

test("walks the guided demo across role workspaces", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo guide" }).click();
  const tour = page.getByRole("dialog", { name: /about to break/ });
  await expect(tour).toBeVisible();
  await expect(page.getByText("Step 1 of 6")).toBeVisible();

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Step 2 of 6")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  // Step three lives in the participant workspace.
  await expect(page.getByText("Step 3 of 6")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Not just a match/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "End guided demo" }).click();
  await expect(page.getByText("Step 3 of 6")).toBeHidden();
});

/* --------------------------------------------------------- notifications */

test("tracks attendance and engagement in the analytics view", async ({
  page,
}) => {
  await page.goto("/");
  await openNav(page);
  await page.getByRole("button", { name: "Analytics" }).click();
  await expect(
    page.getByRole("heading", { name: /Attendance and engagement/ }),
  ).toBeVisible();
  const attendance = page.getByRole("meter", { name: "Attendance" });
  await expect(attendance).toHaveAttribute("aria-valuenow", /\d+/);
  await expect(page.getByText(/of 512 registered attendees/)).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Team formation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Judging progress" }),
  ).toBeVisible();
});

test("opens the notification popover over the live feed", async ({ page }) => {
  await page.goto("/");
  const bell = page.getByRole("button", { name: /Notifications/ });
  await expect(bell).toHaveAttribute("aria-expanded", "false");
  await bell.click();
  await expect(bell).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Judging starts at 17:00").first()).toBeVisible();
  await page.getByRole("button", { name: "Open broadcast center" }).click();
  await expect(
    page.getByRole("heading", { name: /Send one useful message/ }),
  ).toBeVisible();
});

/* --------------------------------------------------------- accessibility */

for (const route of ["/", "/participant", "/judge", "/scanner"]) {
  test(`has no serious automated accessibility violations on ${route}`, async ({
    page,
  }) => {
    await page.goto(route);
    const serious = await seriousViolations(page);
    expect(
      serious,
      serious.map((item) => `${item.id}: ${item.help}`).join("\n"),
    ).toEqual([]);
  });
}

test("keeps contrast compliant in dark mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const serious = await seriousViolations(page);
  expect(
    serious,
    serious.map((item) => `${item.id}: ${item.help}`).join("\n"),
  ).toEqual([]);
});

test("keeps the command palette accessible while open", async ({ page }) => {
  await page.goto("/");
  await openPaletteWithShortcut(page);
  const serious = await seriousViolations(page);
  expect(
    serious,
    serious.map((item) => `${item.id}: ${item.help}`).join("\n"),
  ).toEqual([]);
});

test("reaches the main content with a skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
});

test("fits the mobile viewport and exposes the role dock", async ({
  page,
}, testInfo) => {
  test.skip(
    !testInfo.project.name.startsWith("mobile"),
    "Mobile-only assertion",
  );
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Quick role switcher" }),
  ).toBeVisible();
  const sizes = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    // Unlike clientWidth, innerWidth includes a non-overlay vertical
    // scrollbar on Linux. That scrollbar is not horizontal overflow.
    viewportWidth: window.innerWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.viewportWidth);
});
