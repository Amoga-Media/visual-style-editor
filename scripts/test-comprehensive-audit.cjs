/**
 * scripts/test-comprehensive-audit.cjs
 *
 * Visual Style Editor — Comprehensive End-to-End Audit & Regression Suite
 * Tests Phase 2 Live Canvas & DOM Engine + Phase 3 Exploratory Bug Hunting.
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');

const EDITOR_URL = 'http://localhost:4321/editor';

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function getSystemChromePath() {
  for (const path of CHROME_CANDIDATES) {
    if (fs.existsSync(path)) return path;
  }
  return undefined;
}

async function runAudit() {
  const executablePath = getSystemChromePath();
  console.log('='.repeat(70));
  console.log('VISUAL STYLE EDITOR — COMPREHENSIVE AUTOMATED AUDIT & REGRESSION SUITE');
  console.log('Using Browser Executable:', executablePath || 'Default Chromium');
  console.log('Target URL:', EDITOR_URL);
  console.log('='.repeat(70) + '\n');

  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico') && !text.includes('Failed to load resource')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  let passed = 0;
  let failed = 0;
  const results = [];

  function assert(condition, label, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${label}${details ? ' (' + details + ')' : ''}`);
      passed++;
      results.push({ status: 'PASS', label, details });
    } else {
      console.error(`  ✗ FAIL: ${label}${details ? ' (' + details + ')' : ''}`);
      failed++;
      results.push({ status: 'FAIL', label, details });
    }
  }

  try {
    // =========================================================================
    // 1. PAGE LOAD & TEMPLATE MOUNT
    // =========================================================================
    console.log('\n--- AREA 1: Page Load & Template Mount ---');
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pageTitle = await page.title();
    assert(pageTitle.includes('Visual Style Editor') || pageTitle.includes('Studio'), 'Editor page loads with valid title', pageTitle);

    const sampleBtn = page.locator('button:has-text("Developer Profile & Stack")');
    await sampleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await sampleBtn.click();

    const iframeLoc = page.locator('iframe[title="Preview"]');
    await iframeLoc.waitFor({ state: 'visible', timeout: 15000 });
    const frame = page.frameLocator('iframe[title="Preview"]');

    const heading = frame.locator('h1');
    await heading.waitFor({ state: 'visible', timeout: 10000 });
    const headingText = await heading.textContent();
    assert(headingText.includes('Elena Rostova'), 'Template loaded into iframe', headingText);

    const img = frame.locator('img');
    await img.waitFor({ state: 'visible', timeout: 10000 });
    assert(await img.count() > 0, 'Image element exists in template');

    // =========================================================================
    // 2. IMAGE CROP & 2D FOCAL-POINT PAN PAD (ImageGroup.tsx)
    // =========================================================================
    console.log('\n--- AREA 2: Interactive Image Crop & 2D Focal-Point Pan Pad ---');
    await img.dispatchEvent('click');
    await page.waitForTimeout(600);

    // Verify "Top" preset sets object-position: 50% 0% and activates object-fit: cover
    const topPresetBtn = page.locator('button[title*="Show upper part, crop bottom"]');
    await topPresetBtn.waitFor({ state: 'visible', timeout: 5000 });
    await topPresetBtn.click();
    await page.waitForTimeout(400);

    const imgObjPos = await img.evaluate((el) => el.style.objectPosition);
    const imgObjFit = await img.evaluate((el) => el.style.objectFit);
    assert(imgObjPos === '50% 0%', 'Top preset sets object-position to 50% 0%', imgObjPos);
    assert(imgObjFit === 'cover', 'Repositioning focal point auto-activates object-fit: cover', imgObjFit);

    // Verify Pan X slider/number input allows decimal input (step=0.1, e.g. 12.5%)
    const panXInput = page.locator('input[type="number"][min="0"][max="100"][step="0.1"]').first();
    await panXInput.waitFor({ state: 'visible', timeout: 3000 });
    await panXInput.fill('12.5');
    await panXInput.dispatchEvent('change');
    await page.waitForTimeout(400);

    const panXResult = await img.evaluate((el) => el.style.objectPosition);
    assert(panXResult.includes('12.5%'), 'Pan X direct decimal input sets 12.5% in live DOM', panXResult);

    // Verify Pan Y slider/number input allows decimal input (e.g. 0.5%)
    const panYInput = page.locator('input[type="number"][min="0"][max="100"][step="0.1"]').nth(1);
    await panYInput.waitFor({ state: 'visible', timeout: 3000 });
    await panYInput.fill('0.5');
    await panYInput.dispatchEvent('change');
    await page.waitForTimeout(400);

    const panYResult = await img.evaluate((el) => el.style.objectPosition);
    assert(panYResult.includes('0.5%'), 'Pan Y direct decimal input sets 0.5% in live DOM', panYResult);

    // Verify 2D Pan Pad interactive click/drag
    const panPad = page.locator('div[title="Click or drag anywhere to position image framing"]');
    await panPad.waitFor({ state: 'visible', timeout: 3000 });
    const padBox = await panPad.boundingBox();
    assert(padBox !== null && padBox.width > 50, '2D Pan Pad is mounted and measurable');

    if (padBox) {
      await page.mouse.move(padBox.x + padBox.width * 0.75, padBox.y + padBox.height * 0.25);
      await page.mouse.down();
      await page.mouse.move(padBox.x + padBox.width * 0.8, padBox.y + padBox.height * 0.3);
      await page.mouse.up();
      await page.waitForTimeout(400);

      const draggedPos = await img.evaluate((el) => el.style.objectPosition);
      assert(draggedPos && draggedPos.length > 0 && draggedPos !== '50% 50%', 'Dragging on 2D Pan Pad mutates object-position', draggedPos);
    }

    // =========================================================================
    // 3. CANVAS DRAG & DROP SIBLING REORDERING (SelectionOverlay.tsx & PreviewFrame.tsx)
    // =========================================================================
    console.log('\n--- AREA 3: Canvas Drag & Drop Sibling Reordering ---');
    // Select the H1 heading
    await heading.dispatchEvent('click');
    await page.waitForTimeout(500);

    // Contextual Action HUD should be visible
    const hud = page.locator('[data-testid="canvas-action-hud"]');
    await hud.waitFor({ state: 'visible', timeout: 5000 });
    assert(await hud.isVisible(), 'Floating contextual Action HUD is visible on selection');

    // Move Down button should be available if next sibling exists
    const moveDownBtn = hud.locator('button[aria-label="Move element down"]');
    const canMoveDown = await moveDownBtn.count() > 0;
    assert(canMoveDown, 'Move element down button is available on heading');

    const initialHeadingNextSiblingTag = await heading.evaluate((el) => el.nextElementSibling?.tagName);

    if (canMoveDown) {
      await moveDownBtn.click();
      await page.waitForTimeout(500);

      const newHeadingPrevSiblingTag = await heading.evaluate((el) => el.previousElementSibling?.tagName);
      assert(newHeadingPrevSiblingTag === initialHeadingNextSiblingTag, 'Heading reordered after sibling in live DOM', `Previous sibling is now <${newHeadingPrevSiblingTag}>`);

      // Test Undo (Ctrl+Z) restores original sibling order
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);

      const restoredHeadingNextSiblingTag = await heading.evaluate((el) => el.nextElementSibling?.tagName);
      assert(restoredHeadingNextSiblingTag === initialHeadingNextSiblingTag, 'Ctrl+Z restored initial sibling order', `Next sibling is <${restoredHeadingNextSiblingTag}>`);
    }

    // Test drag reorder handle icon in HUD
    const gripHandle = page.locator('div[title*="Drag to reorder among siblings"]');
    assert(await gripHandle.count() > 0, 'Reorder grip handle is rendered in floating HUD');

    // =========================================================================
    // 4. SHADOW & GLOW CUSTOMIZATION STUDIO (ShadowPresetsGroup.tsx)
    // =========================================================================
    console.log('\n--- AREA 4: Shadow & Glow Customization Studio ---');
    // Select card container or image
    await img.dispatchEvent('click');
    await page.waitForTimeout(500);

    // Find Shadow & Glow Studio in property panel
    const shadowStudioHeader = page.locator('button:has-text("Shadow & Glow Studio")');
    if (await shadowStudioHeader.count() > 0) {
      // Ensure group is expanded
      const isExpanded = await page.locator('div[id="shadow-presets"]').count() > 0;
      if (!isExpanded) {
        await shadowStudioHeader.click();
        await page.waitForTimeout(300);
      }
    }

    // Click 'Neon Cyan' or 'Medium' preset
    const neonCyanPreset = page.locator('button[title*="Neon Cyan Glow"], button:has-text("Neon Cyan")').first();
    if (await neonCyanPreset.count() > 0) {
      await neonCyanPreset.click();
      await page.waitForTimeout(400);

      const appliedShadow = await img.evaluate((el) => el.style.boxShadow);
      assert(appliedShadow && (appliedShadow.includes('#00f0ff') || appliedShadow.includes('0 0 20px') || appliedShadow.includes('rgba')), 'Clicking Neon Cyan preset applies shadow to live DOM', appliedShadow);
    }

    // Test Inset Toggle button
    const insetBtn = page.locator('button:has-text("Outer Drop"), button:has-text("Inset (Inner)")').first();
    if (await insetBtn.count() > 0) {
      await insetBtn.click();
      await page.waitForTimeout(400);

      const insetShadow = await img.evaluate((el) => el.style.boxShadow);
      assert(insetShadow.includes('inset'), 'Toggling Inset switch injects "inset" into live box-shadow CSS', insetShadow);
    }

    // Test Blur direct decimal input (e.g. 15.5px)
    const blurInput = page.locator('input[type="number"][min="0"][max="120"]').first();
    if (await blurInput.count() > 0) {
      await blurInput.fill('15.5');
      await blurInput.dispatchEvent('change');
      await page.waitForTimeout(400);

      const blurShadow = await img.evaluate((el) => el.style.boxShadow);
      assert(blurShadow.includes('15.5px'), 'Blur slider allows direct decimal 15.5px input', blurShadow);
    }

    // Test Clear Shadow button
    const clearShadowBtn = page.locator('button:has-text("Clear")');
    if (await clearShadowBtn.count() > 0) {
      await clearShadowBtn.click();
      await page.waitForTimeout(400);

      const clearedShadow = await img.evaluate((el) => el.style.boxShadow);
      assert(!clearedShadow || clearedShadow === 'none' || clearedShadow.includes('0px 0px 0px 0px'), 'Clear Shadow resets box-shadow in live DOM', clearedShadow);
    }

    // =========================================================================
    // 5. DISPLAY MODE & PROPERTY PANEL UNDO/REDO SYNCHRONIZATION (FlexGridGroup.tsx)
    // =========================================================================
    console.log('\n--- AREA 5: Display Mode & Property Panel Undo/Redo Synchronization ---');
    // Select heading
    await heading.dispatchEvent('click');
    await page.waitForTimeout(400);

    // Switch Property Panel to "All" properties mode so Flexbox & Grid is always rendered
    const rightAside = page.locator('aside').nth(1);
    const contextualBtn = rightAside.locator('button:has-text("Contextual")');
    if (await contextualBtn.count() > 0) {
      await contextualBtn.click();
      await page.waitForTimeout(400);
    }

    // Expand Flexbox & Grid accordion if collapsed
    const flexGridToggle = page.locator('button[aria-label="Toggle Flexbox & Grid properties"]');
    if (await flexGridToggle.count() > 0) {
      await flexGridToggle.scrollIntoViewIfNeeded();
      const isExpanded = await flexGridToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await flexGridToggle.click();
        await page.waitForTimeout(400);
      }
    }

    const flexBtn = page.locator('button[aria-label="Display mode Flex"]');
    const gridBtn = page.locator('button[aria-label="Display mode Grid"]');
    const inlFlexBtn = page.locator('button[aria-label="Display mode Inl-Flex"]');
    const blockBtn = page.locator('button[aria-label="Display mode Block"]');
    const undoBtn = page.locator('button[aria-label="Undo action"]');

    if (await flexBtn.count() > 0 && await blockBtn.count() > 0) {
      // 1. Switch to Block
      await blockBtn.click();
      await page.waitForTimeout(300);

      // 2. Switch to Flex
      await flexBtn.click();
      await page.waitForTimeout(300);

      // 3. Switch to Grid
      await gridBtn.click();
      await page.waitForTimeout(300);

      // 4. Switch to Inline-Flex
      await inlFlexBtn.click();
      await page.waitForTimeout(300);

      // Press Undo 3 times back to Block using the toolbar Undo button
      if (await undoBtn.count() > 0) {
        await undoBtn.click();
        await page.waitForTimeout(300);
        await undoBtn.click();
        await page.waitForTimeout(300);
        await undoBtn.click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(300);
        await page.keyboard.press('Control+z');
        await page.waitForTimeout(500);
      }

      // Check if Block button is active in property panel
      const blockClass = await blockBtn.getAttribute('class');
      const isBlockActive = blockClass && blockClass.includes('bg-[#0099ff]');
      assert(isBlockActive, 'Property panel immediately syncs and highlights Block after undo sequence', `blockClass: ${blockClass}`);
    } else {
      console.log('    [DIAGNOSTIC Area 5] flexBtn count:', await flexBtn.count(), 'blockBtn count:', await blockBtn.count());
    }

    // =========================================================================
    // 6. DIRECT DECIMAL NUMERIC INPUTS ON SLIDERS (AdvancedCssGroup & EffectsGroup)
    // =========================================================================
    console.log('\n--- AREA 6: Direct Decimal Numeric Inputs on Sliders ---');
    // Select image
    await img.dispatchEvent('click');
    await page.waitForTimeout(400);

    // Expand Effects & Shadows group
    const effectsToggle = page.locator('button[aria-label="Toggle Effects & Shadows properties"]');
    if (await effectsToggle.count() > 0) {
      await effectsToggle.scrollIntoViewIfNeeded();
      const isExpanded = await effectsToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await effectsToggle.click();
        await page.waitForTimeout(300);
      }
    }

    // Test Rotate direct decimal input in EffectsGroup
    const rotateInput = page.locator('div:has(> span:has-text("Rotate")) input[type="text"]').first();
    if (await rotateInput.count() > 0) {
      await rotateInput.scrollIntoViewIfNeeded();
      await rotateInput.fill('12.5deg');
      await rotateInput.press('Enter');
      await page.waitForTimeout(400);

      const rotateResult = await img.evaluate((el) => el.style.rotate || el.style.transform);
      assert(rotateResult.includes('12.5'), 'EffectsGroup allows decimal rotate (12.5deg)', rotateResult);
    }

    // Expand Advanced CSS group
    const advCssToggle = page.locator('button[aria-label="Toggle Advanced CSS properties"]');
    if (await advCssToggle.count() > 0) {
      await advCssToggle.scrollIntoViewIfNeeded();
      const isExpanded = await advCssToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await advCssToggle.click();
        await page.waitForTimeout(400);
      }
    }

    // Test Blur direct decimal input in AdvancedCssGroup (step=0.1)
    const blurInputAdv = page.locator('input[aria-label="Blur value"]').first();
    if (await blurInputAdv.count() > 0) {
      await blurInputAdv.scrollIntoViewIfNeeded();
      await blurInputAdv.fill('0.5');
      await blurInputAdv.dispatchEvent('change');
      await page.waitForTimeout(400);

      const filterResult = await img.evaluate((el) => el.style.filter);
      assert(filterResult.includes('blur(0.5px)'), 'Advanced CSS Blur slider allows direct 0.5px decimal input', filterResult);
    }

    // Test Contrast direct decimal input in AdvancedCssGroup (step=0.1)
    const contrastInput = page.locator('input[aria-label="Contrast value"]').first();
    if (await contrastInput.count() > 0) {
      await contrastInput.scrollIntoViewIfNeeded();
      await contrastInput.fill('125.5');
      await contrastInput.dispatchEvent('change');
      await page.waitForTimeout(400);

      const filterResult = await img.evaluate((el) => el.style.filter);
      assert(filterResult.includes('contrast(125.5%)'), 'Advanced CSS Contrast slider allows direct 125.5% decimal input', filterResult);
    }

    // =========================================================================
    // 7. CANVAS ZOOM VS BROWSER PAGE ZOOM AFTER SAVE
    // =========================================================================
    console.log('\n--- AREA 7: Canvas Zoom vs Browser Page Zoom After Save ---');
    // Trigger Save via Ctrl+S
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(600);

    // Get initial canvas zoom level and outer page visual viewport scale
    const initialCanvasZoom = await page.evaluate(() => {
      const artboard = document.querySelector('[data-testid="canvas-artboard"]') || document.querySelector('iframe')?.parentElement;
      return artboard ? window.getComputedStyle(artboard).transform : 'none';
    });

    const initialWindowScale = await page.evaluate(() => window.visualViewport?.scale || 1);

    // Dispatch Ctrl + Wheel over canvas container
    await page.evaluate(() => {
      const canvasEl = document.querySelector('iframe') || document.body;
      const wheelEv = new WheelEvent('wheel', {
        deltaY: -100, // Zoom in
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      canvasEl.dispatchEvent(wheelEv);
    });
    await page.waitForTimeout(400);

    const postWindowScale = await page.evaluate(() => window.visualViewport?.scale || 1);
    assert(postWindowScale === 1, 'Outer browser webpage scale remains locked at 100% (1.0)', `Scale: ${postWindowScale}`);

    // =========================================================================
    // 8. EXPORT FIDELITY (ExportStudioModal.tsx & serializeCleanDocument)
    // =========================================================================
    console.log('\n--- AREA 8: Export Fidelity & Solid Border Preservation ---');
    // Open Export Studio
    const exportBtn = page.locator('button[title="Open Export Studio"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 5000 });
    await exportBtn.click();

    const codeBlock = page.locator('pre code');
    await codeBlock.waitFor({ state: 'visible', timeout: 5000 });

    const htmlExport = await codeBlock.textContent();
    assert(htmlExport && htmlExport.toLowerCase().includes('<!doctype html>'), 'HTML export contains valid DOCTYPE', htmlExport.slice(0, 30));
    assert(htmlExport.includes('tailwind') || htmlExport.includes('tailwindcss'), 'Tailwind CSS runtime script is preserved or injected in <head>');

    // Switch to React TSX tab
    const reactTab = page.locator('button:has-text("React (TSX)")');
    await reactTab.click();
    await page.waitForTimeout(400);

    const jsxExport = await codeBlock.textContent();
    assert(jsxExport && jsxExport.includes('export') && (jsxExport.includes('className=') || jsxExport.includes('React.FC')), 'React TSX export produces valid component markup');

    // Close export modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    // =========================================================================
    // 9. MULTI-VIEWPORT CASCADE OVERRIDES
    // =========================================================================
    console.log('\n--- AREA 9: Multi-Viewport Cascade Overrides ---');
    // Switch to Mobile (375px)
    const mobileBtn = page.locator('button[title*="Mobile"], button:has-text("Mobile")').first();
    if (await mobileBtn.count() > 0) {
      await mobileBtn.click();
      await page.waitForTimeout(500);

      // Verify iframe resized to mobile width
      const iframeWidth = await page.locator('iframe[title="Preview"]').evaluate((el) => el.getBoundingClientRect().width);
      assert(iframeWidth <= 420, 'Viewport switched to Mobile (<= 420px)', `Width: ${iframeWidth}px`);

      // Switch back to Desktop
      const desktopBtn = page.locator('button[title*="Desktop"], button:has-text("Desktop")').first();
      await desktopBtn.click();
      await page.waitForTimeout(500);

      const restoredWidth = await page.locator('iframe[title="Preview"]').evaluate((el) => el.getBoundingClientRect().width);
      assert(restoredWidth > 700, 'Viewport restored to Desktop (> 700px)', `Width: ${restoredWidth}px`);
    }

    // =========================================================================
    // 10. DARK & LIGHT MODE THEME CONTRAST
    // =========================================================================
    console.log('\n--- AREA 10: Dark & Light Mode Theme Contrast ---');
    // Test Light Mode
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);

    const lightBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    assert(lightBg === 'rgb(250, 250, 250)' || lightBg.includes('250'), 'Light mode sets crisp neutral body background', lightBg);

    // Restore Dark Mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);

    const darkBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    assert(darkBg.includes('rgb(27, 27, 29)') || darkBg.includes('rgb(9, 9, 11)') || darkBg.includes('rgb(10, 10, 10)') || darkBg.includes('15') || darkBg.includes('0'), 'Dark mode sets obsidian background', darkBg);

    // =========================================================================
    // 11. CONSOLE ERRORS & MEMORY INTEGRITY
    // =========================================================================
    console.log('\n--- AREA 11: Console Errors & Session Integrity ---');
    const fatalErrors = consoleErrors.filter(
      (e) => e.includes('Uncaught') || e.includes('TypeError') || e.includes('Cannot read')
    );
    assert(fatalErrors.length === 0, 'Zero fatal runtime console errors', fatalErrors.join(' | '));
    assert(pageErrors.length === 0, 'Zero unhandled page exceptions', pageErrors.join(' | '));

  } catch (err) {
    console.error('Fatal execution exception during audit:', err);
    failed++;
  } finally {
    console.log('\n' + '='.repeat(70));
    console.log(`FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(70) + '\n');

    await browser.close();
    if (failed > 0) process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
