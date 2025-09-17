import { test, expect } from '@playwright/test'

test.describe('Charter Management Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await page.context().clearCookies()
  })

  test('should redirect to login when accessing /charters without authentication', async ({ page }) => {
    // Navigate to charters page without authentication
    await page.goto('/charters')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/auth\/signin/)
    
    // Should show login form
    await expect(page.locator('h1')).toContainText('로그인')
  })

  test('should show charter menu for authenticated admin user', async ({ page }) => {
    // Mock authenticated admin session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-admin',
            name: 'Test Admin',
            email: 'admin@example.com',
            role: 'ADMIN',
            isActive: true
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Navigate to home page
    await page.goto('/')
    
    // Should show charter menu in sidebar
    await expect(page.locator('nav').getByText('용차 관리')).toBeVisible()
    
    // Charter menu should have NEW badge
    await expect(page.locator('nav').getByText('NEW')).toBeVisible()
    
    // Should not show any trips menu
    await expect(page.locator('nav').getByText('운행 관리')).not.toBeVisible()
  })

  test('should allow navigation to charter page for authenticated user', async ({ page }) => {
    // Mock authenticated user session
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-dispatcher',
            name: 'Test Dispatcher',
            email: 'dispatcher@example.com',
            role: 'DISPATCHER',
            isActive: true
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      })
    })

    // Navigate to home page
    await page.goto('/')
    
    // Click on charter menu
    await page.locator('nav').getByText('용차 관리').click()
    
    // Should navigate to charters page
    await expect(page).toHaveURL('/charters')
    
    // Charter menu should be active (highlighted)
    await expect(page.locator('nav a[href="/charters"]')).toHaveClass(/bg-gradient-to-r/)
  })

  test('should show different permissions for different roles', async ({ page }) => {
    const roles = [
      { role: 'ADMIN', name: 'Admin User' },
      { role: 'DISPATCHER', name: 'Dispatcher User' },
      { role: 'ACCOUNTANT', name: 'Accountant User' }
    ]

    for (const { role, name } of roles) {
      // Mock session for current role
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: `test-${role.toLowerCase()}`,
              name,
              email: `${role.toLowerCase()}@example.com`,
              role,
              isActive: true
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
        })
      })

      await page.goto('/')
      
      // All roles should see charter menu (with read permission)
      await expect(page.locator('nav').getByText('용차 관리')).toBeVisible()
      
      // Clear route for next iteration
      await page.unroute('**/api/auth/session')
    }
  })
})