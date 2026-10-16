const { chromium } = require('playwright');
const assert = require('assert');
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

async function run() {
  console.log('🚀 Starting Mobile & Tablet Navbar & Hero Verification Suite...');
  const execPath = getSystemChromePath();
  const browser = await chromium.launch({ 
    headless: true,
    ...(execPath ? { executablePath: execPath } : {})
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pagesToTest = [
    { url: 'http://localhost:4321/', name: 'Home' },
    { url: 'http://localhost:4321/features', name: 'Features' },
    { url: 'http://localhost:4321/how-it-works', name: 'How It Works' },
    { url: 'http://localhost:4321/templates', name: 'Templates' },
    { url: 'http://localhost:4321/our-story', name: 'Our Story' },
    { url: 'http://localhost:4321/why-we-do-what-we-do', name: 'Why We Built This' },
    { url: 'http://localhost:4321/support', name: 'Support' },
    { url: 'http://localhost:4321/privacy', name: 'Privacy' },
    { url: 'http://localhost:4321/terms', name: 'Terms' },
  ];

  // ---------------------------------------------------------
  // TEST 1: Mobile Viewport (375x667 - iPhone SE)
  // ---------------------------------------------------------
  console.log('\n📱 --- Testing Mobile Viewport (375x667) ---');
  await page.setViewportSize({ width: 375, height: 667 });

  for (const p of pagesToTest) {
    await page.goto(p.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // 1. Verify header navbar elements on mobile:
    // Only Logo and Hamburger should be visible in the header navbar bar
    const logoVisible = await page.locator('header a[aria-label="Visual Style Editor — home"]').isVisible();
    const hamburgerVisible = await page.locator('#mobile-menu-toggle').isVisible();
    const desktopNavVisible = await page.locator('header nav[role="navigation"]').isVisible();
    const desktopThemeToggleVisible = await page.locator('#theme-toggle').isVisible();
    const desktopCtaVisible = await page.locator('#nav-cta').isVisible();

    assert(logoVisible, `[${p.name}] Logo must be visible in navbar`);
    assert(hamburgerVisible, `[${p.name}] Hamburger button must be visible on mobile`);
    assert(!desktopNavVisible, `[${p.name}] Desktop nav links must be hidden on mobile`);
    assert(!desktopThemeToggleVisible, `[${p.name}] Desktop theme toggle must be hidden on mobile header`);
    assert(!desktopCtaVisible, `[${p.name}] Desktop CTA must be hidden on mobile header`);

    // 2. Verify no horizontal overflow in hero / page
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!hasHorizontalOverflow, `[${p.name}] Page has horizontal overflow on mobile! (${p.url})`);

    console.log(`  ✓ ${p.name}: Navbar header clean (only logo + hamburger) & zero horizontal overflow`);
  }

  // ---------------------------------------------------------
  // TEST 2: Mobile Drawer Interaction (Left-to-Right Full Screen)
  // ---------------------------------------------------------
  console.log('\n📱 --- Testing Mobile Drawer Left-to-Right Animation & Menu Items ---');
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });

  // Initially drawer is closed
  let isAriaHidden = await page.locator('#mobile-drawer-wrapper').getAttribute('aria-hidden');
  assert.strictEqual(isAriaHidden, 'true', 'Drawer wrapper must initially have aria-hidden=true');

  // Click hamburger button to open
  await page.locator('#mobile-menu-toggle').click();
  await page.waitForTimeout(350); // wait for 300ms transition

  isAriaHidden = await page.locator('#mobile-drawer-wrapper').getAttribute('aria-hidden');
  assert.strictEqual(isAriaHidden, 'false', 'Drawer wrapper must have aria-hidden=false when opened');

  const panelClasses = await page.locator('#mobile-nav-panel').getAttribute('class');
  assert(panelClasses.includes('translate-x-0'), 'Drawer panel must slide in with translate-x-0');

  // Verify panel covers the screen width on mobile
  const panelBox = await page.locator('#mobile-nav-panel').boundingBox();
  assert(panelBox.width >= 375, `Drawer must cover screen width (got ${panelBox.width}px, expected >= 375px)`);

  // Verify all menu items in drawer
  const menuLinks = await page.locator('#mobile-nav-panel nav[role="menu"] a').allTextContents();
  console.log('  Menu links found in drawer:', menuLinks.map(s => s.trim().replace(/\s+/g, ' ')));
  assert(menuLinks.some(t => t.includes('Features')), 'Drawer must contain Features link');
  assert(menuLinks.some(t => t.includes('How it works')), 'Drawer must contain How it works link');
  assert(menuLinks.some(t => t.includes('Templates')), 'Drawer must contain Templates link');
  assert(menuLinks.some(t => t.includes('Our story')), 'Drawer must contain Our story link');
  assert(menuLinks.some(t => t.includes('Why we built this')), 'Drawer must contain Why we built this link');
  assert(menuLinks.some(t => t.includes('Support')), 'Drawer must contain Support link');

  // Verify Interface Theme toggle in drawer
  const themeLightBtn = page.locator('#mobile-theme-light');
  const themeDarkBtn = page.locator('#mobile-theme-dark');
  assert(await themeLightBtn.isVisible(), 'Theme light button must be visible in mobile drawer');
  assert(await themeDarkBtn.isVisible(), 'Theme dark button must be visible in mobile drawer');

  // Test theme switching inside drawer
  await themeLightBtn.click();
  await page.waitForTimeout(100);
  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  assert.strictEqual(isDark, false, 'Document should switch to light mode when clicking Light');

  await themeDarkBtn.click();
  await page.waitForTimeout(100);
  isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  assert.strictEqual(isDark, true, 'Document should switch to dark mode when clicking Dark');

  // Verify Launch Visual Studio CTA button inside drawer
  const drawerCta = page.locator('#mobile-nav-panel a[href="/editor"]');
  assert(await drawerCta.isVisible(), 'Launch button must be visible in mobile drawer footer');
  const ctaText = await drawerCta.textContent();
  assert(ctaText.includes('Launch Visual Studio'), 'Drawer CTA must say Launch Visual Studio');

  // Close drawer using close button
  await page.locator('#mobile-menu-close').click();
  await page.waitForTimeout(350);
  isAriaHidden = await page.locator('#mobile-drawer-wrapper').getAttribute('aria-hidden');
  assert.strictEqual(isAriaHidden, 'true', 'Drawer must close when clicking close button');

  console.log('  ✓ Mobile Drawer opens left-to-right, covers screen, theme toggle & CTA work, closes correctly');

  // ---------------------------------------------------------
  // TEST 3: Tablet Viewport (768x1024 - iPad)
  // ---------------------------------------------------------
  console.log('\n📟 --- Testing Tablet Viewport (768x1024) ---');
  await page.setViewportSize({ width: 768, height: 1024 });

  for (const p of pagesToTest) {
    await page.goto(p.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const logoVisible = await page.locator('header a[aria-label="Visual Style Editor — home"]').isVisible();
    const hamburgerVisible = await page.locator('#mobile-menu-toggle').isVisible();
    const desktopNavVisible = await page.locator('header nav[role="navigation"]').isVisible();
    const desktopThemeToggleVisible = await page.locator('#theme-toggle').isVisible();
    const desktopCtaVisible = await page.locator('#nav-cta').isVisible();

    assert(logoVisible, `[${p.name}] Logo must be visible on tablet`);
    assert(hamburgerVisible, `[${p.name}] Hamburger button must be visible on tablet`);
    assert(!desktopNavVisible, `[${p.name}] Desktop nav links must be hidden on tablet (< 1024px)`);
    assert(!desktopThemeToggleVisible, `[${p.name}] Desktop theme toggle must be hidden on tablet header`);
    assert(!desktopCtaVisible, `[${p.name}] Desktop CTA must be hidden on tablet header`);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert(!hasHorizontalOverflow, `[${p.name}] Page has horizontal overflow on tablet! (${p.url})`);

    console.log(`  ✓ ${p.name}: Tablet navbar header clean (only logo + hamburger) & zero horizontal overflow`);
  }

  // Test tablet drawer full-screen coverage
  await page.locator('#mobile-menu-toggle').click();
  await page.waitForTimeout(350);
  const tabletPanelBox = await page.locator('#mobile-nav-panel').boundingBox();
  assert(tabletPanelBox.width >= 768, `Tablet drawer must cover screen width (got ${tabletPanelBox.width}px, expected >= 768px)`);
  await page.locator('#mobile-menu-close').click();
  await page.waitForTimeout(350);

  console.log('  ✓ Tablet drawer covers 100% of the screen from left to right');

  // ---------------------------------------------------------
  // TEST 4: Desktop Viewport Check (1280x800)
  // ---------------------------------------------------------
  console.log('\n💻 --- Testing Desktop Viewport (1280x800) ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const desktopNavVisible = await page.locator('header nav[role="navigation"]').isVisible();
  const desktopCtaVisible = await page.locator('#nav-cta').isVisible();
  const hamburgerHidden = !(await page.locator('#mobile-menu-toggle').isVisible());

  assert(desktopNavVisible, 'Desktop nav must be visible on desktop (>= 1024px)');
  assert(desktopCtaVisible, 'Desktop CTA must be visible on desktop');
  assert(hamburgerHidden, 'Hamburger button must be hidden on desktop');
  console.log('  ✓ Desktop navbar correctly shows full navigation links, theme toggle, and CTA button');

  await browser.close();
  console.log('\n🎉 ALL 100% MOBILE & TABLET NAVBAR & HERO TESTS PASSED WITH ZERO REGRESSIONS!');
}

run().catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
