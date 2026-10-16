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

const TEMPLATES = [
  'landing-hero',
  'saas-pricing',
  'portfolio-clean',
  'blog-editorial',
  'ecommerce-product',
  'dashboard-shell',
  'newsletter-signup',
  'feature-grid',
  'testimonial-wall',
  'contact-card',
  'faq-accordion',
  'cta-split'
];

async function captureAll() {
  const templatesDesktopDir = path.resolve(__dirname, '../public/images/templates/desktop');
  const templatesMobileDir = path.resolve(__dirname, '../public/images/templates/mobile');
  const snapshotsDesktopDir = path.resolve(__dirname, '../public/images/editor-snapshots/desktop');
  const snapshotsMobileDir = path.resolve(__dirname, '../public/images/editor-snapshots/mobile');

  [templatesDesktopDir, templatesMobileDir, snapshotsDesktopDir, snapshotsMobileDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const execPath = getSystemChromePath();
  console.log('🚀 Launching Chromium with executable:', execPath);

  const browser = await chromium.launch({
    ...(execPath ? { executablePath: execPath } : {}),
    headless: true,
    args: ['--disable-web-security', '--no-sandbox']
  });

  // 1. CAPTURE DESKTOP TEMPLATE SCREENSHOTS (1920x1080 @ 2x)
  console.log('\n🖥️ === CAPTURING 12 TEMPLATES IN DESKTOP (1920x1080 @ 2x) ===');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();

  for (const tmpl of TEMPLATES) {
    console.log(`- Desktop: Capturing template "${tmpl}"...`);
    try {
      await desktopPage.goto(`http://localhost:4321/editor?template=${tmpl}`, { waitUntil: 'networkidle', timeout: 15000 });
      await desktopPage.waitForTimeout(1500);
      
      // Click canvas element if possible to show active selection
      const frameEl = await desktopPage.$('iframe#preview-canvas, iframe');
      if (frameEl) {
        const frame = await frameEl.contentFrame();
        if (frame) {
          const btn = await frame.$('h1, h2, button, a, div');
          if (btn) await btn.click({ force: true }).catch(() => {});
        }
      }
      await desktopPage.waitForTimeout(400);

      const dest = path.join(templatesDesktopDir, `${tmpl}-desktop.png`);
      await desktopPage.screenshot({ path: dest });
    } catch (err) {
      console.warn(`  Warning on template ${tmpl}:`, err.message);
    }
  }

  // 2. CAPTURE EXTRA DESKTOP WORKFLOW VIEWS
  console.log('\n🖥️ === CAPTURING EXTRA DESKTOP WORKFLOW VIEWS ===');
  // Device Switcher View (Tablet canvas mode)
  try {
    console.log('- Desktop: Device Switcher Tablet View...');
    await desktopPage.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1000);
    const tabletBtn = await desktopPage.$('button[aria-label="Tablet viewport"], button:has-text("Tablet")');
    if (tabletBtn) {
      await tabletBtn.click();
      await desktopPage.waitForTimeout(600);
    }
    await desktopPage.screenshot({ path: path.join(snapshotsDesktopDir, '09-editor-device-switch-desktop.png') });
  } catch (e) {
    console.warn(e.message);
  }

  // Component Insert Library View
  try {
    console.log('- Desktop: Component Library View...');
    const insertBtn = await desktopPage.$('button[aria-label="Insert Elements tab"], button:has-text("Insert"), button:has-text("Components")');
    if (insertBtn) {
      await insertBtn.click();
      await desktopPage.waitForTimeout(600);
    }
    await desktopPage.screenshot({ path: path.join(snapshotsDesktopDir, '10-editor-library-insert-desktop.png') });
  } catch (e) {
    console.warn(e.message);
  }

  // Shortcuts Modal View
  try {
    console.log('- Desktop: Keyboard Shortcuts Modal...');
    await desktopPage.keyboard.press('Shift+?');
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({ path: path.join(snapshotsDesktopDir, '11-editor-shortcuts-modal-desktop.png') });
    await desktopPage.keyboard.press('Escape');
    await desktopPage.waitForTimeout(400);
  } catch (e) {
    console.warn(e.message);
  }

  await desktopContext.close();

  // 3. CAPTURE MOBILE VERTICAL TEMPLATE SCREENSHOTS (430x932 @ 2x)
  console.log('\n📱 === CAPTURING 12 TEMPLATES IN MOBILE (430x932 @ 2x) ===');
  const mobileContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  for (const tmpl of TEMPLATES) {
    console.log(`- Mobile: Capturing template "${tmpl}"...`);
    try {
      await mobilePage.goto(`http://localhost:4321/editor?template=${tmpl}`, { waitUntil: 'networkidle', timeout: 15000 });
      await mobilePage.waitForTimeout(1500);

      // In mobile view, hide left & right sidebars so the canvas template preview is the main hero
      await mobilePage.evaluate(() => {
        const leftSidebar = document.querySelector('aside:first-of-type');
        const rightSidebar = document.querySelector('aside:last-of-type');
        if (leftSidebar) leftSidebar.style.display = 'none';
        if (rightSidebar) rightSidebar.style.display = 'none';
        const canvasContainer = document.querySelector('main, [class*="canvas"], [class*="workspace"]');
        if (canvasContainer) {
          canvasContainer.style.width = '100vw';
          canvasContainer.style.maxWidth = '100vw';
        }
      });
      await mobilePage.waitForTimeout(400);

      const dest = path.join(templatesMobileDir, `${tmpl}-mobile.png`);
      await mobilePage.screenshot({ path: dest });
    } catch (err) {
      console.warn(`  Warning on mobile template ${tmpl}:`, err.message);
    }
  }

  // 4. CAPTURE EXTRA MOBILE WORKFLOW VIEWS
  console.log('\n📱 === CAPTURING EXTRA MOBILE WORKFLOW VIEWS ===');
  try {
    console.log('- Mobile: Device Switcher view...');
    await mobilePage.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: path.join(snapshotsMobileDir, '08-editor-device-switch-mobile.png') });
  } catch (e) {
    console.warn(e.message);
  }

  await mobileContext.close();
  await browser.close();

  console.log('\n🎉 ALL TEMPLATE AND WORKFLOW SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureAll().catch(err => {
  console.error('Fatal error during template capture:', err);
  process.exit(1);
});
