/**
 * Manual Interactive Testing Script
 * Uses Playwright to interact with the app like a real user
 * Takes screenshots at each step for visual inspection
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotsDir = path.join(__dirname, '../test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, filename, dir) {
  try {
    await page.screenshot({
      path: path.join(dir, filename),
      fullPage: true,
      timeout: 10000 // 10 second timeout
    });
    console.log(`✅ Screenshot: ${filename}`);
  } catch (error) {
    console.log(`⚠️  Screenshot timeout: ${filename} (continuing anyway...)`);
  }
}

async function runManualTest() {
  console.log('🚀 Starting manual interactive test...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 1000, // Slow down by 1s per action
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('Error') || text.includes('error')) {
      console.log(`🔍 Browser Console: ${text}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    // ==========================================
    // STEP 1: Home Page
    // ==========================================
    console.log('📍 Step 1: Loading home page...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    await sleep(2000);
    await takeScreenshot(page, '01-home-initial.png', screenshotsDir);
    console.log('');

    // ==========================================
    // STEP 2: Select Neighbourhood
    // ==========================================
    console.log('📍 Step 2: Selecting neighbourhood...');

    // Find and click select dropdown
    const select = page.locator('select').first();
    const selectExists = await select.count() > 0;

    if (!selectExists) {
      console.log('❌ ERROR: No select element found!');
      await takeScreenshot(page, 'ERROR-no-select.png', screenshotsDir);
    } else {
      // Select Trinity-Bellwoods (index 1, as 0 is placeholder)
      await select.selectOption({ index: 1 });
      await sleep(2000);
      await takeScreenshot(page, '02-neighbourhood-selected.png', screenshotsDir);
      // ✅ Screenshot: 02-neighbourhood-selected.png\n

      // Check if button is enabled
      const button = page.getByRole('button', { name: /start/i }).first();
      const isEnabled = await button.isEnabled();
      console.log(`🔘 Start Survey button enabled: ${isEnabled}\n`);

      // ==========================================
      // STEP 3: Click Start Survey
      // ==========================================
      console.log('📍 Step 3: Clicking Start Survey...');
      await button.click();
      await page.waitForURL('**/survey', { timeout: 10000 });
      await sleep(3000); // Wait for initial question to load
      await takeScreenshot(page, '03-survey-loading.png', screenshotsDir);
      // ✅ Screenshot: 03-survey-loading.png\n

      // ==========================================
      // STEP 4: Wait for First Question
      // ==========================================
      console.log('📍 Step 4: Waiting for first question to generate...');

      // Wait for loading to finish (up to 30 seconds)
      let questionLoaded = false;
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        const hasForm = await page.locator('form').count() > 0;
        const hasCheckbox = await page.locator('input[type="checkbox"]').count() > 0;
        const hasButton = await page.locator('button[type="submit"]').count() > 0;

        if (hasForm && (hasCheckbox || hasButton)) {
          questionLoaded = true;
          break;
        }

        if (i % 5 === 0) {
          console.log(`⏳ Waiting... ${i}s`);
        }
      }

      if (!questionLoaded) {
        console.log('❌ ERROR: First question did not load within 30 seconds');
        await takeScreenshot(page, 'ERROR-question-timeout.png', screenshotsDir);
        return;
      }

      await sleep(2000);
      await takeScreenshot(page, '04-survey-question-1.png', screenshotsDir);
      // ✅ Screenshot: 04-survey-question-1.png\n

      // ==========================================
      // STEP 5: Answer First Question
      // ==========================================
      console.log('📍 Step 5: Answering first question...');

      // Check for checkboxes (crime type selection)
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        console.log(`📝 Found ${checkboxCount} checkboxes`);
        // Select first 2 options
        await checkboxes.nth(0).click();
        await sleep(500);
        await checkboxes.nth(1).click();
        await sleep(500);
      } else {
        // Try radio buttons
        const radioButtons = page.locator('input[type="radio"]');
        const radioCount = await radioButtons.count();
        if (radioCount > 0) {
          console.log(`📝 Found ${radioCount} radio buttons`);
          await radioButtons.nth(0).click();
          await sleep(500);
        }
      }

      await takeScreenshot(page, '05-survey-answered-1.png', screenshotsDir);
      // ✅ Screenshot: 05-survey-answered-1.png\n

      // Click Continue/Submit
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await sleep(5000); // Wait for next question generation

      await takeScreenshot(page, '06-survey-question-2-loading.png', screenshotsDir);
      // ✅ Screenshot: 06-survey-question-2-loading.png\n

      // ==========================================
      // STEP 6: Second Question
      // ==========================================
      console.log('📍 Step 6: Waiting for second question...');

      // Wait for loading
      for (let i = 0; i < 20; i++) {
        await sleep(1000);
        const hasNewForm = await page.locator('form input').count() > 0;
        if (hasNewForm) {
          break;
        }
      }

      await sleep(2000);
      await takeScreenshot(page, '07-survey-question-2.png', screenshotsDir);
      // ✅ Screenshot: 07-survey-question-2.png\n

      // Answer second question - be more thorough
      // Click all radio button groups (at least first option in each group)
      const radioButtons2 = page.locator('input[type="radio"]');
      const radioCount2 = await radioButtons2.count();
      if (radioCount2 > 0) {
        // Click first radio in each group
        const radioNames = new Set();
        for (let i = 0; i < radioCount2; i++) {
          const name = await radioButtons2.nth(i).getAttribute('name');
          if (name && !radioNames.has(name)) {
            radioNames.add(name);
            await radioButtons2.nth(i).click();
            await sleep(300);
          }
        }
      }
      // Also select some checkboxes if present
      const checkboxes2 = page.locator('input[type="checkbox"]');
      const checkCount2 = await checkboxes2.count();
      if (checkCount2 > 0) {
        await checkboxes2.nth(0).click();
        await sleep(300);
      }

      await takeScreenshot(page, '08-survey-answered-2.png', screenshotsDir);
      // ✅ Screenshot: 08-survey-answered-2.png\n

      // Submit second answer
      await page.locator('button[type="submit"]').first().click();
      await sleep(5000);

      await takeScreenshot(page, '09-survey-question-3-loading.png', screenshotsDir);
      // ✅ Screenshot: 09-survey-question-3-loading.png\n

      // ==========================================
      // STEP 7: Third Question
      // ==========================================
      console.log('📍 Step 7: Third question...');

      for (let i = 0; i < 20; i++) {
        await sleep(1000);
        const hasNewForm = await page.locator('form input').count() > 0;
        if (hasNewForm) {
          break;
        }
      }

      await sleep(2000);
      await takeScreenshot(page, '10-survey-question-3.png', screenshotsDir);
      // ✅ Screenshot: 10-survey-question-3.png\n

      // Answer third question - answer ALL required fields
      console.log('📝 Answering all fields in third question...');

      // Scroll to bottom to ensure all form content is visible and rendered
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(2000);

      // Scroll back to top to see all fields
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(1000);

      // Wait for all form elements to be present (retry with increasing delays)
      let allGroupNames = [];
      for (let wait = 0; wait < 3; wait++) {
        // Scroll through the page to trigger any lazy loading
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(1000);
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(1000);

        // Get all unique radio button group names
        const radioButtons3 = page.locator('input[type="radio"]');
        const radioCount3 = await radioButtons3.count();
        console.log(`📝 Scan ${wait + 1}: Found ${radioCount3} total radio buttons`);

        allGroupNames = [];
        for (let i = 0; i < radioCount3; i++) {
          try {
            const name = await radioButtons3.nth(i).getAttribute('name', { timeout: 3000 });
            if (name && !allGroupNames.includes(name)) {
              allGroupNames.push(name);
            }
          } catch (e) {
            // Element may have been re-rendered, skip
          }
        }

        console.log(`📝 Found ${allGroupNames.length} radio button groups`);
        if (allGroupNames.length > 0) break;
        if (wait < 2) {
          console.log(`  ⏳ Waiting for radio buttons to render...`);
          await sleep(3000);
        }
      }

      // Click first radio button in each group
      for (const groupName of allGroupNames) {
        try {
          const radioInGroup = page.locator(`input[type="radio"][name="${groupName}"]`).first();
          await radioInGroup.scrollIntoViewIfNeeded();
          await sleep(300);
          await radioInGroup.click({ timeout: 5000 });
          console.log(`  ✓ Clicked first option in group: ${groupName}`);
          await sleep(500);
        } catch (e) {
          console.log(`  ⚠️ Failed to click radio in group: ${groupName} - ${e.message}`);
        }
      }

      // Select checkboxes if present
      const checkboxes3 = page.locator('input[type="checkbox"]');
      const checkCount3 = await checkboxes3.count();
      if (checkCount3 > 0) {
        console.log(`📝 Found ${checkCount3} checkboxes`);
        await checkboxes3.nth(0).click();
        console.log(`  ✓ Clicked first checkbox`);
        await sleep(300);
      }

      // Scroll to bottom again and verify no validation errors
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1500);
      const bodyText = await page.textContent('body');
      if (bodyText && bodyText.includes('This field is required')) {
        console.log(`  ⚠️ WARNING: Form still has required field errors!`);
      } else {
        console.log(`  ✅ All required fields appear to be answered`);
      }

      await takeScreenshot(page, '11-survey-answered-3.png', screenshotsDir);
      // ✅ Screenshot: 11-survey-answered-3.png\n

      // Submit final answer
      console.log('📤 About to submit third answer...');
      const submitButton3 = page.locator('button[type="submit"]').first();
      const isEnabled3 = await submitButton3.isEnabled();
      const isVisible3 = await submitButton3.isVisible();
      console.log(`   Submit button enabled: ${isEnabled3}, visible: ${isVisible3}`);

      await sleep(1000); // Give a moment for React state to settle
      await submitButton3.click();
      console.log('📤 Clicked submit button, waiting for completion state...');

      // Wait for completion state to appear (up to 30 seconds)
      let completionReached = false;
      for (let i = 0; i < 30; i++) {
        await sleep(1000);

        // Check if completion button exists
        const generateButton = page.getByRole('button', { name: /generate.*plan/i }).first();
        const buttonExists = await generateButton.count() > 0;

        // Check if form is gone
        const formExists = await page.locator('form').count() > 0;

        if (buttonExists && !formExists) {
          completionReached = true;
          console.log(`✅ Completion state reached after ${i + 1}s`);
          break;
        }

        if (i % 5 === 0 && i > 0) {
          console.log(`⏳ Waiting for completion... ${i}s`);
        }
      }

      await takeScreenshot(page, '12-survey-complete.png', screenshotsDir);
      // ✅ Screenshot: 12-survey-complete.png\n

      if (!completionReached) {
        console.log('⚠️  WARNING: Completion state not reached within 30 seconds\n');
      }

      // ==========================================
      // STEP 8: Generate Plan
      // ==========================================
      console.log('📍 Step 8: Clicking Generate Plan...');

      // Click "Generate My Safety Plan" button
      const generateButton = page.getByRole('button', { name: /generate.*plan/i }).first();
      const generateExists = await generateButton.count() > 0;

      if (generateExists) {
        await generateButton.click();
        await page.waitForURL('**/plan', { timeout: 10000 });
        await sleep(3000);

        await takeScreenshot(page, '13-plan-loading.png', screenshotsDir);
        // ✅ Screenshot: 13-plan-loading.png\n

        // ==========================================
        // STEP 9: Wait for Plan Generation
        // ==========================================
        console.log('📍 Step 9: Waiting for plan generation (up to 60s)...');

        let planGenerated = false;
        for (let i = 0; i < 60; i++) {
          await sleep(1000);

          // Check if plan is displayed (look for markdown content or "Your Safety Plan" text)
          const pageText = await page.textContent('body');
          const hasPlan = pageText?.includes('Safety Plan') || pageText?.includes('Overview') || pageText?.includes('Priority');

          if (hasPlan) {
            const hasError = pageText?.includes('Failed') || pageText?.includes('Error');
            if (!hasError) {
              planGenerated = true;
              break;
            }
          }

          if (i % 5 === 0) {
            console.log(`⏳ Generating plan... ${i}s`);
            await takeScreenshot(page, `14-plan-generating-${i}s.png`, screenshotsDir);
          }
        }

        if (planGenerated) {
          await sleep(2000);
          await takeScreenshot(page, '15-plan-complete.png', screenshotsDir);
          // ✅ Screenshot: 15-plan-complete.png\n
          console.log('🎉 Plan generation successful!\n');
        } else {
          console.log('❌ ERROR: Plan did not generate within 60 seconds');
          await takeScreenshot(page, 'ERROR-plan-timeout.png', screenshotsDir);
        }
      } else {
        console.log('❌ ERROR: Generate Plan button not found');
        await takeScreenshot(page, 'ERROR-no-generate-button.png', screenshotsDir);
      }
    }

    console.log('\n✅ Manual test complete! Check test-screenshots/ folder\n');

  } catch (error) {
    console.error('❌ Error during test:', error);
    await takeScreenshot(page, 'ERROR-exception.png', screenshotsDir);
  } finally {
    await browser.close();
  }
}

// Run the test
runManualTest().catch(console.error);
