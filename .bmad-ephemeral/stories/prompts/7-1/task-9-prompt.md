# Task 9: Add Responsive Design and Accessibility

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #3

---

## Task Overview

Implement responsive design for mobile/tablet layouts and ensure WCAG 2.1 AA accessibility compliance.

---

## Requirements

### 1. Responsive Design

#### ReportBuilder Responsive Layout

- **Desktop:** Two-column filter layout
- **Tablet:** Single column, stacked sections
- **Mobile:** Accordion sections (collapsible filters)

```typescript
// Use Tailwind responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Filters */}
</div>

// Mobile accordion
<Accordion type="single" collapsible className="md:hidden">
  <AccordionItem value="filters">
    <AccordionTrigger>Filters</AccordionTrigger>
    <AccordionContent>
      {/* Filter inputs */}
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="columns">
    <AccordionTrigger>Select Columns</AccordionTrigger>
    <AccordionContent>
      {/* Column checkboxes */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

#### ReportResultsTable Responsive Layout

- **Desktop:** Full table with all columns
- **Tablet:** Hide optional columns, show via "..." menu
- **Mobile:** Convert to card list with key fields

```typescript
// Desktop: Full table
<Table className="hidden md:table">
  {/* Full table */}
</Table>

// Mobile: Card list
<div className="md:hidden space-y-4">
  {data.map(row => (
    <Card key={row.id}>
      <CardHeader>
        <CardTitle>{row.student_name}</CardTitle>
        <CardDescription>{row.college_name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Plan Amount</span>
            <span className="font-medium">{formatCurrency(row.plan_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Paid</span>
            <span className="font-medium">{formatCurrency(row.total_paid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <StatusBadge status={row.status} />
          </div>
          {row.contract_expiration_date && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contract Expiration</span>
              <ContractExpirationBadge days={row.days_until_contract_expiration} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### 2. Accessibility (WCAG 2.1 AA)

#### ARIA Labels and Keyboard Navigation

1. **Filter Inputs**
   ```typescript
   <Input
     id="date-from"
     aria-label="Filter by date from"
     {...field}
   />

   <Select aria-label="Filter by college">
     <SelectTrigger>
       <SelectValue placeholder="Select colleges" />
     </SelectTrigger>
   </Select>
   ```

2. **Table**
   ```typescript
   <Table aria-label="Payment plans report">
     <TableHeader>
       <TableRow>
         <TableHead
           aria-sort={sortColumn === 'student_name' ? sortDirection : 'none'}
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               handleSort('student_name')
             }
           }}
         >
           Student Name
         </TableHead>
       </TableRow>
     </TableHeader>
   </Table>
   ```

3. **Pagination**
   ```typescript
   <nav aria-label="Report pagination">
     <Button
       aria-label="Go to previous page"
       disabled={page === 1}
       onClick={() => onPageChange(page - 1)}
     >
       Previous
     </Button>
     <Button
       aria-label="Go to next page"
       disabled={page === totalPages}
       onClick={() => onPageChange(page + 1)}
     >
       Next
     </Button>
   </nav>
   ```

4. **Preset Filters**
   ```typescript
   <Button
     type="button"
     variant="outline"
     onClick={() => handlePresetFilter('expiring_30')}
     aria-pressed={activePreset === 'expiring_30'}
     aria-label="Filter contracts expiring in 30 days"
   >
     Expiring in 30 days
   </Button>
   ```

#### Focus Management

- Ensure all interactive elements are keyboard accessible
- Visible focus indicators (Shadcn UI default)
- Tab order follows logical reading order
- Skip links for screen readers (optional)

#### Color Contrast

- Ensure contract expiration highlighting meets WCAG AA contrast ratios:
  - Yellow background: Use darker text color
  - Orange background: Use darker text color
  - Red background: Use darker text color

#### Screen Reader Support

- Use semantic HTML (`<table>`, `<nav>`, `<button>`)
- Provide descriptive labels for all form inputs
- Use `aria-live` for dynamic content updates (e.g., report generation)

### 3. Testing Responsive and Accessibility

#### Manual Testing

1. **Responsive Testing**
   - Test on Desktop (1920x1080)
   - Test on Tablet (768x1024)
   - Test on Mobile (375x667)
   - Test landscape and portrait orientations

2. **Accessibility Testing**
   - Test keyboard navigation (Tab, Enter, Space, Arrow keys)
   - Test with screen reader (VoiceOver on macOS, NVDA on Windows)
   - Test color contrast (use browser DevTools or WebAIM Contrast Checker)
   - Test focus indicators (visible on all interactive elements)

#### Automated Testing

Use Playwright for automated accessibility tests:

```typescript
// __tests__/e2e/reports/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/reports/payment-plans')

  // Generate report
  await page.click('button:has-text("Generate Report")')
  await page.waitForSelector('table')

  // Run axe accessibility scan
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()

  expect(accessibilityScanResults.violations).toEqual([])
})

test('should be keyboard navigable', async ({ page }) => {
  await page.goto('/reports/payment-plans')

  // Tab through all interactive elements
  await page.keyboard.press('Tab') // Date from
  await page.keyboard.press('Tab') // Date to
  await page.keyboard.press('Tab') // College select
  // ... test all form inputs

  // Verify focus indicators visible
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
  expect(focusedElement).toBeTruthy()
})
```

---

## Technical Constraints

- **Responsive Design:** Use Tailwind CSS responsive classes (`md:`, `lg:`)
- **Accessibility:** WCAG 2.1 AA compliance required
- **UI Components:** Shadcn UI components are accessible by default (Radix UI)
- **Testing:** Use Playwright + axe-core for automated accessibility testing

---

## Acceptance Criteria

✅ ReportBuilder responsive (desktop: 2-column, tablet: 1-column, mobile: accordion)
✅ ReportResultsTable responsive (desktop: table, mobile: cards)
✅ ARIA labels on all form inputs
✅ Keyboard navigation works for all interactive elements
✅ Focus indicators visible on all elements
✅ Table has aria-label and aria-sort attributes
✅ Pagination is keyboard accessible
✅ Contract expiration highlighting meets WCAG AA contrast
✅ Screen reader tested (VoiceOver or NVDA)
✅ Automated accessibility tests pass (axe-core)
✅ Mobile device tested (iOS/Android)

---

## Reference Code

See story markdown for:
- Responsive design notes (lines 256-270, 1011-1015)
- Accessibility considerations (lines 129)

---

## Output

After implementing:
1. Show responsive design code for ReportBuilder (mobile accordion)
2. Show responsive design code for ReportResultsTable (mobile cards)
3. Show ARIA labels and keyboard navigation code
4. Test responsive layout:
   - Desktop view: Full table and 2-column filters
   - Tablet view: Single column filters
   - Mobile view: Accordion filters, card list
5. Test accessibility:
   - Keyboard navigation through all elements
   - Screen reader test (read key elements)
   - Run automated accessibility scan (axe-core)
6. Show accessibility test results (no violations)
