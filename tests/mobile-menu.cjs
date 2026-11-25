const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));

  try {
    const response = await page.goto("https://michael-coker-dev.github.io/michael-coker-portfolio/", { waitUntil: "networkidle", timeout: 60000 });
    if (!response || !response.ok()) throw new Error(`Live site returned HTTP ${response?.status() ?? "no response"}`);

    const toggle = page.locator(".menu-toggle");
    const nav = page.locator(".nav");
    await toggle.waitFor({ state: "visible" });
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)) {
      throw new Error("Horizontal overflow detected at 390px");
    }

    await toggle.click();
    if (await toggle.getAttribute("aria-expanded") !== "true" || !(await nav.evaluate(el => el.classList.contains("open")))) {
      throw new Error("Hamburger did not open navigation or update aria-expanded");
    }

    await page.keyboard.press("Escape");
    if (await toggle.getAttribute("aria-expanded") !== "false" || !(await toggle.evaluate(el => document.activeElement === el))) {
      throw new Error("Escape did not close menu and return focus to toggle");
    }

    await toggle.click();
    await nav.locator('a[href="#work"]').click();
    if (await toggle.getAttribute("aria-expanded") !== "false") {
      throw new Error("Selecting a navigation link did not close the menu");
    }

    await toggle.click();
    await page.mouse.click(5, 150);
    if (await toggle.getAttribute("aria-expanded") !== "false") {
      throw new Error("Outside click did not close the menu");
    }

    const iconColor = await toggle.locator("span").first().evaluate(el => getComputedStyle(el).backgroundColor);
    if (failures.length) throw new Error("Browser errors: " + failures.join("; "));
    console.log(JSON.stringify({ result: "PASS", status: response.status(), viewport: "390x844", horizontalOverflow: false, escapeClosesAndReturnsFocus: true, navLinkCloses: true, outsideClickCloses: true, hamburgerBarColor: iconColor, pageErrors: failures }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ result: "FAIL", error: error.message, pageErrors: failures }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
