/**
 * Email Template Management Component
 *
 * Client component that handles:
 * - Fetching and displaying existing templates
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 * - Template preview
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@pleeno/ui/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pleeno/ui/components/ui/card'
import { Badge } from '@pleeno/ui/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@pleeno/ui/components/ui/dialog'
import { EmailTemplateEditor } from '../../../../components/email-template-editor'
import type { EmailTemplate } from '../../../../lib/default-templates'
import { TEMPLATE_TYPE_OPTIONS } from '../../../../lib/default-templates'
import { renderTemplate, SAMPLE_PREVIEW_DATA } from '../../../../lib/template-preview'

interface EmailTemplateWithId extends EmailTemplate {
  id: string
  created_at: string
  updated_at: string
}

type EditorMode = 'create' | 'edit' | 'preview' | null

export function EmailTemplateManagement() {
  // State
  const [templates, setTemplates] = useState<EmailTemplateWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateWithId | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  /**
   * Fetches all templates from the API
   */
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/email-templates')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch templates')
      }

      setTemplates(result.data)
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handles creating a new template
   */
  const handleCreate = async (templateData: Partial<EmailTemplate>) => {
    try {
      setIsSaving(true)

      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create template')
      }

      // Refresh templates list
      await fetchTemplates()

      // Close editor
      setEditorMode(null)
      setSelectedTemplate(null)
    } catch (err) {
      console.error('Error creating template:', err)
      alert(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handles updating an existing template
   */
  const handleUpdate = async (templateData: Partial<EmailTemplate>) => {
    if (!selectedTemplate) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/email-templates/${selectedTemplate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update template')
      }

      // Refresh templates list
      await fetchTemplates()

      // Close editor
      setEditorMode(null)
      setSelectedTemplate(null)
    } catch (err) {
      console.error('Error updating template:', err)
      alert(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Handles deleting a template
   */
  const handleDelete = async (template: EmailTemplateWithId) => {
    if (!confirm(`Are you sure you want to delete this template? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/email-templates/${template.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete template')
      }

      // Refresh templates list
      await fetchTemplates()
    } catch (err) {
      console.error('Error deleting template:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  /**
   * Opens the editor for creating a new template
   */
  const openCreateEditor = () => {
    setSelectedTemplate(null)
    setEditorMode('create')
  }

  /**
   * Opens the editor for editing an existing template
   */
  const openEditEditor = (template: EmailTemplateWithId) => {
    setSelectedTemplate(template)
    setEditorMode('edit')
  }

  /**
   * Opens the preview dialog for a template
   */
  const openPreview = (template: EmailTemplateWithId) => {
    setSelectedTemplate(template)
    setEditorMode('preview')
  }

  /**
   * Closes the editor/preview dialog
   */
  const closeDialog = () => {
    setEditorMode(null)
    setSelectedTemplate(null)
  }

  /**
   * Gets the label for a template type
   */
  const getTemplateTypeLabel = (type: string) => {
    const option = TEMPLATE_TYPE_OPTIONS.find((opt) => opt.value === type)
    return option?.label || type
  }

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  return (
    <>
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {templates.length} template{templates.length !== 1 ? 's' : ''} configured
        </p>
        <Button onClick={openCreateEditor}>Create New Template</Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTemplates} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No email templates configured yet. Create your first template to get started.
            </p>
            <Button onClick={openCreateEditor}>Create Your First Template</Button>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {!loading && !error && templates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {getTemplateTypeLabel(template.template_type)}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
                  </div>
                  <Badge variant="secondary">{template.template_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openPreview(template)}>
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditEditor(template)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Last updated: {new Date(template.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={editorMode === 'create' || editorMode === 'edit'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editorMode === 'create' ? 'Create Email Template' : 'Edit Email Template'}
            </DialogTitle>
            <DialogDescription>
              {editorMode === 'create'
                ? 'Create a new email template for automated notifications. Use variable placeholders to personalize the content.'
                : 'Update the email template. Changes will apply to future notifications.'}
            </DialogDescription>
          </DialogHeader>
          <EmailTemplateEditor
            template={selectedTemplate || undefined}
            onSave={editorMode === 'create' ? handleCreate : handleUpdate}
            onCancel={closeDialog}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={editorMode === 'preview'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of how this email template will appear with sample data
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-semibold">
                  {getTemplateTypeLabel(selectedTemplate.template_type)}
                </p>
                <Badge variant="secondary" className="mt-1">
                  {selectedTemplate.template_type}
                </Badge>
              </div>

              {/* Subject Preview */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Subject:</p>
                <p className="text-base font-medium">
                  {renderTemplate(selectedTemplate.subject, SAMPLE_PREVIEW_DATA)}
                </p>
              </div>

              {/* Body Preview */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Body:</p>
                <div
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{
                    __html: renderTemplate(selectedTemplate.body_html, SAMPLE_PREVIEW_DATA),
                  }}
                />
              </div>

              {/* Sample Data Info */}
              <p className="text-xs text-muted-foreground">
                This preview uses sample data: {SAMPLE_PREVIEW_DATA.student_name},{' '}
                {SAMPLE_PREVIEW_DATA.college_name}, {SAMPLE_PREVIEW_DATA.amount}, etc.
              </p>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={closeDialog}>
                  Close
                </Button>
                <Button onClick={() => openEditEditor(selectedTemplate)}>Edit Template</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
