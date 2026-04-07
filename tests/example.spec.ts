import { test, expect } from '@playwright/test';

test('Google 搜尋演練', async ({ page }) => {
  // 1. 前往 Google
  await page.goto('https://www.bing.com');

  // 2. 定位搜尋框 (使用 name 屬性，這比 CSS Class 穩定得多)
  const searchBar = page.locator('button:has-text("我同意")'); // 處理 Cookie 同意視窗 (若有)
  if (await searchBar.isVisible()) await searchBar.click();

  // 找到輸入框並輸入內容
  // await page.locator('[name="q"]').fill('Playwright MCP');
  // 在輸入時增加延遲，每個字間隔 100 毫秒
  await page.locator('[name="q"]').type('Playwright MCP', { delay: 100 });

  // 3. 按下 Enter
  await page.keyboard.press('Enter');

  // 4. 斷言 (Assertion)：確認搜尋結果中包含關鍵字
  // 等待結果頁面載入並檢查標題
  await expect(page).toHaveTitle(/Playwright/);
  
  // 截個圖留作紀念
  await page.screenshot({ path: 'screenshot.png' });
});