const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click an element inside the iframe to select it
  const iframe = await (await page.$('iframe'))?.contentFrame();
  if (iframe) {
    const card = await iframe.$('.card, button, h2');
    if (card) {
      await card.click({ force: true });
      console.log('Selected card in iframe');
      await page.waitForTimeout(1500);
    }
  }

  // Scroll to classes section in property panel or add a class
  const classInput = await page.$('input[placeholder*="class"], input[placeholder*="tailwind"]');
  if (classInput) {
    await classInput.fill('p-8');
    await classInput.press('Enter');
    console.log('Added class p-8!');
    await page.waitForTimeout(1500);
  } else {
    // Alternatively click any slider or toggle in property panel
    const anyInput = await page.$('aside input[type="number"], aside input[type="text"]');
    if (anyInput) {
      await anyInput.fill('32');
      await anyInput.press('Enter');
      console.log('Typed 32 into input');
      await page.waitForTimeout(1500);
    }
  }

  // Look for Review button
  const reviewBtn = await page.$('button:has-text("Review")');
  if (reviewBtn && !(await reviewBtn.isDisabled())) {
    await reviewBtn.click();
    console.log('Clicked review button!');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.resolve(__dirname, '../public/images/editor-snapshots/05-editor-ast-splice-diff.png'),
    fullPage: false
  });

  console.log('05-editor-ast-splice-diff.png successfully captured!');
  await browser.close();
})();
