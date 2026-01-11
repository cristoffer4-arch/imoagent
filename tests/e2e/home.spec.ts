import { test, expect } from "@playwright/test";

test("homepage apresenta plano com 7 IAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("7 IAs Gemini", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Imoagent: plataforma imobiliária completa"),
  ).toBeVisible();
  await expect(
    page.getByText(/LancamentoPortugal/).first(),
  ).toBeVisible();
});
