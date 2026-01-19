'use client'

import { cn } from '@pleeno/ui/lib/utils'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

/**
 * Confidence level thresholds
 */
const THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
} as const

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= THRESHOLDS.HIGH) return 'high'
  if (score >= THRESHOLDS.MEDIUM) return 'medium'
  return 'low'
}

/**
 * Get human-readable confidence label
 */
export function getConfidenceLabel(score: number): string {
  const level = getConfidenceLevel(score)
  switch (level) {
    case 'high':
      return 'High confidence'
    case 'medium':
      return 'Medium confidence'
    case 'low':
      return 'Low confidence - please verify'
  }
}

export interface OCRConfidenceIndicatorProps {
  /**
   * Confidence score (0-1)
   */
  score: number
  /**
   * Whether to show the score as a percentage
   */
  showPercentage?: boolean
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * OCRConfidenceIndicator Component
 *
 * Visual indicator for OCR extraction confidence levels.
 * Shows a colored badge with icon based on confidence score.
 *
 * Color scheme:
 * - Green (high): score >= 0.8
 * - Yellow (medium): score >= 0.5
 * - Red (low): score < 0.5
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 */
export function OCRConfidenceIndicator({
  score,
  showPercentage = false,
  size = 'md',
  className,
}: OCRConfidenceIndicatorProps) {
  const level = getConfidenceLevel(score)
  const label = getConfidenceLabel(score)
  const percentage = Math.round(score * 100)

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const colorClasses = {
    high: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-red-600 bg-red-50 border-red-200',
  }

  const Icon = level === 'high' ? CheckCircle : level === 'medium' ? AlertTriangle : AlertCircle

  return (
    <div
      title={`${label} (${percentage}%)`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 cursor-help',
        colorClasses[level],
        className
      )}
    >
      <Icon size={iconSize[size]} />
      {showPercentage && (
        <span className="text-xs font-medium">{percentage}%</span>
      )}
    </div>
  )
}

/**
 * Compact confidence dot indicator
 */
export function OCRConfidenceDot({
  score,
  className,
}: {
  score: number
  className?: string
}) {
  const level = getConfidenceLevel(score)
  const label = getConfidenceLabel(score)

  const colorClasses = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  }

  return (
    <span
      title={label}
      className={cn(
        'inline-block h-2 w-2 rounded-full cursor-help',
        colorClasses[level],
        className
      )}
    />
  )
}
