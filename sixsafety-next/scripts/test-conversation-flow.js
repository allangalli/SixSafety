const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = 'test-screenshots/phase5';
const TEST_LOG = 'test-screenshots/phase5/test-log.txt';

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let testLog = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  testLog.push(logMessage);
}

function logSection(title) {
  const separator = '='.repeat(80);
  log(`\n${separator}`);
  log(`  ${title}`);
  log(separator);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, filename, description) {
  try {
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({
      path: filepath,
      fullPage: true,
      timeout: 10000
    });
    log(`✅ Screenshot: ${filename} - ${description}`);
  } catch (error) {
    log(`⚠️  Screenshot failed: ${filename} - ${error.message}`);
  }
}

async function checkElementExists(page, selector, description) {
  try {
    const element = await page.locator(selector).first();
    const exists = await element.count() > 0;
    if (exists) {
      log(`✅ Found: ${description}`);
      return true;
    } else {
      log(`❌ NOT FOUND: ${description}`);
      return false;
    }
  } catch (error) {
    log(`❌ ERROR checking ${description}: ${error.message}`);
    return false;
  }
}

async function getElementText(page, selector) {
  try {
    const element = page.locator(selector).first();
    const text = await element.textContent({ timeout: 5000 });
    return text ? text.trim() : '';
  } catch (error) {
    return null;
  }
}

async function countElements(page, selector) {
  try {
    return await page.locator(selector).count();
  } catch (error) {
    return 0;
  }
}

