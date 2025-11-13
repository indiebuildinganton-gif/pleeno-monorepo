# Task 5: Integrate Report Builder and Results

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #1, #3, #5

---

## Task Overview

Create the main Payment Plans Report page that integrates the ReportBuilder and ReportResultsTable components with TanStack Query for data fetching.

---

## Requirements

### Main Page Component

Create `apps/reports/app/payment-plans/page.tsx`

### Layout Structure

```
+---------------------------+
| ReportBuilder             |
| (collapsible after run)   |
+---------------------------+
| ReportResultsTable        |
| (appears after generate)  |
+---------------------------+
```

### Implementation Details

1. **TanStack Query Setup**
   - Create custom hook: `apps/reports/app/hooks/usePaymentPlansReport.ts`
   - Use `useMutation` for POST request (not `useQuery`)
   - Store results in mutation state

   ```typescript
   export function usePaymentPlansReport() {
     return useMutation({
       mutationFn: async (request: PaymentPlansReportRequest) => {
         const res = await fetch('/api/reports/payment-plans', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(request),
         })
         if (!res.ok) throw new Error('Failed to generate report')
         return res.json() as Promise<PaymentPlansReportResponse>
       },
     })
   }
   ```

2. **Page Component Logic**
   ```typescript
   export default function PaymentPlansReportPage() {
     const mutation = usePaymentPlansReport()
     const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(false)

     const handleGenerate = (formData: ReportBuilderFormData) => {
       mutation.mutate(formData, {
         onSuccess: () => setIsBuilderCollapsed(true),
         onError: () => toast.error('Failed to generate report'),
       })
     }

     return (
       <div>
         <ReportBuilder onGenerate={handleGenerate} />
         {mutation.isSuccess && (
           <ReportResultsTable
             data={mutation.data.data}
             pagination={mutation.data.pagination}
             summary={mutation.data.summary}
             onPageChange={handlePageChange}
             onSort={handleSort}
           />
         )}
       </div>
     )
   }
   ```

3. **Preview Mode (AC #5)**
   - Report displays in read-only table after generation
   - User can adjust filters and regenerate
   - "Export to CSV" and "Export to PDF" buttons (placeholder for future stories)

4. **Reset Filters**
   - "Reset Filters" button clears form
   - Hides results table
   - Expands filter form

5. **Error Handling**
   - Show error toast on API failure
   - Display retry button
   - Log error for debugging

---

## Technical Constraints

- **TanStack Query:** Version 5.90.7 for server state
- **State Management:** Use React state for UI state (collapsed, etc.)
- **TypeScript:** Strict types for all data flows
- **Toast Notifications:** Use Shadcn UI toast for success/error messages

---

## Acceptance Criteria

✅ PaymentPlansReportPage integrates ReportBuilder and ReportResultsTable
✅ TanStack Query mutation for report generation
✅ "Generate Report" fetches data and displays results
✅ Report displays in preview mode (AC #5)
✅ ReportBuilder collapses after first run
✅ "Reset Filters" clears form and hides results
✅ Loading state during API call
✅ Error handling with toast notification
✅ Pagination changes trigger new API call
✅ Sorting changes trigger new API call

---

## Reference Code

See story markdown for:
- TanStack Query setup (lines 810-830)
- Page integration logic (lines 167-189)

---

## Output

After implementing:
1. Show PaymentPlansReportPage component code
2. Show usePaymentPlansReport hook code
3. Test complete flow:
   - Set filters → Click "Generate Report"
   - Verify API called with correct payload
   - Verify results table displays
   - Verify ReportBuilder collapses
   - Change page → Verify new API call
   - Click "Reset Filters" → Verify form clears
4. Test error handling (mock API failure)
