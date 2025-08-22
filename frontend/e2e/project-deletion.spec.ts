/**
 * End-to-End Project Deletion Tests
 * Tests the complete user flow for deleting projects through the UI
 */

import { test, expect } from '@playwright/test'

// Mock project data for testing
const mockProject = {
  id: 'test-project-123',
  name: 'Test BESS Project for E2E',
  substation_id: 'SUB-E2E-001',
  description: 'Test project for end-to-end deletion testing',
  status: 'active'
}

test.describe('Project Deletion Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API responses
    await page.route('**/api/projects/**/delete', async (route) => {
      const method = route.request().method()
      
      if (method === 'GET') {
        // Mock safety check response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              canDelete: true,
              blockingReasons: [],
              inFlightJobs: [],
              warnings: ['3 documents will be soft-deleted', '7 files will be soft-deleted']
            }
          })
        })
      } else if (method === 'DELETE') {
        // Mock deletion response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              success: true,
              message: `Project "${mockProject.name}" has been deleted successfully`,
              deletedAt: new Date().toISOString(),
              childCounts: {
                documents: 3,
                files: 7,
                tasks: 1,
                traces: 15
              }
            }
          })
        })
      }
    })

    // Mock project details API
    await page.route(`**/api/projects/${mockProject.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProject)
      })
    })

    // Mock other project-related APIs
    await page.route(`**/api/projects/${mockProject.id}/documents`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.route(`**/api/projects/${mockProject.id}/kpis`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    // Navigate to the project page
    await page.goto(`/projects/${mockProject.id}`)
    
    // Wait for the page to load
    await page.waitForSelector(`text=${mockProject.name}`)
  })

  test('should successfully delete project through complete UI flow', async ({ page }) => {
    // 1. Click the project actions dropdown
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    
    // 2. Click "Delete project" option
    await page.click('text=Eliminar proyecto')

    // 3. Wait for the delete modal to appear
    await page.waitForSelector('[data-testid="delete-project-modal"]')
    
    // 4. Verify the modal shows project information
    await expect(page.locator('text=Eliminar Proyecto')).toBeVisible()
    await expect(page.locator(`text=${mockProject.name}`)).toBeVisible()
    await expect(page.locator(`text=${mockProject.substation_id}`)).toBeVisible()

    // 5. Wait for safety check to complete
    await page.waitForSelector('text=3 documents will be soft-deleted')
    await page.waitForSelector('text=7 files will be soft-deleted')

    // 6. Verify the confirmation input is present but delete button is disabled
    const confirmInput = page.locator('input[placeholder*="Test BESS Project for E2E"]')
    const deleteButton = page.locator('button:has-text("Eliminar Proyecto")')
    
    await expect(confirmInput).toBeVisible()
    await expect(deleteButton).toBeDisabled()

    // 7. Enter incorrect confirmation text
    await confirmInput.fill('Wrong Project Name')
    await expect(page.locator('text=El texto no coincide')).toBeVisible()
    await expect(deleteButton).toBeDisabled()

    // 8. Enter correct confirmation text
    await confirmInput.fill(mockProject.name)
    await expect(deleteButton).toBeEnabled()

    // 9. Optionally enter a deletion reason
    const reasonTextarea = page.locator('textarea[placeholder*="Describa por qué"]')
    await reasonTextarea.fill('End-to-end test deletion')

    // 10. Click the delete button
    await deleteButton.click()

    // 11. Wait for deletion to complete
    await page.waitForSelector('text=Eliminando...', { state: 'detached' })

    // 12. Verify success toast appears
    await expect(page.locator('text=Proyecto eliminado')).toBeVisible()
    await expect(page.locator('text=ha sido movido a la papelera')).toBeVisible()

    // 13. Verify redirect to projects list
    await page.waitForURL('/projects')
    await expect(page).toHaveURL('/projects')
  })

  test('should handle deletion with blocking conditions', async ({ page }) => {
    // Mock safety check with blocking reasons
    await page.route('**/api/projects/**/delete', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              canDelete: false,
              blockingReasons: ['Critical document generation job is currently running'],
              inFlightJobs: [{
                id: 'job-123',
                type: 'document_generation',
                status: 'running',
                estimatedCompletion: new Date(Date.now() + 300000).toISOString()
              }],
              warnings: []
            }
          })
        })
      }
    })

    // Open delete modal
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')

    // Wait for modal and safety check
    await page.waitForSelector('[data-testid="delete-project-modal"]')
    await page.waitForSelector('text=No se puede eliminar ahora')

    // Verify blocking reason is displayed
    await expect(page.locator('text=Critical document generation job')).toBeVisible()

    // Verify in-flight job information is shown
    await expect(page.locator('text=Trabajos en curso')).toBeVisible()
    await expect(page.locator('text=document_generation')).toBeVisible()

    // Verify delete button is not present, only retry button
    await expect(page.locator('button:has-text("Eliminar Proyecto")')).not.toBeVisible()
    await expect(page.locator('button:has-text("Verificar de nuevo")')).toBeVisible()

    // Test retry functionality
    await page.click('button:has-text("Verificar de nuevo")')
    await page.waitForSelector('text=Verificando...', { state: 'detached' })
  })

  test('should handle deletion cancellation', async ({ page }) => {
    // Open delete modal
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')

    // Wait for modal
    await page.waitForSelector('[data-testid="delete-project-modal"]')

    // Click cancel button
    await page.click('button:has-text("Cancelar")')

    // Verify modal is closed
    await expect(page.locator('[data-testid="delete-project-modal"]')).not.toBeVisible()

    // Verify we're still on the project page
    await expect(page.locator(`text=${mockProject.name}`)).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/projects/**/delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
            requestId: 'test-error-123'
          })
        })
      }
    })

    // Complete the deletion flow
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')
    await page.waitForSelector('[data-testid="delete-project-modal"]')
    
    // Fill confirmation
    const confirmInput = page.locator('input[placeholder*="Test BESS Project for E2E"]')
    await confirmInput.fill(mockProject.name)
    
    // Attempt deletion
    await page.click('button:has-text("Eliminar Proyecto")')

    // Verify error handling
    await expect(page.locator('text=Error al eliminar')).toBeVisible()
    await expect(page.locator('text=Error interno del servidor')).toBeVisible()

    // Verify modal stays open after error
    await expect(page.locator('[data-testid="delete-project-modal"]')).toBeVisible()
  })

  test('should validate project name confirmation correctly', async ({ page }) => {
    // Open delete modal
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')
    await page.waitForSelector('[data-testid="delete-project-modal"]')

    const confirmInput = page.locator('input[placeholder*="Test BESS Project for E2E"]')
    const deleteButton = page.locator('button:has-text("Eliminar Proyecto")')

    // Test various invalid inputs
    const invalidInputs = [
      '', // Empty
      '   ', // Whitespace only
      'test bess project for e2e', // Lowercase
      'Test BESS Project for E2E ', // Extra space
      'Different Project Name', // Completely different
      mockProject.name.substring(0, -1) // Almost correct but missing last character
    ]

    for (const input of invalidInputs) {
      await confirmInput.fill(input)
      await expect(deleteButton).toBeDisabled()
      
      if (input.trim() && input !== mockProject.name) {
        await expect(page.locator('text=El texto no coincide')).toBeVisible()
      }
    }

    // Test correct input
    await confirmInput.fill(mockProject.name)
    await expect(deleteButton).toBeEnabled()
    await expect(page.locator('text=El texto no coincide')).not.toBeVisible()
  })

  test('should display loading states correctly', async ({ page }) => {
    // Mock slow safety check
    await page.route('**/api/projects/**/delete', async (route) => {
      if (route.request().method() === 'GET') {
        // Add delay to simulate slow response
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              canDelete: true,
              blockingReasons: [],
              inFlightJobs: [],
              warnings: []
            }
          })
        })
      }
    })

    // Open delete modal
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')

    // Verify loading state for safety check
    await expect(page.locator('text=Verificando seguridad de eliminación')).toBeVisible()
    
    // Wait for safety check to complete
    await page.waitForSelector('text=Verificando seguridad de eliminación', { state: 'detached' })

    // Now test deletion loading state
    await page.route('**/api/projects/**/delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        // Add delay to simulate slow deletion
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              success: true,
              message: 'Project deleted successfully',
              deletedAt: new Date().toISOString(),
              childCounts: { documents: 0, files: 0, tasks: 0, traces: 0 }
            }
          })
        })
      }
    })

    // Complete confirmation and start deletion
    const confirmInput = page.locator('input[placeholder*="Test BESS Project for E2E"]')
    await confirmInput.fill(mockProject.name)
    await page.click('button:has-text("Eliminar Proyecto")')

    // Verify deletion loading state
    await expect(page.locator('text=Eliminando...')).toBeVisible()
    await expect(page.locator('button:has-text("Eliminando...")')).toBeDisabled()
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Open dropdown with keyboard
    await page.press('[data-testid="project-actions-dropdown"], button:has-text("⋮")', 'Enter')
    
    // Navigate to delete option with arrow keys
    await page.press('body', 'ArrowDown')
    await page.press('body', 'ArrowDown') // Assuming delete is 2nd option
    await page.press('body', 'Enter')

    // Modal should open
    await page.waitForSelector('[data-testid="delete-project-modal"]')

    // Tab through form elements
    await page.press('body', 'Tab') // Move to confirmation input
    await page.keyboard.type(mockProject.name)

    await page.press('body', 'Tab') // Move to reason textarea
    await page.keyboard.type('Keyboard navigation test')

    await page.press('body', 'Tab') // Move to Cancel button
    await page.press('body', 'Tab') // Move to Delete button

    // Should be on delete button now
    const deleteButton = page.locator('button:has-text("Eliminar Proyecto")')
    await expect(deleteButton).toBeFocused()

    // Can cancel with Escape key
    await page.press('body', 'Escape')
    await expect(page.locator('[data-testid="delete-project-modal"]')).not.toBeVisible()
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('should work correctly on mobile devices', async ({ page }) => {
    // Mock APIs
    await page.route('**/api/projects/**/delete', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { canDelete: true, blockingReasons: [], inFlightJobs: [], warnings: [] }
          })
        })
      }
    })

    await page.route(`**/api/projects/${mockProject.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProject)
      })
    })

    await page.route(`**/api/projects/${mockProject.id}/documents`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.route(`**/api/projects/${mockProject.id}/kpis`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    })

    await page.goto(`/projects/${mockProject.id}`)
    await page.waitForSelector(`text=${mockProject.name}`)

    // Open delete modal on mobile
    await page.click('[data-testid="project-actions-dropdown"], button:has-text("⋮")')
    await page.click('text=Eliminar proyecto')

    // Verify modal is responsive
    await page.waitForSelector('[data-testid="delete-project-modal"]')
    
    // Modal should take up appropriate space on mobile
    const modal = page.locator('[data-testid="delete-project-modal"]')
    const modalBounds = await modal.boundingBox()
    
    expect(modalBounds?.width).toBeLessThan(400) // Should fit mobile width
    expect(modalBounds?.height).toBeLessThan(600) // Should fit mobile height

    // Form elements should be properly sized
    const confirmInput = page.locator('input[placeholder*="Test BESS Project for E2E"]')
    await expect(confirmInput).toBeVisible()
    
    // Should be able to type on mobile
    await confirmInput.fill(mockProject.name)
    await expect(page.locator('button:has-text("Eliminar Proyecto")')).toBeEnabled()
  })
})