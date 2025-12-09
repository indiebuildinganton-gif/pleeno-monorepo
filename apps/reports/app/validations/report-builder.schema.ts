import { z } from 'zod'

export const reportBuilderSchema = z
  .object({
    filters: z.object({
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      college_ids: z.array(z.string()).optional(),
      branch_ids: z.array(z.string()).optional(),
      student_ids: z.array(z.string()).optional(),
      status: z.array(z.enum(['active', 'completed', 'cancelled'])).optional(),
      contract_expiration_from: z.string().optional(),
      contract_expiration_to: z.string().optional(),
    }),
    columns: z.array(z.string()).min(1, 'Select at least one column'),
    pagination: z.object({
      page: z.number().int().positive().default(1),
      page_size: z.number().int().positive().default(25),
    }),
    sort: z
      .object({
        column: z.string(),
        direction: z.enum(['asc', 'desc']),
      })
      .optional(),
  })
  .refine(
    (data) => {
      // Validate date range: date_from should be before or equal to date_to
      if (data.filters.date_from && data.filters.date_to) {
        return new Date(data.filters.date_from) <= new Date(data.filters.date_to)
      }
      return true
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['filters', 'date_from'],
    }
  )
  .refine(
    (data) => {
      // Validate contract expiration range
      if (data.filters.contract_expiration_from && data.filters.contract_expiration_to) {
        return (
          new Date(data.filters.contract_expiration_from) <=
          new Date(data.filters.contract_expiration_to)
        )
      }
      return true
    },
    {
      message: 'Contract expiration start date must be before or equal to end date',
      path: ['filters', 'contract_expiration_from'],
    }
  )

export type ReportBuilderFormData = z.infer<typeof reportBuilderSchema>
