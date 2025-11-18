/**
 * Student Detail Navigation Component
 *
 * Story 7.5: Student Payment History Report
 * Task 8: Add Payment History Link from Student List
 *
 * Client component for student detail page navigation:
 * - URL hash navigation support (#payment-history)
 * - Quick-access buttons (Payment History, Edit)
 * - Section navigation tabs
 * - Smooth scrolling to sections
 */

'use client'

import { useEffect, useState } from 'react'
import { Receipt, Edit, User, GraduationCap, FileText } from 'lucide-react'
import { Button } from '@pleeno/ui'
import Link from 'next/link'

interface StudentDetailNavigationProps {
  studentId: string
  studentName: string
}

export function StudentDetailNavigation({
  studentId,
  studentName,
}: StudentDetailNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>('student-info')

  /**
   * Handle URL hash navigation on mount
   * Scrolls to section if hash is present in URL
   */
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const sectionId = hash.substring(1)
      scrollToSection(sectionId)
      setActiveSection(sectionId)
    }
  }, [])

  /**
   * Scroll to a section with smooth animation
   */
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  /**
   * Handle section navigation click
   */
  const handleSectionClick = (sectionId: string) => {
    scrollToSection(sectionId)
    setActiveSection(sectionId)
    // Update URL hash without triggering page reload
    window.history.pushState(null, '', `#${sectionId}`)
  }

  return (
    <div className="space-y-4">
      {/* Header with Quick-Access Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{studentName}</h1>

        <div className="flex items-center gap-3">
          {/* Payment History Quick-Access Button */}
          <Button
            onClick={() => handleSectionClick('payment-history')}
            variant="default"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Receipt className="h-4 w-4" />
            Payment History
          </Button>

          {/* Edit Student Button */}
          <Link href={`/students/${studentId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Student sections">
          <button
            onClick={() => handleSectionClick('student-info')}
            className={`${
              activeSection === 'student-info'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            aria-current={activeSection === 'student-info' ? 'page' : undefined}
          >
            <User className="h-4 w-4" />
            Student Information
          </button>

          <button
            onClick={() => handleSectionClick('enrollments')}
            className={`${
              activeSection === 'enrollments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            aria-current={activeSection === 'enrollments' ? 'page' : undefined}
          >
            <GraduationCap className="h-4 w-4" />
            Enrollments
          </button>

          <button
            onClick={() => handleSectionClick('payment-history')}
            className={`${
              activeSection === 'payment-history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            aria-current={
              activeSection === 'payment-history' ? 'page' : undefined
            }
          >
            <Receipt className="h-4 w-4" />
            Payment History
          </button>

          <button
            onClick={() => handleSectionClick('documents')}
            className={`${
              activeSection === 'documents'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
            aria-current={activeSection === 'documents' ? 'page' : undefined}
          >
            <FileText className="h-4 w-4" />
            Documents
          </button>
        </nav>
      </div>
    </div>
  )
}