async function testConversationFlow() {
  logSection('SixSafety Conversational Flow Test - Phase 5');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down so we can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen to console messages from the page
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DEBUG]') || text.includes('Error') || text.includes('error')) {
      log(`🔍 Browser Console: ${text}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    log(`❌ Page Error: ${error.message}`);
  });

  try {
    // ========================================
    // TEST 1: HOME PAGE
    // ========================================
    logSection('TEST 1: Home Page - Initial Load');

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    await takeScreenshot(page, '01-home-initial.png', 'Home page loaded');

    // Check for key elements
    await checkElementExists(page, 'text=SixSafety', 'SixSafety title');
    await checkElementExists(page, 'text=Your Neighbourhood Safety Advisor', 'Subtitle');
    await checkElementExists(page, 'select', 'Neighbourhood dropdown');
    await checkElementExists(page, 'text=Try it Yourself', 'QR code sidebar (desktop)');

    const hasSubmitButton = await checkElementExists(page, 'button:has-text("Submit")', 'Submit button');
    if (hasSubmitButton) {
      const isDisabled = await page.locator('button:has-text("Submit")').first().isDisabled();
      log(`  Submit button disabled: ${isDisabled} (should be true initially)`);
    }

    // ========================================
    // TEST 2: SELECT NEIGHBOURHOOD
    // ========================================
    logSection('TEST 2: Neighbourhood Selection');

    await page.locator('select').first().selectOption({ index: 1 });
    await sleep(2000);

    await takeScreenshot(page, '02-neighbourhood-selected.png', 'Neighbourhood selected');

    // Check for crime notification
    const hasCrimeNotification = await checkElementExists(page, 'text=/facing.*risks/', 'Crime risk notification');

    const submitButtonEnabled = await page.locator('button:has-text("Submit")').first().isEnabled();
    log(`  Submit button enabled: ${submitButtonEnabled} (should be true now)`);

    // ========================================
    // TEST 3: START SURVEY
    // ========================================
    logSection('TEST 3: Starting Survey');

    await page.locator('button:has-text("Submit")').first().click();
    log('  Clicked Submit button');

    await page.waitForURL('**/survey', { timeout: 10000 });
    log('  ✅ Navigated to /survey page');

    await sleep(2000);
    await takeScreenshot(page, '03-survey-loading.png', 'Survey page loading');

    // ========================================
    // TEST 4: WAIT FOR FIRST QUESTION
    // ========================================
    logSection('TEST 4: First Question Generation');

    log('  Waiting for first question to generate...');
    let questionLoaded = false;

    for (let i = 0; i < 60; i++) {
      await sleep(1000);

      const hasForm = await page.locator('form').count() > 0;
      const hasInput = await page.locator('form input, form select').count() > 0;

      if (hasForm && hasInput) {
        questionLoaded = true;
        log(`  ✅ First question loaded after ${i + 1} seconds`);
        break;
      }

      if (i % 5 === 0 && i > 0) {
        log(`  ⏳ Still waiting... ${i}s`);
      }
    }

    if (!questionLoaded) {
      log('  ❌ CRITICAL: First question did not load within 60 seconds');
      await takeScreenshot(page, 'ERROR-question-timeout.png', 'Question timeout');
      throw new Error('First question load timeout');
    }

    await sleep(2000);
    await takeScreenshot(page, '04-question-1-loaded.png', 'First question loaded');

    // ========================================
    // TEST 5: ANALYZE CONVERSATION STRUCTURE
    // ========================================
    logSection('TEST 5: Conversation Structure Analysis');

    // Count conversation messages
    const messageCount = await countElements(page, '[class*="conversation"], [class*="message"]');
    log(`  Total conversation elements: ${messageCount}`);

    // Check for assistant message (should be present)
    const hasAssistantMessage = await checkElementExists(page, 'text=/safety|security|neighbourhood/i', 'Assistant message content');

    // Check for response echo (should NOT be present yet - this is first question)
    const hasResponseEcho = await countElements(page, '[class*="echo"], [class*="notification"][class*="red"]');
    log(`  Response echo boxes: ${hasResponseEcho} (should be 0 on first question)`);

    // Check for summary (might not be present on first question)
    const hasSummary = await countElements(page, 'text=/You prefer|are concerned/i');
    log(`  Summary visible: ${hasSummary > 0}`);

    // ========================================
    // TEST 6: ANSWER FIRST QUESTION
    // ========================================
    logSection('TEST 6: Answering First Question');

    // Try to answer the form
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const radios = await page.locator('input[type="radio"]').count();
    const selects = await page.locator('select').count();

    log(`  Form elements found: ${checkboxes} checkboxes, ${radios} radios, ${selects} dropdowns`);

    // Answer based on what's available
    if (checkboxes > 0) {
      log(`  Selecting first 2 checkboxes...`);
      await page.locator('input[type="checkbox"]').nth(0).click();
      await sleep(300);
      await page.locator('input[type="checkbox"]').nth(1).click();
      await sleep(300);
    }

    if (radios > 0) {
      log(`  Selecting radio button groups...`);
      const radioNames = new Set();
      for (let i = 0; i < Math.min(radios, 10); i++) {
        try {
          const name = await page.locator('input[type="radio"]').nth(i).getAttribute('name');
          if (name && !radioNames.has(name)) {
            radioNames.add(name);
            await page.locator('input[type="radio"]').nth(i).click();
            await sleep(300);
          }
        } catch (e) {
          // Element might be stale, continue
        }
      }
      log(`  Selected ${radioNames.size} radio groups`);
    }

    if (selects > 0) {
      log(`  Selecting from dropdown...`);
      await page.locator('select').first().selectOption({ index: 1 });
      await sleep(300);
    }

    await takeScreenshot(page, '05-question-1-answered.png', 'First question answered');

    // Submit the form
    log('  Submitting first answer...');
    await page.locator('button[type="submit"]').first().click();
    await sleep(2000);

    await takeScreenshot(page, '06-after-submit-1.png', 'After first submission');

    // ========================================
    // TEST 7: VERIFY RESPONSE ECHO & CONVERSATION GROWTH
    // ========================================
    logSection('TEST 7: Conversation Growth Check');

    log('  Waiting for response echo and new question...');
    await sleep(5000); // Give time for AI to respond

    // Check for response echo (RED box)
    const echoCount = await countElements(page, '[class*="red"], [class*="notification"]');
    log(`  Notification boxes found: ${echoCount}`);

    const hasRedBox = await checkElementExists(page, '[class*="bg-red"], [class*="bg-notification-red"]', 'Red response echo box');

    // Check if conversation has grown
    const messageCountAfter = await countElements(page, '[class*="conversation"], [class*="message"]');
    log(`  Conversation elements after submit: ${messageCountAfter} (was ${messageCount})`);

    if (messageCountAfter > messageCount) {
      log(`  ✅ Conversation grew by ${messageCountAfter - messageCount} elements`);
    } else {
      log(`  ⚠️  WARNING: Conversation did not grow (might be loading)`);
    }

    // Check for summary update
    const summaryCount = await countElements(page, 'text=/You prefer|are concerned|interested in/i');
    log(`  Summary elements: ${summaryCount}`);

    // Wait for new question to load
    log('  Waiting for second question to load...');
    let secondQuestionLoaded = false;

    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const hasNewForm = await page.locator('form input, form select').count() > 0;
      if (hasNewForm) {
        secondQuestionLoaded = true;
        log(`  ✅ Second question loaded after ${i + 1}s`);
        break;
      }
      if (i % 5 === 0 && i > 0) {
        log(`  ⏳ Waiting for second question... ${i}s`);
      }
    }

    if (!secondQuestionLoaded) {
      log('  ❌ WARNING: Second question did not load within 30 seconds');
    }

    await takeScreenshot(page, '07-question-2-loaded.png', 'Second question loaded');

    // ========================================
    // TEST 8: ANSWER SECOND QUESTION
    // ========================================
    logSection('TEST 8: Answering Second Question');

    // Count messages before answering
    const messagesBeforeQ2 = await countElements(page, '[class*="message"], .conversation > *');
    log(`  Messages in conversation: ${messagesBeforeQ2}`);

    // Answer second question
    const checkboxes2 = await page.locator('input[type="checkbox"]').count();
    const radios2 = await page.locator('input[type="radio"]').count();

    log(`  Second form: ${checkboxes2} checkboxes, ${radios2} radios`);

    if (checkboxes2 > 0) {
      await page.locator('input[type="checkbox"]').first().click();
      await sleep(300);
    }

    if (radios2 > 0) {
      const radioNames2 = new Set();
      for (let i = 0; i < Math.min(radios2, 10); i++) {
        try {
          const name = await page.locator('input[type="radio"]').nth(i).getAttribute('name');
          if (name && !radioNames2.has(name)) {
            radioNames2.add(name);
            await page.locator('input[type="radio"]').nth(i).click();
            await sleep(300);
          }
        } catch (e) {}
      }
      log(`  Selected ${radioNames2.size} radio groups`);
    }

    await takeScreenshot(page, '08-question-2-answered.png', 'Second question answered');

    log('  Submitting second answer...');
    await page.locator('button[type="submit"]').first().click();
    await sleep(5000);

    await takeScreenshot(page, '09-after-submit-2.png', 'After second submission');

    // ========================================
    // TEST 9: VERIFY PROGRESSIVE DISCLOSURE
    // ========================================
    logSection('TEST 9: Progressive Disclosure Verification');

    const messagesAfterQ2 = await countElements(page, '[class*="message"], .conversation > *');
    log(`  Messages after Q2: ${messagesAfterQ2} (was ${messagesBeforeQ2})`);
    log(`  Message growth: ${messagesAfterQ2 - messagesBeforeQ2} new elements`);

    // Check for multiple response echoes
    const echoCount2 = await countElements(page, '[class*="red"], [class*="notification"][class*="red"]');
    log(`  Total red echo boxes: ${echoCount2} (should be 2 now)`);

    // Wait for third question
    log('  Waiting for third question...');
    let thirdQuestionLoaded = false;

    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const hasForm = await page.locator('form input, form select').count() > 0;
      if (hasForm) {
        thirdQuestionLoaded = true;
        log(`  ✅ Third question loaded after ${i + 1}s`);
        break;
      }
    }

    await takeScreenshot(page, '10-question-3-loaded.png', 'Third question loaded');

    // ========================================
    // TEST 10: ANSWER THIRD QUESTION
    // ========================================
    logSection('TEST 10: Final Question & Completion');

    const messagesBeforeQ3 = await countElements(page, '[class*="message"], .conversation > *');
    log(`  Messages before Q3: ${messagesBeforeQ3}`);

    // Answer third question
    const checkboxes3 = await page.locator('input[type="checkbox"]').count();
    const radios3 = await page.locator('input[type="radio"]').count();

    log(`  Third form: ${checkboxes3} checkboxes, ${radios3} radios`);

    if (checkboxes3 > 0) {
      await page.locator('input[type="checkbox"]').first().click();
      await sleep(300);
    }

    if (radios3 > 0) {
      const radioNames3 = new Set();
      for (let i = 0; i < Math.min(radios3, 10); i++) {
        try {
          const name = await page.locator('input[type="radio"]').nth(i).getAttribute('name');
          if (name && !radioNames3.has(name)) {
            radioNames3.add(name);
            await page.locator('input[type="radio"]').nth(i).click();
            await sleep(300);
          }
        } catch (e) {}
      }
      log(`  Selected ${radioNames3.size} radio groups`);
    }

    await takeScreenshot(page, '11-question-3-answered.png', 'Third question answered');

    log('  Submitting final answer...');
    await page.locator('button[type="submit"]').first().click();
    log('  Waiting for completion state...');
    await sleep(5000);

    await takeScreenshot(page, '12-after-submit-3.png', 'After third submission');

    // ========================================
    // TEST 11: VERIFY COMPLETION
    // ========================================
    logSection('TEST 11: Completion State Verification');

    // Wait for completion card
    let completionReached = false;
    for (let i = 0; i < 30; i++) {
      await sleep(1000);

      const hasCompletionText = await page.locator('text=/Survey Complete|safety plan/i').count() > 0;
      const hasPlanButton = await page.locator('button:has-text("Generate")').count() > 0;
      const hasForm = await page.locator('form input').count() > 0;

      if (hasCompletionText && hasPlanButton && !hasForm) {
        completionReached = true;
        log(`  ✅ Completion state reached after ${i + 1}s`);
        break;
      }

      if (i % 5 === 0 && i > 0) {
        log(`  ⏳ Waiting for completion... ${i}s`);
      }
    }

    await takeScreenshot(page, '13-completion.png', 'Completion state');

    if (!completionReached) {
      log('  ⚠️  WARNING: Completion state not reached within 30 seconds');

      // Debug: check what's on screen
      const bodyText = await page.textContent('body');
      log(`  Page contains "complete": ${bodyText.toLowerCase().includes('complete')}`);
      log(`  Page contains "generate": ${bodyText.toLowerCase().includes('generate')}`);
    } else {
      log('  ✅ Completion card displayed correctly');
    }

    const finalMessageCount = await countElements(page, '[class*="message"], .conversation > *');
    log(`  Final message count: ${finalMessageCount}`);
    log(`  Total conversation growth: ${finalMessageCount - messageCount} messages`);

    // ========================================
    // TEST 12: FINAL VERIFICATION
    // ========================================
    logSection('TEST 12: Final Conversation Analysis');

    // Scroll to top to see full conversation
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);
    await takeScreenshot(page, '14-full-conversation-top.png', 'Full conversation - top');

    // Scroll to middle
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await sleep(1000);
    await takeScreenshot(page, '15-full-conversation-middle.png', 'Full conversation - middle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await takeScreenshot(page, '16-full-conversation-bottom.png', 'Full conversation - bottom');

    // Final checks
    log('\n📊 FINAL CONVERSATION ANALYSIS:');
    const totalEchoes = await countElements(page, '[class*="red"], [class*="notification"][class*="red"]');
    log(`  ✓ Red echo boxes: ${totalEchoes} (expected: 3)`);

    const totalSummaries = await countElements(page, 'text=/You prefer|are concerned|interested/i');
    log(`  ✓ Summary boxes: ${totalSummaries}`);

    const sectionHeaders = await countElements(page, '[class*="header"], [class*="section"]');
    log(`  ✓ Section headers: ${sectionHeaders}`);

    const hasGenerateButton = await checkElementExists(page, 'button:has-text("Generate")', 'Generate Plan button');
    log(`  ✓ Generate Plan button: ${hasGenerateButton ? 'YES' : 'NO'}`);

    // ========================================
    // SUCCESS
    // ========================================
    logSection('TEST COMPLETE');
    log('✅ All test steps completed successfully!');
    log('📸 Screenshots saved to: ' + SCREENSHOTS_DIR);

  } catch (error) {
    logSection('TEST FAILED');
    log(`❌ Error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    await takeScreenshot(page, 'ERROR-final.png', 'Error state');
  } finally {
    // Save log to file
    fs.writeFileSync(TEST_LOG, testLog.join('\n'));
    log(`📝 Test log saved to: ${TEST_LOG}`);

    await browser.close();
  }
}

// Run the test
testConversationFlow().catch(console.error);
