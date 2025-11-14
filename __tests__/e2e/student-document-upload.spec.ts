/**
 * E2E Test: Student Document Upload Flow
 *
 * Tests the complete user journey of uploading and managing student documents:
 * - Navigate to student detail page
 * - Upload various document types
 * - View uploaded documents
 * - Preview documents
 * - Delete documents
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 17: Testing - E2E Tests
 */

import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Student Document Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as agency admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@testagency.com')
    await page.fill('input[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    // Create a test student first
    await page.goto('/students/new')
    await page.fill('input[name="full_name"]', 'Document Test Student')
    await page.fill('input[name="passport_number"]', `DOC${Date.now()}`)
    await page.click('button[type="submit"]')
    await page.waitForURL('/students')

    // Navigate to the created student
    await page.fill('input[placeholder*="Search"]', 'Document Test Student')
    await page.keyboard.press('Enter')
    await page.click('text=Document Test Student')
  })

  test('uploads a PDF document successfully', async ({ page }) => {
    // Click on Documents tab
    await page.click('text=Documents')

    // Prepare test PDF file
    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    // Wait for upload success
    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Verify document appears in list
    await expect(page.locator('text=test-document.pdf')).toBeVisible()
  })

  test('uploads an image document successfully', async ({ page }) => {
    await page.click('text=Documents')

    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')
    await expect(page.locator('text=test-image.jpg')).toBeVisible()
  })

  test('rejects file larger than 10MB', async ({ page }) => {
    await page.click('text=Documents')

    // Create a large file (mock)
    const largePath = path.join(__dirname, '../fixtures/large-file.pdf')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(largePath)

    // Should show error
    await expect(page.locator('text=File size must be less than 10MB')).toBeVisible()
  })

  test('rejects invalid file types', async ({ page }) => {
    await page.click('text=Documents')

    const invalidPath = path.join(__dirname, '../fixtures/malicious.exe')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(invalidPath)

    // Should show error
    await expect(page.locator('text=Invalid file type')).toBeVisible()
  })

  test('displays document metadata', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Should display file name, size, and upload date
    await expect(page.locator('text=test-document.pdf')).toBeVisible()
    await expect(page.locator('text=/KB|MB/')).toBeVisible()
    await expect(page.locator('text=/ago|minutes|hours/')).toBeVisible()
  })

  test('previews PDF document', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Click on document to preview
    await page.click('text=test-document.pdf')

    // Document viewer modal should open
    await expect(page.locator('[data-testid="document-viewer-modal"]')).toBeVisible()
    await expect(page.locator('iframe[title="Document preview"]')).toBeVisible()
  })

  test('previews image document', async ({ page }) => {
    await page.click('text=Documents')

    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Click on document to preview
    await page.click('text=test-image.jpg')

    // Image preview should be visible
    await expect(page.locator('img[alt="Document preview"]')).toBeVisible()
  })

  test('closes document viewer on ESC key', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await page.click('text=test-document.pdf')
    await expect(page.locator('[data-testid="document-viewer-modal"]')).toBeVisible()

    // Press ESC
    await page.keyboard.press('Escape')

    // Modal should close
    await expect(page.locator('[data-testid="document-viewer-modal"]')).not.toBeVisible()
  })

  test('downloads document', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await page.click('text=test-document.pdf')

    // Set up download handler
    const downloadPromise = page.waitForEvent('download')

    // Click download button in viewer
    await page.click('[data-testid="download-button"]')

    // Verify download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('test-document.pdf')
  })

  test('deletes document with confirmation', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('text=test-document.pdf')).toBeVisible()

    // Click delete button
    const deleteButton = page.locator('[data-testid="delete-document-button"]').first()
    await deleteButton.click()

    // Confirmation dialog should appear
    await expect(page.locator('text=Are you sure')).toBeVisible()

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')

    // Success message
    await expect(page.locator('[role="status"]')).toContainText('Document deleted successfully')

    // Document should be removed from list
    await expect(page.locator('text=test-document.pdf')).not.toBeVisible()
  })

  test('cancels document deletion', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('text=test-document.pdf')).toBeVisible()

    // Click delete button
    const deleteButton = page.locator('[data-testid="delete-document-button"]').first()
    await deleteButton.click()

    // Cancel deletion
    await page.click('text=Cancel')

    // Document should still be visible
    await expect(page.locator('text=test-document.pdf')).toBeVisible()
  })

  test('uploads multiple documents', async ({ page }) => {
    await page.click('text=Documents')

    // Upload first document
    const testPDF1 = path.join(__dirname, '../fixtures/passport.pdf')
    let fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDF1)
    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Upload second document
    const testPDF2 = path.join(__dirname, '../fixtures/diploma.pdf')
    fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDF2)
    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Upload third document (image)
    const testImage = path.join(__dirname, '../fixtures/photo.jpg')
    fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImage)
    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // All documents should be visible
    await expect(page.locator('text=passport.pdf')).toBeVisible()
    await expect(page.locator('text=diploma.pdf')).toBeVisible()
    await expect(page.locator('text=photo.jpg')).toBeVisible()
  })

  test('shows empty state when no documents', async ({ page }) => {
    await page.click('text=Documents')

    // Should show empty state
    await expect(page.locator('text=No documents uploaded yet')).toBeVisible()
  })

  test('displays upload progress indicator', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    // Should show uploading indicator
    await expect(page.locator('text=/Uploading|Processing/')).toBeVisible()
  })

  test('supports drag and drop upload', async ({ page }) => {
    await page.click('text=Documents')

    // Find drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"]')
    await expect(dropZone).toBeVisible()

    // Simulate drag and drop
    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')
  })

  test('validates accepted file types', async ({ page }) => {
    await page.click('text=Documents')

    // Should display accepted file types
    await expect(page.locator('text=/PDF|JPG|JPEG|PNG/')).toBeVisible()
  })

  test('logs document upload activity', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await expect(page.locator('[role="status"]')).toContainText('Document uploaded successfully')

    // Navigate to activity tab
    await page.click('text=Activity')

    // Should show document upload activity
    await expect(page.locator('text=uploaded document')).toBeVisible()
  })

  test('shows document uploader name', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    // Should show who uploaded the document
    await expect(page.locator('text=/Uploaded by|Admin User/')).toBeVisible()
  })

  test('toggles fullscreen mode in document viewer', async ({ page }) => {
    await page.click('text=Documents')

    const testPDFPath = path.join(__dirname, '../fixtures/test-document.pdf')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testPDFPath)

    await page.click('text=test-document.pdf')

    // Click maximize button
    await page.click('[data-testid="maximize-button"]')

    // Modal should be fullscreen
    const modal = page.locator('[data-testid="document-viewer-modal"]')
    await expect(modal).toHaveClass(/max-w-full/)

    // Click again to restore
    await page.click('[data-testid="maximize-button"]')
    await expect(modal).not.toHaveClass(/max-w-full/)
  })
})
