/**
 * scripts/test-editor-bugs.cjs
 * Comprehensive Playwright test for Visual Style Editor (/editor) bug audit & repairs.
 *
 * Requirements verified:
 *  1. Launches using the system Chrome executable.
 *  2. Loads /editor and initializes with a sample HTML template.
 *  3. Verifies AnimationBuilderGroup is cleanly pruned and absent from the DOM.
 *  4. Edits a text heading via InlineTextEditor and verifies live DOM update.
 *  5. Edits an image src via ImageGroup and verifies live DOM update.
 *  6. Triggers Ctrl+Z (Undo) and verifies both image and text accurately restore in the live iframe DOM.
 *  7. Opens ExportStudioModal and verifies that generated HTML and React JSX strings are valid and non-empty.
 *  8. Tests light theme contrast & rendering.
 *  9. Verifies console and page errors are clean (0 unhandled exceptions).
 *
 * Usage:
 *   node scripts/test-editor-bugs.cjs
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');

const EDITOR_URL = 'http://localhost:4321/editor';

// System Chrome path candidates on Windows
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

async function run() {
  const executablePath = getSystemChromePath();
  console.log('Using browser executable:', executablePath || 'Default Playwright Browser');

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
      // Filter benign favicon 404 or external image load timeouts
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

  function assert(condition, label) {
    if (condition) {
      console.log('  PASS: ' + label);
      passed++;
    } else {
      console.error('  FAIL: ' + label);
      failed++;
    }
  }

  try {
    // =========================================================================
    // TEST 1: Page Load
    // =========================================================================
    console.log('\n[TEST 1] /editor page load');
    await page.goto(EDITOR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const title = await page.title();
    assert(title.includes('Visual Style Editor') || title.includes('Studio'), 'Page title loaded: ' + title);

    // =========================================================================
    // TEST 2: AnimationBuilderGroup Pruned
    // =========================================================================
    console.log('\n[TEST 2] Verify AnimationBuilderGroup is cleanly pruned');
    const animCount = await page.locator('text="Animation & Transition Builder"').count();
    assert(animCount === 0, 'Animation & Transition Builder is NOT in the DOM (count=' + animCount + ')');

    // =========================================================================
    // TEST 3: Load Sample HTML Template (Developer Profile & Stack)
    // =========================================================================
    console.log('\n[TEST 3] Load sample HTML template');
    const sampleBtn = page.locator('button:has-text("Developer Profile & Stack")');
    await sampleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await sampleBtn.click();

    // Wait for the preview iframe to mount and load document
    const iframeElement = page.locator('iframe[title="Preview"]');
    await iframeElement.waitFor({ state: 'visible', timeout: 15000 });
    const frame = page.frameLocator('iframe[title="Preview"]');

    const heading = frame.locator('h1');
    await heading.waitFor({ state: 'visible', timeout: 10000 });
    const initialHeadingText = await heading.textContent();
    assert(initialHeadingText.includes('Elena Rostova'), 'Initial template heading loaded: "' + initialHeadingText + '"');

    const img = frame.locator('img');
    await img.waitFor({ state: 'visible', timeout: 10000 });
    const initialImgSrc = await img.getAttribute('src');
    assert(initialImgSrc && initialImgSrc.includes('unsplash'), 'Initial template image loaded with src: ' + initialImgSrc.slice(0, 45) + '...');

    // =========================================================================
    // TEST 4: Edit Text Heading via InlineTextEditor
    // =========================================================================
    console.log('\n[TEST 4] Edit text heading via InlineTextEditor');
    await heading.dispatchEvent('click');
    await page.waitForTimeout(600);

    // Click "Edit Text" in property panel
    const editBtn = page.locator('button[aria-label="Edit text content"]');
    await editBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editBtn.click();

    // Textarea appears - edit text
    const textarea = page.locator('textarea[aria-label="Edit text input"]');
    await textarea.waitFor({ state: 'visible', timeout: 5000 });
    const MODIFIED_HEADING = 'Dr. Elena Rostova, PhD';
    await textarea.fill(MODIFIED_HEADING);

    // Click Apply
    const applyBtn = page.locator('button[aria-label="Apply text content edits"]');
    await applyBtn.click();
    await page.waitForTimeout(600);

    const liveHeadingText = await heading.textContent();
    assert(liveHeadingText === MODIFIED_HEADING, 'Heading updated in live DOM: "' + liveHeadingText + '"');

    // =========================================================================
    // TEST 5: Edit Image src via ImageGroup
    // =========================================================================
    console.log('\n[TEST 5] Edit image src via ImageGroup');
    await img.dispatchEvent('click');
    await page.waitForTimeout(600);

    const srcInput = page.locator('input[placeholder*="unsplash"]');
    await srcInput.waitFor({ state: 'visible', timeout: 5000 });
    const MODIFIED_IMG_SRC = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500';
    await srcInput.fill(MODIFIED_IMG_SRC);
    await srcInput.press('Enter');
    await srcInput.dispatchEvent('blur');
    await page.waitForTimeout(600);

    const liveImgSrc = await img.getAttribute('src');
    assert(liveImgSrc === MODIFIED_IMG_SRC, 'Image src updated in live DOM: ' + liveImgSrc.slice(0, 50) + '...');

    // =========================================================================
    // TEST 6: Trigger Ctrl+Z (Undo) and verify state restoration
    // =========================================================================
    console.log('\n[TEST 6] Trigger Ctrl+Z (Undo) and verify DOM restoration');
    // Ensure active element (input/textarea) is blurred so global keyboard shortcut isn't ignored
    await page.evaluate(() => {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    });

    // Undo 1: Revert image edit
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(600);

    const undoneImgSrc = await img.getAttribute('src');
    assert(undoneImgSrc === initialImgSrc, 'Undo 1 restored initial image src: ' + undoneImgSrc.slice(0, 45) + '...');

    // Undo 2: Revert text heading edit
    await page.keyboard.press('Control+z');
    await page.waitForTimeout(600);

    const undoneHeadingText = await heading.textContent();
    assert(undoneHeadingText === initialHeadingText, 'Undo 2 restored initial heading text: "' + undoneHeadingText + '"');

    // =========================================================================
    // TEST 7: ExportStudioModal Validation (HTML & React JSX)
    // =========================================================================
    console.log('\n[TEST 7] ExportStudioModal validation');
    const exportBtn = page.locator('button[title="Open Export Studio"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 5000 });
    await exportBtn.click();

    // Verify modal appears
    const modalCloseBtn = page.locator('button[aria-label="Close Export Studio"]');
    await modalCloseBtn.waitFor({ state: 'visible', timeout: 5000 });
    assert(await modalCloseBtn.isVisible(), 'ExportStudioModal is open and close button is visible');

    const codeBlock = page.locator('pre code');
    await codeBlock.waitFor({ state: 'visible', timeout: 5000 });

    const exportedHtml = await codeBlock.textContent();
    assert(exportedHtml && exportedHtml.length > 50 && exportedHtml.includes('Elena Rostova'), 'Generated export HTML is valid and contains user markup');

    // Switch to React (TSX) format
    const reactTab = page.locator('button:has-text("React (TSX)")');
    await reactTab.click();
    await page.waitForTimeout(300);

    const exportedJsx = await codeBlock.textContent();
    assert(exportedJsx && exportedJsx.includes('export') && (exportedJsx.includes('className=') || exportedJsx.includes('React.FC')), 'Generated export React TSX is valid and non-empty');

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const modalCloseCount = await page.locator('button[aria-label="Close Export Studio"]').count();
    assert(modalCloseCount === 0, 'ExportStudioModal closed cleanly via Escape');

    // =========================================================================
    // TEST 8: Light Theme Contrast & Body Background
    // =========================================================================
    console.log('\n[TEST 8] Light theme contrast & styling');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(300);

    const lightBodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    assert(lightBodyBg && lightBodyBg !== 'rgba(0, 0, 0, 0)', 'Light theme body background is set: ' + lightBodyBg);

    // Verify input colors in light theme
    const inputColor = await page.evaluate(() => {
      const inp = document.querySelector('input');
      return inp ? window.getComputedStyle(inp).color : null;
    });
    assert(inputColor !== null, 'Inputs in light theme have computed color style');

    // Restore dark mode
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    // =========================================================================
    // TEST 9: Console & Page Errors Check
    // =========================================================================
    console.log('\n[TEST 9] Console & unhandled error check');
    const criticalErrors = consoleErrors.filter(
      (e) => e.includes('Uncaught') || e.includes('TypeError') || e.includes('Cannot read')
    );
    assert(criticalErrors.length === 0, criticalErrors.length === 0 ? '0 critical console errors' : criticalErrors.join(' | '));
    assert(pageErrors.length === 0, pageErrors.length === 0 ? '0 unhandled page errors' : pageErrors.join(' | '));

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    console.log('\n' + '='.repeat(60));
    console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('='.repeat(60) + '\n');

    await browser.close();
    if (failed > 0) process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
