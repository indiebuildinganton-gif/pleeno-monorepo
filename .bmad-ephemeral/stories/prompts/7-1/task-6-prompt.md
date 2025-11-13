# Task 6: Add Contract Expiration Quick Filters

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #8

---

## Task Overview

Add preset filter buttons to the ReportBuilder for quick contract expiration filtering.

---

## Requirements

### Preset Filter Buttons

Add to `apps/reports/app/components/ReportBuilder.tsx`:

1. **"Expiring in 30 days"**
   - Sets: `contract_expiration_from = today`, `contract_expiration_to = today + 30 days`

2. **"Expiring in 60 days"**
   - Sets: `contract_expiration_from = today`, `contract_expiration_to = today + 60 days`

3. **"Expiring in 90 days"**
   - Sets: `contract_expiration_from = today`, `contract_expiration_to = today + 90 days`

4. **"Already expired"**
   - Sets: `contract_expiration_to = today - 1 day`

### Implementation Details

1. **Preset Handler**
   ```typescript
   const handlePresetFilter = (preset: 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired') => {
     const today = new Date()
     const filters = { ...form.getValues('filters') }

     switch (preset) {
       case 'expiring_30':
         filters.contract_expiration_from = formatISO(today)
         filters.contract_expiration_to = formatISO(addDays(today, 30))
         break
       case 'expiring_60':
         filters.contract_expiration_from = formatISO(today)
         filters.contract_expiration_to = formatISO(addDays(today, 60))
         break
       case 'expiring_90':
         filters.contract_expiration_from = formatISO(today)
         filters.contract_expiration_to = formatISO(addDays(today, 90))
         break
       case 'expired':
         filters.contract_expiration_to = formatISO(subDays(today, 1))
         break
     }

     form.setValue('filters', filters)
   }
   ```

2. **UI Layout**
   - Place preset buttons above the contract expiration date pickers
   - Use `Button` with `variant="outline"`
   - Active preset visually highlighted (e.g., blue border)
   - Allow custom date range override after preset selection

3. **State Management**
   - Track active preset in component state
   - Clear active preset if user manually changes date fields
   - Highlight active preset button

---

## Technical Constraints

- **Date Manipulation:** Use `date-fns` (`addDays`, `subDays`, `formatISO`)
- **Form Integration:** Use React Hook Form `setValue()` to update filters
- **UI Components:** Shadcn UI Button with outline variant

---

## Acceptance Criteria

✅ Four preset filter buttons added to ReportBuilder
✅ "Expiring in 30 days" sets correct date range
✅ "Expiring in 60 days" sets correct date range
✅ "Expiring in 90 days" sets correct date range
✅ "Already expired" sets correct date range
✅ Active preset visually highlighted
✅ User can override preset with custom date range
✅ Preset clears if user manually changes dates

---

## Reference Code

See story markdown for:
- Preset handler implementation (lines 569-592, 610-630)
- UI layout structure (lines 191-205)

---

## Output

After implementing:
1. Show updated ReportBuilder code with preset buttons
2. Test each preset button:
   - Click "Expiring in 30 days" → Verify dates set correctly
   - Click "Expiring in 60 days" → Verify dates set correctly
   - Click "Expiring in 90 days" → Verify dates set correctly
   - Click "Already expired" → Verify date set correctly
3. Test preset override:
   - Click preset → Manually change date → Verify preset indicator clears
4. Test active preset highlighting
