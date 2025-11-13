/**
 * useReportLookups Hooks
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 7: Create Colleges/Branches/Students Lookup APIs
 *
 * Custom TanStack Query hooks for report filter lookups.
 * Provides hooks for fetching colleges, branches, and students
 * to populate dropdowns in the ReportBuilder component.
 */

import { useQuery } from '@tanstack/react-query'

/**
 * College lookup response type
 */
export interface College {
  id: string
  name: string
  branch_count: number
}

/**
 * Branch lookup response type
 */
export interface Branch {
  id: string
  name: string
  college_id: string
  contract_expiration_date: string | null
}

/**
 * Student lookup response type
 */
export interface Student {
  id: string
  name: string
  college_name: string
}

/**
 * Custom hook to fetch colleges for the current agency
 *
 * @returns TanStack Query result with colleges data
 *
 * @example
 * ```tsx
 * const { data: colleges, isLoading, error } = useColleges()
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error error={error} />
 *
 * return (
 *   <select>
 *     {colleges?.map(college => (
 *       <option key={college.id} value={college.id}>
 *         {college.name} ({college.branch_count} branches)
 *       </option>
 *     ))}
 *   </select>
 * )
 * ```
 */
export function useColleges() {
  return useQuery({
    queryKey: ['report-lookup-colleges'],
    queryFn: async () => {
      const res = await fetch('/api/reports/lookup/colleges')

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Failed to fetch colleges: ${res.status} ${res.statusText}`
        )
      }

      return (await res.json()) as College[]
    },
    staleTime: 600000, // 10 minutes
  })
}

/**
 * Custom hook to fetch branches, optionally filtered by college ID(s)
 *
 * @param collegeIds - Optional array of college IDs to filter by
 * @returns TanStack Query result with branches data
 *
 * @example
 * ```tsx
 * const [selectedColleges, setSelectedColleges] = useState<string[]>([])
 * const { data: branches, isLoading, error } = useBranches(selectedColleges)
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error error={error} />
 *
 * return (
 *   <select>
 *     {branches?.map(branch => (
 *       <option key={branch.id} value={branch.id}>
 *         {branch.name}
 *       </option>
 *     ))}
 *   </select>
 * )
 * ```
 */
export function useBranches(collegeIds?: string[]) {
  return useQuery({
    queryKey: ['report-lookup-branches', collegeIds],
    queryFn: async () => {
      const params = new URLSearchParams()
      collegeIds?.forEach((id) => params.append('college_id', id))

      const res = await fetch(`/api/reports/lookup/branches?${params}`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Failed to fetch branches: ${res.status} ${res.statusText}`
        )
      }

      return (await res.json()) as Branch[]
    },
    enabled: Boolean(collegeIds?.length),
    staleTime: 600000, // 10 minutes
  })
}

/**
 * Custom hook to search students by name (typeahead)
 *
 * @param search - Search query (minimum 2 characters)
 * @returns TanStack Query result with students data
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('')
 * const { data: students, isLoading, error } = useStudents(searchQuery)
 *
 * return (
 *   <div>
 *     <input
 *       value={searchQuery}
 *       onChange={(e) => setSearchQuery(e.target.value)}
 *       placeholder="Search students..."
 *     />
 *     {isLoading && <Spinner />}
 *     {error && <Error error={error} />}
 *     {students && (
 *       <ul>
 *         {students.map(student => (
 *           <li key={student.id}>
 *             {student.name} - {student.college_name}
 *           </li>
 *         ))}
 *       </ul>
 *     )}
 *   </div>
 * )
 * ```
 */
export function useStudents(search: string) {
  return useQuery({
    queryKey: ['report-lookup-students', search],
    queryFn: async () => {
      const res = await fetch(`/api/reports/lookup/students?search=${encodeURIComponent(search)}`)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || `Failed to fetch students: ${res.status} ${res.statusText}`
        )
      }

      return (await res.json()) as Student[]
    },
    enabled: search.length >= 2,
    staleTime: 60000, // 1 minute
  })
}
