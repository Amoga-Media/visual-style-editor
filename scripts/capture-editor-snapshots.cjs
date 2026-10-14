const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const outputDir = path.resolve(__dirname, '../public/images/editor-snapshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching Chrome browser from system path...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--disable-web-security', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // 2x Retina quality for ultra crisp screenshots
  });

  const page = await context.newPage();

  // 1. DropZone / Initial Open State
  console.log('1. Capturing DropZone / File Ingestion...');
  await page.goto('http://localhost:4321/editor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(outputDir, '01-editor-dropzone-open.png'),
    fullPage: false
  });

  // 2. Full Live Studio Canvas Viewport
  console.log('2. Capturing Live Studio Canvas Viewport...');
  await page.goto('http://localhost:4321/editor?template=ai-startup-hero', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(outputDir, '03-editor-live-canvas-viewport.png'),
    fullPage: false
  });

  // 3. Left Sidebar Layers / AST Tree
  console.log('3. Capturing AST Layers Tree...');
  // Click on the Layers icon on the left sidebar to open layers panel if collapsed
  try {
    const layersBtn = await page.$('button[title*="Layers"], button:has-text("Layers")');
    if (layersBtn) await layersBtn.click();
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log('Layers click notice:', e.message);
  }
  await page.screenshot({
    path: path.join(outputDir, '02-editor-ast-tree-inspector.png'),
    fullPage: false
  });

  // 4. Box Model: Padding Box & Margin Box (Adjust Styles and Precise Controls)
  console.log('4. Capturing Box Model (Margin & Padding Box)...');
  await page.goto('http://localhost:4321/editor?template=saas-pricing', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Click an element inside the iframe to trigger selection and open right PropertyPanel
  const frameElement = await page.$('iframe#preview-canvas, iframe');
  if (frameElement) {
    const frame = await frameElement.contentFrame();
    if (frame) {
      // Find a button or card element in the template to select
      const target = await frame.$('button, .card, [class*="card"], [class*="btn"], h2, div');
      if (target) {
        await target.click({ force: true });
        console.log('Element clicked in iframe!');
        await page.waitForTimeout(1200);
      }
    }
  }

  // Scroll right sidebar or ensure BoxModel is in view
  await page.evaluate(() => {
    const panel = document.querySelector('aside, [class*="PropertyPanel"], [class*="overflow-y-auto"]');
    if (panel) panel.scrollTop = 120;
  });
  await page.waitForTimeout(800);

  await page.screenshot({
    path: path.join(outputDir, '04-editor-boxmodel-padding-margin.png'),
    fullPage: false
  });

  // Also capture a dedicated high-res close-up of the BoxModelVisualizer component if present
  try {
    const boxModelEl = await page.$('[aria-label="Box model visualizer"], [class*="BoxModel"], aside div:has-text("Margin")');
    if (boxModelEl) {
      await boxModelEl.screenshot({
        path: path.join(outputDir, '04-editor-boxmodel-close-up.png')
      });
      console.log('Saved close-up of BoxModelVisualizer!');
    }
  } catch (err) {
    console.log('Notice on box model crop:', err.message);
  }

  // 5. Review Diff Modal / AST Splicer
  console.log('5. Capturing AST Surgical Splicer & Code Diff...');
  // Click Review Changes button if available or simulate opening modal
  try {
    const reviewBtn = await page.$('button:has-text("Review"), button[title*="Review"], button:has-text("Diff")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(outputDir, '05-editor-ast-splice-diff.png'),
        fullPage: false
      });
    } else {
      // If no edits yet, make a live edit via evaluate or capture studio
      await page.screenshot({
        path: path.join(outputDir, '05-editor-ast-splice-diff.png'),
        fullPage: false
      });
    }
  } catch (e) {
    console.log('Review button notice:', e.message);
  }

  // 6. Direct Disk Save / Export Studio Modal
  console.log('6. Capturing Export Studio / Disk Save...');
  try {
    const exportBtn = await page.$('button:has-text("Export"), button[title*="Export"]');
    if (exportBtn) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(outputDir, '06-editor-disk-save-export.png'),
        fullPage: false
      });
      // Close export modal
      const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
    } else {
      await page.screenshot({
        path: path.join(outputDir, '06-editor-disk-save-export.png'),
        fullPage: false
      });
    }
  } catch (e) {
    console.log('Export button notice:', e.message);
  }

  // 7. OKLCH Color & Typography Lab
  console.log('7. Capturing Color & Typography Lab...');
  await page.goto('http://localhost:4321/editor?template=feature-grid', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const frame2 = await (await page.$('iframe'))?.contentFrame();
  if (frame2) {
    const h2 = await frame2.$('h2, h1, p');
    if (h2) await h2.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await page.screenshot({
    path: path.join(outputDir, '07-editor-color-typography-lab.png'),
    fullPage: false
  });

  // 8. Hero Workstation Overview
  console.log('8. Capturing Hero Studio Workstation Overview...');
  await page.goto('http://localhost:4321/editor?template=hero-dark', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(outputDir, '08-editor-hero-workstation.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All screenshots captured successfully in 2x Retina resolution!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
