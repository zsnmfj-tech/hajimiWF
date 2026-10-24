import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.locator('#generate')).toBeEnabled(); });
test('default and upload flows, stale state, export, privacy, responsive layout', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('#ssid').fill('猫咪的家'); await page.locator('#password').fill('demo12345');
  await page.locator('#generate').click();
  await expect(page.locator('#status')).toContainText('图片校验通过');
  await expect(page.locator('#preview-tag')).toHaveText('猫咪融合版');
  await mkdir('output', { recursive: true });
  await page.screenshot({ path: `output/desktop-${info.project.name}.png`, fullPage: true });
  const downloadEvent = page.waitForEvent('download'); await page.locator('#download').click();
  const download = await downloadEvent; expect(download.suggestedFilename()).toBe('hajimi-wifi.png');
  await download.saveAs(`output/card-${info.project.name}.png`);
  expect(requests.filter(url => !url.startsWith('blob:'))).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, location.search])).toEqual([0,0,'']);
  await page.locator('#enhance').click(); await expect(page.locator('#result-actions')).toBeVisible();
  await page.locator('#password').fill('different123'); await expect(page.locator('#result-actions')).toBeHidden();
  await page.locator('#upload').setInputFiles('tests/fixtures/black.png');
  await expect(page.locator('#cat-name')).toContainText('你家的猫');
  await expect(page.locator('#crop-options')).toHaveAttribute('open', '');
  await page.locator('#generate').click(); await expect(page.locator('#status')).toContainText('图片校验通过');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: `output/mobile-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('photo rendering preserves detail while protecting QR patterns and decoding', async ({page}) => {
  const rows = await page.evaluate(async () => { const path='/hajimiWF/tests/harness.ts'; return (await import(/* @vite-ignore */ path)).photoDetail(); });
  for (const row of rows) {
    expect(row.errorRatio, row.name).toBeLessThan(.65);
    expect(row.protectedPixels, row.name).toBe(true);
    expect(row.decodes, row.name).toBe(true);
  }
});
test('image errors keep prior image; open network clears password; invalid form and stale async are safe', async ({page}) => {
  await page.locator('#generate').click(); await expect(page.locator('#ssid-error')).not.toBeEmpty();
  await page.locator('#upload').setInputFiles({ name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image') });
  await expect(page.locator('#image-error')).not.toBeEmpty(); await expect(page.locator('#cat-name')).toContainText('Tom');
  await page.locator('#ssid').fill('Local test');await page.locator('#password').fill('demo12345');
  await page.locator('.network-options summary').click(); await page.locator('#security').selectOption('open');
  await expect(page.locator('#password')).toHaveValue('');
  await page.locator('#generate').click();await expect(page.locator('#result-actions')).toBeVisible();
  await page.locator('#ssid').fill('Changed');await expect(page.locator('#result-actions')).toBeHidden();
  await page.evaluate(()=>{(document.querySelector('#form') as HTMLFormElement).requestSubmit();const input=document.querySelector('#ssid') as HTMLInputElement;input.value='Again';input.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(page.locator('#generate')).toBeEnabled();await expect(page.locator('#result-actions')).toBeHidden();
});
test('six cats × ten Wi-Fi inputs cross-decode, including fusion requirement', async ({ page }) => {
  test.setTimeout(240000);
  const rows = await page.evaluate(async () => { const path='/hajimiWF/tests/harness.ts'; return (await import(/* @vite-ignore */ path)).matrix(); });
  expect(rows).toHaveLength(60); console.log('Fusion levels:', rows.reduce((acc: Record<string,number>,row:{level:number})=>{acc[row.level]=(acc[row.level]||0)+1;return acc;},{}));
});
test('rotation, JPEG compression, non-integer scaling and clear fallback', async ({page}) => {
  const checks = await page.evaluate(async () => { const path='/hajimiWF/tests/harness.ts';return (await import(/* @vite-ignore */ path)).robustness(); });
  expect(checks).toEqual({ rotate:true,jpeg:true,resize:true,fallback:true,quiet:true });
});
test('restoring default blocks generation until the new image is installed', async ({page}) => {
  await page.locator('#upload').setInputFiles('tests/fixtures/white.png');
  await expect(page.locator('#cat-name')).toContainText('你家的猫');
  await page.locator('#ssid').fill('CatHome'); await page.locator('#password').fill('demo12345');
  await page.locator('#generate').click(); await expect(page.locator('#result-actions')).toBeVisible();
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/tom-default.png', async route => { await gate; await route.continue(); });
  await page.locator('#restore').click(); await expect(page.locator('#generate')).toBeDisabled();
  await page.evaluate(()=>(document.querySelector('#form') as HTMLFormElement).requestSubmit());
  await expect(page.locator('#result-actions')).toBeHidden();
  release(); await expect(page.locator('#cat-name')).toContainText('Tom'); await expect(page.locator('#generate')).toBeEnabled();
  await expect(page.locator('#result-actions')).toBeHidden();
});
