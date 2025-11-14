/**
 * Email Template Editor Component
 *
 * Rich editor for creating and editing email templates with:
 * - Subject line and body HTML editing
 * - Variable placeholder helper
 * - Live preview with sample data
 * - Save/Cancel actions
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 */

'use client'

import { useState, useRef } from 'react'
import { Button } from '@pleeno/ui/components/ui/button'
import { Input } from '@pleeno/ui/components/ui/input'
import { Label } from '@pleeno/ui/components/ui/label'
import { Textarea } from '@pleeno/ui/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pleeno/ui/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui/components/ui/card'
import { Badge } from '@pleeno/ui/components/ui/badge'
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_TYPE_OPTIONS,
  TEMPLATE_VARIABLES,
  type EmailTemplate,
} from '../lib/default-templates'
import { renderTemplate, SAMPLE_PREVIEW_DATA } from '../lib/template-preview'

interface EmailTemplateEditorProps {
  /** Existing template to edit (undefined for new template) */
  template?: EmailTemplate & { id?: string }
  /** Callback when template is saved */
  onSave: (template: Partial<EmailTemplate>) => Promise<void>
  /** Callback when editing is cancelled */
  onCancel: () => void
  /** Whether the save operation is in progress */
  isSaving?: boolean
}

export function EmailTemplateEditor({
  template,
  onSave,
  onCancel,
  isSaving = false,
}: EmailTemplateEditorProps) {
  // Form state
  const [templateType, setTemplateType] = useState(template?.template_type || '')
  const [subject, setSubject] = useState(template?.subject || '')
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '')
  const [showPreview, setShowPreview] = useState(true)

  // Ref for textarea to handle cursor position when inserting placeholders
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /**
   * Handles template type change and optionally loads default template
   */
  const handleTemplateTypeChange = (value: string) => {
    setTemplateType(value)

    // If this is a new template (not editing), load default template for selected type
    if (!template?.id && DEFAULT_TEMPLATES[value]) {
      const defaultTemplate = DEFAULT_TEMPLATES[value]
      setSubject(defaultTemplate.subject)
      setBodyHtml(defaultTemplate.body_html)
    }
  }

  /**
   * Inserts a placeholder variable at the cursor position in the textarea
   */
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = bodyHtml
    const before = text.substring(0, start)
    const after = text.substring(end)

    // Insert placeholder at cursor position
    const newText = before + placeholder + after
    setBodyHtml(newText)

    // Set focus back to textarea and move cursor after inserted placeholder
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + placeholder.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!templateType || !subject || !bodyHtml) {
      alert('Please fill in all required fields')
      return
    }

    await onSave({
      template_type: templateType,
      subject,
      body_html: bodyHtml,
      variables: {}, // Could be enhanced to track which variables are used
    })
  }

  // Render preview
  const previewSubject = renderTemplate(subject)
  const previewBody = renderTemplate(bodyHtml)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="template-type">
          Template Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={templateType}
          onValueChange={handleTemplateTypeChange}
          disabled={!!template?.id} // Cannot change type when editing
        >
          <SelectTrigger id="template-type">
            <SelectValue placeholder="Select template type" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {template?.id && (
          <p className="text-xs text-muted-foreground">
            Template type cannot be changed when editing
          </p>
        )}
      </div>

      {/* Subject Line */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Subject Line <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter email subject"
          required
        />
      </div>

      {/* Email Body */}
      <div className="space-y-2">
        <Label htmlFor="body">
          Email Body (HTML) <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="body"
          ref={textareaRef}
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          placeholder="Enter email body HTML"
          className="min-h-[300px] font-mono text-sm"
          required
        />
        <p className="text-xs text-muted-foreground">
          HTML formatting is supported. Use the variable placeholders below to insert dynamic
          content.
        </p>
      </div>

      {/* Placeholder Helper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Click any variable to insert it at the cursor position:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATE_VARIABLES).map(([key, value]) => (
              <Badge
                key={key}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => insertPlaceholder(value)}
              >
                {value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="show-preview"
          checked={showPreview}
          onChange={(e) => setShowPreview(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor="show-preview" className="cursor-pointer">
          Show Preview
        </Label>
      </div>

      {/* Preview Pane */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preview Subject */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Subject:</p>
                <p className="text-sm font-medium">{previewSubject || '(No subject)'}</p>
              </div>

              {/* Preview Body */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Body:</p>
                <div
                  className="border rounded p-4 bg-white text-sm"
                  dangerouslySetInnerHTML={{ __html: previewBody || '<p>(No content)</p>' }}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                This preview uses sample data: {SAMPLE_PREVIEW_DATA.student_name},{' '}
                {SAMPLE_PREVIEW_DATA.college_name}, etc.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : template?.id ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  )
}
