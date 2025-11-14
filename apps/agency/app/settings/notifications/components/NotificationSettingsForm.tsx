/**
 * Notification Settings Form Component
 *
 * Client component that allows agency admins to configure notification rules
 * for different recipient types and event types. Uses a matrix of toggles to
 * enable/disable notifications independently for each combination.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 */

'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Label, Switch } from '@pleeno/ui'
import {
  RECIPIENT_TYPES,
  EVENT_TYPES,
  RECIPIENT_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_DESCRIPTIONS,
  type RecipientType,
  type EventType,
} from '@pleeno/validations'

interface NotificationRule {
  id: string
  agency_id: string
  recipient_type: RecipientType
  event_type: EventType
  is_enabled: boolean
  template_id: string | null
  trigger_config: Record<string, any>
  created_at: string
  updated_at: string
}

interface RuleState {
  [key: string]: boolean // key format: "recipient_type:event_type"
}

export function NotificationSettingsForm() {
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [ruleState, setRuleState] = useState<RuleState>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch notification rules on mount
  useEffect(() => {
    async function loadRules() {
      try {
        setFetchLoading(true)

        const response = await fetch('/api/notification-rules')
        const result = await response.json()

        if (response.ok && result.success) {
          const fetchedRules = result.data || []
          setRules(fetchedRules)

          // Build initial state from fetched rules
          const initialState: RuleState = {}
          fetchedRules.forEach((rule: NotificationRule) => {
            const key = `${rule.recipient_type}:${rule.event_type}`
            initialState[key] = rule.is_enabled
          })
          setRuleState(initialState)
        } else {
          setMessage({
            type: 'error',
            text: result.error?.message || 'Failed to load notification settings',
          })
        }

        setFetchLoading(false)
      } catch (error) {
        console.error('Error loading notification rules:', error)
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
        setFetchLoading(false)
      }
    }

    loadRules()
  }, [])

  const getRuleKey = (recipientType: RecipientType, eventType: EventType): string => {
    return `${recipientType}:${eventType}`
  }

  const isRuleEnabled = (recipientType: RecipientType, eventType: EventType): boolean => {
    const key = getRuleKey(recipientType, eventType)
    return ruleState[key] || false
  }

  const handleToggle = (recipientType: RecipientType, eventType: EventType, enabled: boolean) => {
    const key = getRuleKey(recipientType, eventType)
    setRuleState((prev) => ({
      ...prev,
      [key]: enabled,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Convert ruleState back to array format for API
      const updates = Object.entries(ruleState).map(([key, is_enabled]) => {
        const [recipient_type, event_type] = key.split(':') as [RecipientType, EventType]
        return { recipient_type, event_type, is_enabled }
      })

      const response = await fetch('/api/notification-rules/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updates }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Notification settings saved successfully!' })
      } else {
        setMessage({
          type: 'error',
          text: result.error?.message || 'Failed to save notification settings',
        })
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading notification settings...</p>
      </div>
    )
  }

  return (
    <>
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {RECIPIENT_TYPES.map((recipientType) => (
            <Card key={recipientType} className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {RECIPIENT_TYPE_LABELS[recipientType]}
              </h2>

              <div className="space-y-4">
                {EVENT_TYPES.map((eventType) => (
                  <div
                    key={`${recipientType}:${eventType}`}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <Label htmlFor={`${recipientType}-${eventType}`} className="cursor-pointer">
                        <div className="font-medium">{EVENT_TYPE_LABELS[eventType]}</div>
                        <div className="text-sm text-muted-foreground">
                          {EVENT_TYPE_DESCRIPTIONS[eventType]}
                        </div>
                      </Label>
                    </div>

                    <Switch
                      id={`${recipientType}-${eventType}`}
                      checked={isRuleEnabled(recipientType, eventType)}
                      onCheckedChange={(checked) => handleToggle(recipientType, eventType, checked)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
