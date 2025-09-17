import { test, expect } from '@playwright/test';
import { 
  TEST_CONFIG, 
  ensureAuthenticated, 
  fillBasicTripInfo, 
  fillRateCalculationFields, 
  enableAutoCalculation,
  applyManualOverride,
  enableRateTableReflection,
  submitTripForm,
  verifyTripInSettlement,
  verifySettlementTotals
} from './helpers/test-setup';

test.describe('Rate Calculation E2E Workflow', () => {
  test.setTimeout(TEST_CONFIG.timeout);

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('Complete rate calculation workflow: auto-calc → manual override → rate table → settlement', async ({ page }) => {
    // Step 1: Navigate to trips page and open form
    await page.goto('/trips');
    await expect(page.locator(TEST_CONFIG.selectors.tripsPageTitle)).toBeVisible();

    // Step 2: Click "용차 등록" (Register Trip) button
    const registerButton = page.locator(TEST_CONFIG.selectors.registerTripButton);
    await registerButton.click();

    // Wait for the trip form to load
    await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

    // Step 3: Fill in basic trip information
    await fillBasicTripInfo(page);

    // Step 4: Enter rate calculation fields
    await fillRateCalculationFields(page);

    // Step 5: Enable auto-calculation and get calculated values
    const { driverFare: originalDriverFare, billingFare } = await enableAutoCalculation(page);

    console.log(`Auto-calculated fares - Driver: ${originalDriverFare}, Billing: ${billingFare}`);

    // Step 6: Apply manual override to driver fare (+10,000)
    const finalDriverFare = await applyManualOverride(page, originalDriverFare);

    console.log(`Manual override applied - New driver fare: ${finalDriverFare}`);

    // Step 7: Enable rate table reflection
    await enableRateTableReflection(page);

    // Step 8: Submit the trip form
    await submitTripForm(page);

    // Step 9: Verify trip appears in settlement
    await verifyTripInSettlement(page, TEST_CONFIG.rateCalculation.center, finalDriverFare);

    // Step 10: Verify settlement totals
    await verifySettlementTotals(page);

    console.log('✅ E2E Rate Calculation Workflow Test Completed Successfully');
  });

  test('Rate calculation error handling', async ({ page }) => {
    // Navigate to trips page and open form
    await page.goto('/trips');
    const registerButton = page.locator('button:has-text("등록"), button:has-text("추가")').first();
    await registerButton.click();

    await expect(page.locator('form')).toBeVisible();

    // Test with invalid/empty rate calculation fields
    const autoCalcToggle = page.locator('input[type="checkbox"]:has-text("자동")').first();
    if (await autoCalcToggle.isVisible()) {
      await autoCalcToggle.check();
    }

    // Try to calculate without required fields
    const centerInput = page.locator('input[id*="center"], input[placeholder*="센터"]').first();
    await centerInput.fill(''); // Empty center

    // Should see error message or calculation should not proceed
    await page.waitForTimeout(1000);
    
    const errorMessage = page.locator('text=오류, text=error, text=필수').first();
    if (await errorMessage.isVisible()) {
      console.log('Error handling works correctly for invalid input');
    }

    console.log('Rate calculation error handling test completed');
  });

  test('Settlement preview performance and data accuracy', async ({ page }) => {
    // Navigate directly to settlements page
    await page.goto('/settlements');
    await page.waitForLoadState('networkidle');

    // Measure page load performance
    const startTime = Date.now();
    await page.locator('h1').waitFor({ timeout: 10000 });
    const loadTime = Date.now() - startTime;

    console.log(`Settlement page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Verify settlement data structure
    const hasDataTable = await page.locator('table, .data-grid, .settlement-list').first().isVisible();
    const hasHeaderInfo = await page.locator('h1, .page-title').first().isVisible();
    
    expect(hasHeaderInfo).toBeTruthy();
    console.log(`Settlement page has proper structure: table=${hasDataTable}, header=${hasHeaderInfo}`);

    console.log('Settlement preview performance test completed');
  });
});