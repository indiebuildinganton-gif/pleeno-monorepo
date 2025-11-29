'use client'

import { useState, useEffect } from 'react'
import { Label, Select } from '@pleeno/ui'
import { useColleges } from '@/hooks/useColleges'
import { useBranches } from '@/hooks/useBranches'

interface CollegeBranchSelectProps {
  branchId: string
  onBranchChange: (branchId: string, commissionRate: number) => void
  error?: string
  disabled?: boolean
}

/**
 * CollegeBranchSelect Component
 *
 * Cascading dropdown component for selecting college and branch.
 * First select a college, then select a branch from that college.
 *
 * Features:
 * - Two-step selection: college → branch
 * - Fetches colleges and branches from API
 * - Automatic branch list update when college changes
 * - Passes commission rate to parent on branch selection
 * - Loading states for both dropdowns
 * - Empty states with helpful messages
 *
 * Epic 3: Entities Domain
 * Story 3.3: Student-College Enrollment Linking
 * Task 5: Payment Plan Creation Integration
 *
 * @param branchId - Currently selected branch ID
 * @param onBranchChange - Callback when branch is selected (includes commission rate)
 * @param error - Validation error message
 * @param disabled - Whether the selects are disabled
 */
export function CollegeBranchSelect({
  branchId,
  onBranchChange,
  error,
  disabled = false,
}: CollegeBranchSelectProps) {
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('')

  const {
    data: collegesData,
    isLoading: collegesLoading,
    error: collegesError,
  } = useColleges({ per_page: 100 })

  const {
    data: branchesData,
    isLoading: branchesLoading,
    error: branchesError,
  } = useBranches(selectedCollegeId)

  const colleges = collegesData?.data || []
  const branches = branchesData?.data || []

  /**
   * When branchId prop changes, find and set the corresponding college
   * This handles pre-filling the form when editing
   */
  useEffect(() => {
    if (branchId && !selectedCollegeId) {
      const branch = branches.find((b) => b.id === branchId)
      if (branch) {
        setSelectedCollegeId(branch.college_id)
      }
    }
  }, [branchId, branches, selectedCollegeId])

  /**
   * Handles college selection
   * Resets branch selection when college changes
   */
  const handleCollegeChange = (collegeId: string) => {
    setSelectedCollegeId(collegeId)
    // Reset branch selection when college changes
    if (branchId) {
      onBranchChange('', 0)
    }
  }

  /**
   * Handles branch selection
   * Passes commission rate to parent
   */
  const handleBranchChange = (selectedBranchId: string) => {
    const branch = branches.find((b) => b.id === selectedBranchId)
    const commissionRate = branch?.commission_rate_percent || 0
    onBranchChange(selectedBranchId, commissionRate)
  }

  /**
   * Formats branch for display
   * Format: "Branch Name - City"
   */
  const formatBranch = (branch: { name: string; city: string }) => {
    return `${branch.name} - ${branch.city}`
  }

  // Colleges loading state
  if (collegesLoading) {
    return (
      <div className="space-y-2">
        <Label>
          College & Branch <span className="text-destructive">*</span>
        </Label>
        <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          Loading colleges...
        </div>
      </div>
    )
  }

  // Colleges error state
  if (collegesError) {
    return (
      <div className="space-y-2">
        <Label>
          College & Branch <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <p className="text-sm text-destructive">Failed to load colleges. Please try again.</p>
        </div>
      </div>
    )
  }

  // Colleges empty state
  if (colleges.length === 0) {
    return (
      <div className="space-y-2">
        <Label>
          College & Branch <span className="text-destructive">*</span>
        </Label>
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-4 text-center">
          <p className="text-sm text-muted-foreground">No colleges found. Create a college first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* College selection */}
      <div className="space-y-2">
        <Label htmlFor="college_id">
          College <span className="text-destructive">*</span>
        </Label>
        <Select
          id="college_id"
          value={selectedCollegeId}
          onChange={(e) => handleCollegeChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select a college</option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name} ({college.country})
            </option>
          ))}
        </Select>
      </div>

      {/* Branch selection */}
      {selectedCollegeId && (
        <div className="space-y-2">
          <Label htmlFor="branch_id">
            Branch <span className="text-destructive">*</span>
          </Label>

          {branchesLoading ? (
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
              Loading branches...
            </div>
          ) : branchesError ? (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-sm text-destructive">Failed to load branches. Please try again.</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-3 text-center">
              <p className="text-sm text-muted-foreground">
                No branches found for this college. Add a branch first.
              </p>
            </div>
          ) : (
            <Select
              id="branch_id"
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={disabled || branchesLoading}
            >
              <option value="">Select a branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {formatBranch(branch)}
                </option>
              ))}
            </Select>
          )}

          {/* Validation error */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
