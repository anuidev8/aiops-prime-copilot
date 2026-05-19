import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("report canvas flow: generate, edit, and export PDF", async ({ page }) => {
  await page.goto("/aiops");

  await expect(page.getByRole("heading", { name: /Operations workspace/i })).toBeVisible();

  await page.getByRole("button", { name: "Report Canvas" }).click();
  await expect(page.getByRole("heading", { name: /^Report canvas$/i }).last()).toBeVisible();

  const editedText = "Quarterly executive summary edited from Playwright E2E.";

  await page
    .getByRole("button", { name: "Switch to Edit Layer" })
    .last()
    .click({ force: true });
  const contentInput = page.getByLabel("Narrative content").last();
  await expect(contentInput).toBeVisible();
  await contentInput.fill(editedText);

  const pdfResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/aiops/report-pdf") &&
      response.request().method() === "POST",
  );
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).last().click();

  const response = await pdfResponse;
  expect(response.ok()).toBeTruthy();

  const download = await downloadEvent;
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  if (!downloadPath) {
    throw new Error("Expected Playwright download path.");
  }

  const fileBuffer = await fs.readFile(downloadPath);
  const pdfText = fileBuffer.toString("latin1");
  expect(pdfText.startsWith("%PDF-1.4")).toBe(true);
  expect(pdfText).toContain("Quarterly executive summary edited from Playwright E2E.");
});
