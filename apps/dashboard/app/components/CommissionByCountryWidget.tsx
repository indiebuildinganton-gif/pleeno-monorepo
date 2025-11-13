/**
 * CommissionByCountryWidget Component
 *
 * Displays top 5 countries by commission with percentage share and trends.
 * Uses horizontal progress bars to show commission breakdown by country of origin.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 8: Create CommissionByCountryWidget Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { ArrowUp, ArrowDown, ArrowRight, AlertTriangle, RefreshCw, Globe } from 'lucide-react'

/**
 * Country Commission Data Type
 */
interface CountryCommission {
  country: string
  commission: number
  percentage_share: number // 0-100
  trend: 'up' | 'down' | 'neutral'
}

/**
 * API Response Type
 */
interface CommissionByCountryResponse {
  success: boolean
  data: CountryCommission[]
}

/**
 * Country Flag Emoji Mapping
 * Maps country names to their flag emojis
 */
const countryFlags: Record<string, string> = {
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Thailand': '🇹🇭',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'South Korea': '🇰🇷',
  'Japan': '🇯🇵',
  'Nepal': '🇳🇵',
  'Bangladesh': '🇧🇩',
  'Pakistan': '🇵🇰',
  'Sri Lanka': '🇱🇰',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Colombia': '🇨🇴',
  'Chile': '🇨🇱',
  'Argentina': '🇦🇷',
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Unknown': '🌍',
}

/**
 * Get country flag emoji
 */
function getCountryFlag(countryName: string): string {
  return countryFlags[countryName] || '🌍'
}

/**
 * Trend Arrow Component
 */
interface TrendArrowProps {
  trend: 'up' | 'down' | 'neutral'
}

function TrendArrow({ trend }: TrendArrowProps) {
  if (trend === 'up') {
    return <ArrowUp className="w-4 h-4 text-green-600" aria-label="Trending up" />
  }
  if (trend === 'down') {
    return <ArrowDown className="w-4 h-4 text-red-600" aria-label="Trending down" />
  }
  return <ArrowRight className="w-4 h-4 text-gray-400" aria-label="No change" />
}

/**
 * Get progress bar color based on percentage
 * Gradient from yellow (low) to green (high)
 */
function getProgressBarColor(percentage: number): string {
  if (percentage >= 30) {
    return 'bg-green-600'
  } else if (percentage >= 20) {
    return 'bg-green-500'
  } else if (percentage >= 15) {
    return 'bg-yellow-500'
  } else if (percentage >= 10) {
    return 'bg-yellow-400'
  }
  return 'bg-yellow-300'
}

/**
 * Country Row Component
 */
interface CountryRowProps {
  name: string
  commission: number
  percentageShare: number
  trend: 'up' | 'down' | 'neutral'
  currency?: string
}

function CountryRow({
  name,
  commission,
  percentageShare,
  trend,
  currency = 'AUD',
}: CountryRowProps) {
  const flag = getCountryFlag(name)
  const isUnknown = name === 'Unknown'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isUnknown ? (
            <Globe className="w-4 h-4 text-gray-400" aria-label="Unknown country" />
          ) : (
            <span className="text-xl" role="img" aria-label={`${name} flag`}>
              {flag}
            </span>
          )}
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(commission, currency, 'en-AU')}
          </span>
          <TrendArrow trend={trend} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor(percentageShare)} transition-all duration-300`}
            style={{ width: `${percentageShare}%` }}
            role="progressbar"
            aria-valuenow={percentageShare}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentageShare}% of total commission`}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 w-12 text-right">
          {percentageShare.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error State Component
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Failed to load commission by country
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the country commission data. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Main CommissionByCountryWidget Component
 */
export function CommissionByCountryWidget() {
  const { data, isLoading, isError, refetch } = useQuery<CommissionByCountryResponse>({
    queryKey: ['dashboard', 'commission-by-country'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/commission-by-country')
      if (!res.ok) {
        throw new Error('Failed to fetch commission by country data')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <WidgetSkeleton />
  }

  if (isError || !data?.data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const countries = data.data
  const currency = 'AUD' // TODO: Get from agency settings

  // Limit to top 5 countries (API should already return top 5, but ensure here)
  const topCountries = countries.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Countries</CardTitle>
        <p className="text-sm text-muted-foreground">
          Commission breakdown by country of origin
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCountries.map((country, idx) => (
            <CountryRow
              key={idx}
              name={country.country}
              commission={country.commission}
              percentageShare={country.percentage_share}
              trend={country.trend}
              currency={currency}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
