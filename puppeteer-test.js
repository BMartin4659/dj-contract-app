const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

// Set screenshot directory
const screenshotDir = path.join(os.homedir(), 'Desktop', 'puppeteer-screenshots');
const fs = require('fs');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

(async () => {
  console.log('Saving screenshots to:', screenshotDir);
  console.log('Current working directory:', process.cwd());

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  async function saveScreenshot(name) {
    const filePath = path.join(screenshotDir, name);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log('Saved screenshot:', filePath);
  }

  // Helper to safely type if selector exists
  async function safeType(selector, value) {
    if (await page.$(selector)) {
      await page.type(selector, value);
  
  }

  // Fill out the form fields (update selectors as needed)
  await safeType('input[name="clientName"]', 'Test User');
  await safeType('input[name="email"]', 'testuser@example.com');
  await safeType('input[name="contactPhone"]', '5551234567');
  await safeType('input[name="eventType"]', 'Wedding');
  await safeType('input[name="guestCount"]', '100');
  await safeType('input[name="venueName"]', 'Test Venue');
  await safeType('input[name="venueLocation"]', '123 Main St, Test City');

  // --- Date Picker Debugging ---
  // 1. Click the input
  const dateInput = await page.$('input[placeholder*="event date" i]');
  if (dateInput) {
    await dateInput.click({ clickCount: 2 });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot('step1_after_input_click.png');
  }
  // 2. Click the calendar icon
  const calendarIcon = await page.$('button[aria-label*="calendar" i], .react-datepicker__calendar-icon, .fa-calendar-alt');
  if (calendarIcon) {
    await calendarIcon.click();
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot('step2_after_icon_click.png');
  }
  // 3. Wait longer for calendar popup
  let calendarAppeared = false;
  try {
    await page.waitForSelector('.react-datepicker__day', { timeout: 6000 });
    calendarAppeared = true;
  } catch (e) {
    await saveScreenshot('step3_calendar_not_found.png');
  }
  // 4. If calendar appeared, select a date
  if (calendarAppeared) {
    const day7 = await page.$('.react-datepicker__day--007:not(.react-datepicker__day--outside-month)');
    if (day7) {
      await day7.click();
    } else {
      const days = await page.$$('.react-datepicker__day:not(.react-datepicker__day--outside-month)');
      if (days.length > 0) {
        await days[0].click();
      }
    }
    await saveScreenshot('step4_after_date_selected.png');
  }

  // Set start and end time
  if (await page.$('select[name="startTime"]')) {
    await page.select('select[name="startTime"]', '6:00 PM');
  }
  if (await page.$('select[name="endTime"]')) {
    await page.select('select[name="endTime"]', '11:00 PM');
  }

  // Select Stripe as payment method
  if (await page.$('.payment-option[data-method="Stripe"]')) {
    await page.click('.payment-option[data-method="Stripe"]');
  }

  // Sign the contract
  await safeType('input[name="signerName"]', 'Test User');

  // Submit the form (Stripe)
  if (await page.$('button[type="button"]')) {
    await page.click('button[type="button"]');
  }

  // Wait for Stripe Checkout to load (hosted or embedded)
  await new Promise(r => setTimeout(r, 3000));

  // Try to handle hosted Stripe Checkout (redirect)
  const pages = await browser.pages();
  let stripePage = pages.find(p => p.url().includes('stripe.com'));
  if (!stripePage) {
    if (page.url().includes('stripe.com')) stripePage = page;
  }

  if (stripePage) {
    await stripePage.waitForSelector('iframe');
    const frames = stripePage.frames();
    let cardFrame = frames.find(f => f.url().includes('elements/page'));
    if (!cardFrame) {
      cardFrame = frames.find(f => f.$('input[name="cardnumber"]'));
    }
    if (cardFrame) {
      await cardFrame.type('input[name="cardnumber"]', '4242424242424242');
      await cardFrame.type('input[name="exp-date"]', '12/30');
      await cardFrame.type('input[name="cvc"]', '123');
      await cardFrame.type('input[name="postal"]', '12345');
      const payBtn = await stripePage.$('button[type="submit"], button[data-testid="hosted-checkout-submit-button"]');
      if (payBtn) await payBtn.click();
    } else {
      await stripePage.type('input[name="cardnumber"]', '4242424242424242').catch(()=>{});
      await stripePage.type('input[name="exp-date"]', '12/30').catch(()=>{});
      await stripePage.type('input[name="cvc"]', '123').catch(()=>{});
      await stripePage.type('input[name="postal"]', '12345').catch(()=>{});
      const payBtn = await stripePage.$('button[type="submit"], button[data-testid="hosted-checkout-submit-button"]');
      if (payBtn) await payBtn.click();
    }
    // Wait longer for redirect back to app
    await new Promise(r => setTimeout(r, 15000));
    await page.bringToFront();
  }

  // Wait longer for confirmation page
  await new Promise(r => setTimeout(r, 8000));

  // Take a screenshot for debugging
  await saveScreenshot('confirmation-debug.png');

  // Check for multiple possible confirmation messages
  const content = await page.content();
  const successPhrases = [
    'Payment Successful',
    'booking has been confirmed',
    'Thank you for your booking',
    'Your payment was successful',
    'Booking Submitted',
    'Thank you! Your DJ booking request has been submitted successfully',
    'Success',
    'Confirmation'
  ];
  const found = successPhrases.some(phrase => content.includes(phrase));
  if (found) {
    console.log('✅ Confirmation page detected!');
  } else {
    console.log('❌ Confirmation page NOT detected.');
  }

  await browser.close();
})(); 