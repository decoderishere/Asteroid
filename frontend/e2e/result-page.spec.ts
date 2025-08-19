import { test, expect } from '@playwright/test'

// Mock result data for testing
const mockResult = {
  run_id: 'test-run-12345678',
  markdown: '# Test Document\n\nThis is a test document with **bold** text.',
  html: '<h1>Test Document</h1><p>This is a test document with <strong>bold</strong> text.</p>',
  files: {
    markdown: 'documents/test-project/document.md',
    html: 'documents/test-project/document.html',
    pdf: 'documents/test-project/document.pdf',
    directory: 'documents/test-project/',
  },
  metadata: {
    title: 'Test Environmental Assessment',
    project_name: 'Test BESS Project',
    generated_date: '2024-01-15',
    sections_count: 5,
    using_mock: true,
  }
}

test.describe('Result Page UI', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoints
    await page.route('/api/runs/log', async (route) => {
      await route.fulfill({ json: { success: true } })
    })
    
    await page.route('/api/feedback', async (route) => {
      await route.fulfill({ json: { success: true } })
    })

    await page.route('/api/files/get*', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
        body: 'mock pdf content'
      })
    })

    await page.route('/api/files/zip', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/zip' },
        body: 'mock zip content'
      })
    })

    // Navigate to a test page that renders the result component
    await page.goto('/test-result-page')
    
    // Inject the mock result into the page
    await page.evaluate((result) => {
      // This would typically be set by your app's state management
      window.testResult = result
    }, mockResult)
  })

  test('should render all buttons based on available files', async ({ page }) => {
    // Check primary download button is visible (PDF should be primary)
    const primaryDownload = page.locator('button:has-text("Download PDF")')
    await expect(primaryDownload).toBeVisible()

    // Check dropdown menu items
    const dropdownTrigger = page.locator('button[aria-expanded]').first()
    await dropdownTrigger.click()
    
    await expect(page.locator('text=Download PDF')).toBeVisible()
    await expect(page.locator('text=Download Markdown')).toBeVisible()
    await expect(page.locator('text=Download HTML')).toBeVisible()
    await expect(page.locator('text=Download ZIP')).toBeVisible()

    // Close dropdown
    await page.keyboard.press('Escape')
  })

  test('should handle missing files gracefully', async ({ page }) => {
    // Test with result that has no PDF
    const resultNoPDF = { ...mockResult, files: { ...mockResult.files, pdf: undefined } }
    
    await page.evaluate((result) => {
      window.testResult = result
    }, resultNoPDF)
    
    await page.reload()
    
    // Primary button should now be Markdown
    const primaryDownload = page.locator('button:has-text("Download Markdown")')
    await expect(primaryDownload).toBeVisible()
    
    // PDF option should not be in dropdown
    const dropdownTrigger = page.locator('button[aria-expanded]').first()
    await dropdownTrigger.click()
    
    await expect(page.locator('text=Download PDF')).not.toBeVisible()
  })

  test('should submit feedback form', async ({ page }) => {
    // Open feedback dialog
    await page.locator('button:has-text("Give Feedback")').click()
    
    // Check dialog is open
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Select 4-star rating
    await page.locator('button:has-text("★")').nth(3).click()
    
    // Add comment
    await page.fill('textarea[placeholder*="Tell us what worked"]', 'Great document generation!')
    
    // Submit
    await page.locator('button:has-text("Submit Feedback")').click()
    
    // Check success state
    await expect(page.locator('text=Feedback Submitted!')).toBeVisible()
    
    // Dialog should auto-close after timeout (or we can close manually for test)
  })

  test('should log full result', async ({ page }) => {
    // Click log button
    await page.locator('button:has-text("Log Full Result")').click()
    
    // Should show loading state briefly
    await expect(page.locator('button:has-text("Logging...")')).toBeVisible()
    
    // Should complete and show success toast
    // Note: You'd need to wait for the toast to appear
    await page.waitForTimeout(1000) // Allow for async operation
  })

  test('should copy JSON to clipboard', async ({ page }) => {
    // Switch to JSON tab
    await page.locator('[role="tab"]:has-text("JSON")').click()
    
    // Click copy button
    await page.locator('button:has-text("Copy")').click()
    
    // Check clipboard content (this requires clipboard permissions)
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText()
    })
    
    expect(clipboardText).toContain('test-run-12345678')
    expect(clipboardText).toContain('Test BESS Project')
  })

  test('should handle theme toggle correctly', async ({ page }) => {
    // Take screenshot in light mode
    await page.screenshot({ path: 'e2e-results/light-mode.png', fullPage: true })
    
    // Toggle to dark mode
    await page.locator('[aria-label="Toggle theme"]').click()
    
    // Wait for theme to apply
    await page.waitForTimeout(500)
    
    // Take screenshot in dark mode  
    await page.screenshot({ path: 'e2e-results/dark-mode.png', fullPage: true })
    
    // Check that preview content is readable in both modes
    const previewContent = page.locator('.safe-output')
    const computedColor = await previewContent.evaluate((el) => {
      return window.getComputedStyle(el).color
    })
    
    // Should not be white text (would be invisible on white background)
    expect(computedColor).not.toBe('rgb(255, 255, 255)')
    expect(computedColor).not.toBe('rgba(255, 255, 255, 1)')
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check download buttons have proper labels
    const downloadPDF = page.locator('button:has-text("Download PDF")')
    await expect(downloadPDF).toHaveAttribute('aria-label', /download.*pdf/i)
    
    // Check feedback button is accessible
    const feedbackBtn = page.locator('button:has-text("Give Feedback")')
    await expect(feedbackBtn).toBeFocused()
    
    // Tab navigation should work
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Focus should be visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should respect sticky positioning on large screens', async ({ page }) => {
    // Set viewport to xl size
    await page.setViewportSize({ width: 1280, height: 1024 })
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    
    // Preview should still be visible (sticky)
    const preview = page.locator('.xl\\:sticky')
    await expect(preview).toBeInViewport()
    
    // But should not overlap header
    const header = page.locator('h1')
    const headerBox = await header.boundingBox()
    const previewBox = await preview.boundingBox()
    
    if (headerBox && previewBox) {
      expect(previewBox.y).toBeGreaterThan(headerBox.y + headerBox.height)
    }
  })
})

test.describe('Result Page Data Persistence', () => {
  test('should create feedback file', async ({ page }) => {
    // This test would require filesystem access or mocking
    // For now, we'll test that the API is called correctly
    
    let feedbackData = null
    await page.route('/api/feedback', async (route) => {
      feedbackData = await route.request().postDataJSON()
      await route.fulfill({ json: { success: true } })
    })
    
    await page.goto('/test-result-page')
    
    // Submit feedback
    await page.locator('button:has-text("Give Feedback")').click()
    await page.locator('button:has-text("★")').nth(4).click() // 5 stars
    await page.fill('textarea', 'Excellent work!')
    await page.locator('button:has-text("Submit Feedback")').click()
    
    // Verify API was called with correct data
    expect(feedbackData).toMatchObject({
      run_id: 'test-run-12345678',
      rating: 5,
      message: 'Excellent work!',
    })
  })

  test('should create log file', async ({ page }) => {
    let logData = null
    await page.route('/api/runs/log', async (route) => {
      logData = await route.request().postDataJSON()
      await route.fulfill({ json: { success: true } })
    })
    
    await page.goto('/test-result-page')
    
    // Click log button
    await page.locator('button:has-text("Log Full Result")').click()
    
    // Verify API was called with result data
    expect(logData).toHaveProperty('run')
    expect(logData.run.run_id).toBe('test-run-12345678')
  })
})