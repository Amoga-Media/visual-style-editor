const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function getSystemChromePath() {
  for (const p of CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function capture() {
  const baseOutputDir = path.resolve(__dirname, '../public/images/editor-snapshots');
  const desktopDir = path.join(baseOutputDir, 'desktop');
  const mobileDir = path.join(baseOutputDir, 'mobile');

  [baseOutputDir, desktopDir, mobileDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const execPath = getSystemChromePath();
  console.log('🚀 Launching Chromium for High-Res Editor Capture with:', execPath);

  const browser = await chromium.launch({
    ...(execPath ? { executablePath: execPath } : {}),
    headless: true,
    args: ['--disable-web-security', '--no-sandbox']
  });

  // =========================================================================
  // PART 1: DESKTOP HORIZONTAL SCREENSHOTS (1920x1080 @ 2x Retina)
  // =========================================================================
  console.log('\n🖥️ === CAPTURING DESKTOP HORIZONTAL SCREENSHOTS (1920x1080 @ 2x) ===');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();

  console.log('Loading Editor with saas-pricing template...');
  await desktopPage.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(2000);

  // Helper: Click element in iframe
  async function selectIframeElement(page, selector) {
    const frameEl = await page.$('iframe#preview-canvas, iframe');
    if (frameEl) {
      const frame = await frameEl.contentFrame();
      if (frame) {
        const target = await frame.$(selector);
        if (target) {
          await target.click({ force: true });
          await page.waitForTimeout(800);
          return true;
        }
      }
    }
    return false;
  }

  // 1. Overview Desktop
  console.log('1. Capturing Desktop Studio Overview...');
  await selectIframeElement(desktopPage, 'button, .btn-primary, [class*="btn"]');
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(desktopDir, '01-editor-overview-desktop.png') });
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '08-editor-hero-workstation.png') });

  // 2. Pages & Layers Desktop
  console.log('2. Capturing Pages & AST Layers Tree Desktop...');
  const layersTabBtn = await desktopPage.$('button[aria-label="Layers Tree tab"], button:has-text("Layers")');
  if (layersTabBtn) {
    await layersTabBtn.click();
    await desktopPage.waitForTimeout(700);
  }
  await desktopPage.screenshot({ path: path.join(desktopDir, '02-editor-layers-pages-desktop.png') });
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '02-editor-ast-tree-inspector.png') });

  // 3. Classes System Desktop
  console.log('3. Capturing Tailwind Classes System Desktop...');
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const classesBtn = buttons.find(b => b.textContent && b.textContent.includes('Classes'));
    if (classesBtn) classesBtn.click();
    const rightPanel = document.querySelector('aside:last-of-type, [class*="overflow-y-auto"]');
    if (rightPanel) rightPanel.scrollTop = 100;
  });
  await desktopPage.waitForTimeout(700);
  await desktopPage.screenshot({ path: path.join(desktopDir, '03-editor-classes-system-desktop.png') });
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '03-editor-live-canvas-viewport.png') });

  // 4. Colors Lab Desktop (OKLCH color tuner popover open)
  console.log('4. Capturing OKLCH Color Lab Desktop...');
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const colorHeader = buttons.find(b => b.textContent && b.textContent.includes('Colors'));
    if (colorHeader) colorHeader.click();
    const swatch = document.querySelector('[aria-label*="color"], [class*="w-7 h-7"], [class*="color-swatch"]');
    if (swatch) swatch.click();
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(desktopDir, '04-editor-colors-lab-desktop.png') });
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '07-editor-color-typography-lab.png') });

  // Close color popover
  await desktopPage.keyboard.press('Escape');
  await desktopPage.waitForTimeout(400);

  // 5. Typography Desktop
  console.log('5. Capturing Typography Controls Desktop...');
  await selectIframeElement(desktopPage, 'h1, h2, [class*="text-"]');
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const typoBtn = buttons.find(b => b.textContent && b.textContent.includes('Typography'));
    if (typoBtn) typoBtn.click();
    const rightPanel = document.querySelector('aside:last-of-type, [class*="overflow-y-auto"]');
    if (rightPanel) rightPanel.scrollTop = 220;
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(desktopDir, '05-editor-typography-desktop.png') });

  // 6. Padding & Box Model Desktop
  console.log('6. Capturing Concentric Box Model & Padding Desktop...');
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const layoutBtn = buttons.find(b => b.textContent && b.textContent.includes('Layout & Sizing'));
    if (layoutBtn) layoutBtn.click();
    const rightPanel = document.querySelector('aside:last-of-type, [class*="overflow-y-auto"]');
    if (rightPanel) rightPanel.scrollTop = 380;
  });
  await desktopPage.waitForTimeout(800);
  await desktopPage.screenshot({ path: path.join(desktopDir, '06-editor-padding-boxmodel-desktop.png') });
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '04-editor-boxmodel-padding-margin.png') });

  // 7. Export Studio Desktop
  console.log('7. Capturing Export Studio Modal Desktop...');
  const exportBtn = await desktopPage.$('button:has-text("Export"), button[title*="Export"]');
  if (exportBtn) {
    await exportBtn.click();
    await desktopPage.waitForTimeout(1200);
    await desktopPage.screenshot({ path: path.join(desktopDir, '07-editor-export-studio-desktop.png') });
    await desktopPage.screenshot({ path: path.join(baseOutputDir, '06-editor-disk-save-export.png') });
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(500);
  }

  // 8. AST Splice Diff Review Desktop
  console.log('8. Capturing AST Surgical Splice Diff Review Desktop...');
  const diffBtn = await desktopPage.$('button:has-text("Review"), button[title*="Review"], button:has-text("Diff")');
  if (diffBtn) {
    await diffBtn.click();
    await desktopPage.waitForTimeout(1000);
    await desktopPage.screenshot({ path: path.join(desktopDir, '08-editor-ast-splice-diff-desktop.png') });
    await desktopPage.screenshot({ path: path.join(baseOutputDir, '05-editor-ast-splice-diff.png') });
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(400);
  } else {
    await desktopPage.screenshot({ path: path.join(desktopDir, '08-editor-ast-splice-diff-desktop.png') });
    await desktopPage.screenshot({ path: path.join(baseOutputDir, '05-editor-ast-splice-diff.png') });
  }

  // 9. Initial DropZone Ingestion
  console.log('9. Capturing Clean DropZone State...');
  await desktopPage.goto('http://localhost:4321/editor', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(baseOutputDir, '01-editor-dropzone-open.png') });

  await desktopContext.close();

  // =========================================================================
  // PART 2: MOBILE VERTICAL SCREENSHOTS (430x932 iPhone 15 Pro Max @ 2x)
  // =========================================================================
  console.log('\n📱 === CAPTURING MOBILE VERTICAL SCREENSHOTS (430x932 @ 2x) ===');
  const mobileContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  // 1. Mobile Overview (Canvas in mobile viewport)
  console.log('1. Capturing Mobile Studio Overview...');
  await mobilePage.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);
  // Hide sidebars so the mobile canvas preview is front-and-center
  await mobilePage.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    if (asides[0]) asides[0].style.display = 'none';
    if (asides[1]) asides[1].style.display = 'none';
  });
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(mobileDir, '01-editor-overview-mobile.png') });

  // 2. Mobile Layers & Navigator (Full mobile width)
  console.log('2. Capturing Mobile Layers & Navigator (Full width)...');
  await mobilePage.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    if (asides[0]) {
      asides[0].style.display = 'flex';
      asides[0].style.width = '100vw';
      asides[0].style.maxWidth = '100vw';
      asides[0].style.position = 'fixed';
      asides[0].style.inset = '48px 0 0 0';
      asides[0].style.zIndex = '50';
    }
    if (asides[1]) asides[1].style.display = 'none';
  });
  // Switch to Layers tab
  const mlayersBtn = await mobilePage.$('button[aria-label="Layers Tree tab"], button:has-text("Layers")');
  if (mlayersBtn) await mlayersBtn.click();
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(mobileDir, '02-editor-layers-pages-mobile.png') });

  // Select element to activate PropertyPanel
  await mobilePage.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    if (asides[0]) asides[0].style.display = 'none';
  });
  await selectIframeElement(mobilePage, 'button, .btn-primary, [class*="btn"], h2');
  await mobilePage.waitForTimeout(800);

  // Helper to configure PropertyPanel on mobile
  async function focusMobilePropertyPanel(scrollTarget, callback) {
    await mobilePage.evaluate((target) => {
      const asides = document.querySelectorAll('aside');
      if (asides[0]) asides[0].style.display = 'none';
      if (asides[1]) {
        asides[1].style.display = 'flex';
        asides[1].style.width = '100vw';
        asides[1].style.maxWidth = '100vw';
        asides[1].style.position = 'fixed';
        asides[1].style.inset = '48px 0 0 0';
        asides[1].style.zIndex = '50';
        asides[1].scrollTop = target;
      }
    }, scrollTarget);
    if (callback) await callback();
    await mobilePage.waitForTimeout(600);
  }

  // 3. Mobile Classes System
  console.log('3. Capturing Mobile Classes System...');
  await focusMobilePropertyPanel(50, async () => {
    await mobilePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const classesBtn = buttons.find(b => b.textContent && b.textContent.includes('Classes'));
      if (classesBtn) classesBtn.click();
    });
  });
  await mobilePage.screenshot({ path: path.join(mobileDir, '03-editor-classes-system-mobile.png') });

  // 4. Mobile Colors Lab (With Color popover open)
  console.log('4. Capturing Mobile Colors Lab...');
  await focusMobilePropertyPanel(150, async () => {
    await mobilePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const colorBtn = buttons.find(b => b.textContent && b.textContent.includes('Colors'));
      if (colorBtn) colorBtn.click();
      const swatch = document.querySelector('[aria-label*="color"], [class*="w-7 h-7"], [class*="color-swatch"]');
      if (swatch) swatch.click();
    });
  });
  await mobilePage.screenshot({ path: path.join(mobileDir, '04-editor-colors-lab-mobile.png') });
  await mobilePage.keyboard.press('Escape');
  await mobilePage.waitForTimeout(300);

  // 5. Mobile Typography
  console.log('5. Capturing Mobile Typography...');
  await focusMobilePropertyPanel(280, async () => {
    await mobilePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const typoBtn = buttons.find(b => b.textContent && b.textContent.includes('Typography'));
      if (typoBtn) typoBtn.click();
    });
  });
  await mobilePage.screenshot({ path: path.join(mobileDir, '05-editor-typography-mobile.png') });

  // 6. Mobile Box Model & Padding
  console.log('6. Capturing Mobile Box Model & Padding...');
  await focusMobilePropertyPanel(420, async () => {
    await mobilePage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const layoutBtn = buttons.find(b => b.textContent && b.textContent.includes('Layout & Sizing'));
      if (layoutBtn) layoutBtn.click();
    });
  });
  await mobilePage.screenshot({ path: path.join(mobileDir, '06-editor-padding-boxmodel-mobile.png') });

  // 7. Mobile Export Studio Modal
  console.log('7. Capturing Mobile Export Studio Modal...');
  // Restore normal aside styles
  await mobilePage.evaluate(() => {
    const asides = document.querySelectorAll('aside');
    if (asides[0]) asides[0].style.display = 'none';
    if (asides[1]) asides[1].style.display = 'none';
  });
  const mExportBtn = await mobilePage.$('button:has-text("Export")');
  if (mExportBtn) {
    await mExportBtn.click();
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(mobileDir, '07-editor-export-studio-mobile.png') });
    await mobilePage.keyboard.press('Escape');
  }

  await mobileContext.close();
  await browser.close();

  console.log('\n🎉 SUCCESS: All Horizontal Desktop and Vertical Mobile screenshots captured in 2x Retina clarity!');
}

capture().catch(err => {
  console.error('Capture script error:', err);
  process.exit(1);
});
