'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@pleeno/database/client'
import { Button } from '@pleeno/ui/src/components/ui/button'
import { Input } from '@pleeno/ui/src/components/ui/input'
import { Label } from '@pleeno/ui/src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pleeno/ui/src/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@pleeno/ui/src/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pleeno/ui/src/components/ui/card'
import { Badge } from '@pleeno/ui/src/components/ui/badge'
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  FileText,
  ChevronRight,
  Loader2,
  Mail,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import * as Papa from 'papaparse'

/**
 * CSV Import Wizard Page
 *
 * Multi-step wizard for importing students from CSV files.
 *
 * Epic 3: Entities Domain
 * Story 3.2: Student Registry
 * Task 13: CSV Import Wizard UI
 *
 * Features:
 * - Step 1: Upload CSV file with preview
 * - Step 2: Map CSV columns to student fields
 * - Step 3: Validate data before import
 * - Step 4: Import with progress tracking
 * - Step 5: Display completion summary
 *
 * Acceptance Criteria (AC 6):
 * - File upload with validation ✓
 * - Field mapping interface ✓
 * - Validation error display ✓
 * - Import progress tracking ✓
 * - Completion summary ✓
 * - Email notification confirmation ✓
 * - Error report download ✓
 */

type WizardStep = 'upload' | 'map' | 'validate' | 'import' | 'complete'

interface CsvRow {
  [key: string]: string
}

interface FieldMapping {
  csvColumn: string
  studentField: string
}

interface ValidationError {
  row: number
  data: CsvRow
  errors: string[]
}

interface ImportResult {
  total_rows: number
  successful: number
  failed: number
  errors: ValidationError[]
  incomplete_students: Array<{
    id: string
    full_name: string
    passport_number: string
    missing_fields: string[]
  }>
}

const STUDENT_FIELDS = [
  { value: 'full_name', label: 'Full Name', required: true },
  { value: 'passport_number', label: 'Passport Number', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'date_of_birth', label: 'Date of Birth', required: false },
  { value: 'nationality', label: 'Nationality', required: false },
  { value: 'visa_status', label: 'Visa Status', required: false },
]

export default function StudentImportPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setIsLoadingAuth(false)
    }

    checkAuth()
  }, [router])

  // Step 1: Upload CSV - Process file helper
  const processFile = useCallback((file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setCsvFile(file)

    // Parse CSV
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        setCsvHeaders(headers)
        setCsvData(results.data)

        // Auto-map fields based on header names
        const autoMappings: Record<string, string> = {}
        headers.forEach((header) => {
          const normalizedHeader = header.toLowerCase().trim().replace(/\s+/g, '_')
          const matchingField = STUDENT_FIELDS.find(
            (field) => field.value === normalizedHeader
          )
          if (matchingField) {
            autoMappings[header] = matchingField.value
          }
        })
        setFieldMappings(autoMappings)
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        alert('Failed to parse CSV file. Please check the file format.')
      },
    })
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    processFile(file)
  }, [processFile])

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleUploadNext = () => {
    if (!csvFile || csvData.length === 0) {
      alert('Please upload a valid CSV file')
      return
    }
    setCurrentStep('map')
  }

  // Step 2: Map Fields
  const handleMappingChange = (csvColumn: string, studentField: string) => {
    setFieldMappings((prev) => {
      const newMappings = { ...prev }
      // If "skip" is selected, remove the mapping entirely
      if (studentField === '__skip__') {
        delete newMappings[csvColumn]
      } else {
        newMappings[csvColumn] = studentField
      }
      return newMappings
    })
  }

  const handleMapNext = () => {
    // Validate required fields are mapped
    const requiredFields = STUDENT_FIELDS.filter((f) => f.required)
    const mappedFields = Object.values(fieldMappings)

    const missingRequired = requiredFields.filter(
      (field) => !mappedFields.includes(field.value)
    )

    if (missingRequired.length > 0) {
      alert(
        `Please map the following required fields: ${missingRequired
          .map((f) => f.label)
          .join(', ')}`
      )
      return
    }

    // Proceed to validation
    validateData()
    setCurrentStep('validate')
  }

  // Step 3: Validate
  const validateData = () => {
    const errors: ValidationError[] = []

    csvData.forEach((row, index) => {
      const rowErrors: string[] = []

      // Create mapped data object
      const mappedData: Record<string, string> = {}
      Object.entries(fieldMappings).forEach(([csvCol, studentField]) => {
        mappedData[studentField] = row[csvCol] || ''
      })

      // Validate required fields
      if (!mappedData.full_name?.trim()) {
        rowErrors.push('Full Name is required')
      }
      if (!mappedData.passport_number?.trim()) {
        rowErrors.push('Passport Number is required')
      }

      // Validate email format if provided
      if (mappedData.email && mappedData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(mappedData.email)) {
          rowErrors.push('Invalid email format')
        }
      }

      // Validate date format if provided
      if (mappedData.date_of_birth && mappedData.date_of_birth.trim()) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(mappedData.date_of_birth)) {
          rowErrors.push('Date of Birth must be in YYYY-MM-DD format')
        }
      }

      // Validate visa status if provided
      if (mappedData.visa_status && mappedData.visa_status.trim()) {
        const validStatuses = ['in_process', 'approved', 'denied', 'expired']
        if (!validStatuses.includes(mappedData.visa_status.toLowerCase())) {
          rowErrors.push(
            'Visa Status must be one of: in_process, approved, denied, expired'
          )
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: index + 1,
          data: row,
          errors: rowErrors,
        })
      }
    })

    setValidationErrors(errors)
  }

  const handleValidateNext = () => {
    setCurrentStep('import')
    performImport()
  }

  // Step 4: Import
  const performImport = async () => {
    if (!csvFile) return

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Create FormData with the original CSV file
      const formData = new FormData()
      formData.append('file', csvFile)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Import failed')
      }

      const result = await response.json()
      setImportResult(result.data)
      setCurrentStep('complete')
    } catch (error) {
      console.error('Import error:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to import students. Please try again.'
      )
    } finally {
      setIsImporting(false)
    }
  }

  // Step 5: Complete
  const handleDownloadErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) return

    // Generate CSV error report
    const errorRows = importResult.errors.map((error) => ({
      Row: error.row,
      Errors: error.errors.join('; '),
      ...error.data,
    }))

    const csv = Papa.unparse(errorRows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleReset = () => {
    setCsvFile(null)
    setCsvData([])
    setCsvHeaders([])
    setFieldMappings({})
    setValidationErrors([])
    setImportResult(null)
    setImportProgress(0)
    setCurrentStep('upload')
  }

  // Show loading state while checking auth
  if (isLoadingAuth) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/students')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Import Students from CSV</h1>
        <p className="text-muted-foreground mt-1">
          Bulk import student records with field mapping and validation
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[
          { key: 'upload', label: 'Upload', icon: Upload },
          { key: 'map', label: 'Map Fields', icon: FileText },
          { key: 'validate', label: 'Validate', icon: AlertCircle },
          { key: 'import', label: 'Import', icon: Loader2 },
          { key: 'complete', label: 'Complete', icon: CheckCircle2 },
        ].map((step, index, array) => {
          const Icon = step.icon
          const isActive = currentStep === step.key
          const isPast =
            array.findIndex((s) => s.key === currentStep) >
            array.findIndex((s) => s.key === step.key)
          const isCompleted = isPast || (step.key === 'complete' && currentStep === 'complete')

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-sm mt-2 ${
                    isActive ? 'font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < array.length - 1 && (
                <ChevronRight className="h-5 w-5 text-muted-foreground mx-2" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Upload CSV */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing student data or drag and drop. File must be less than 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">or</p>
                </div>
                <Label
                  htmlFor="csv-file"
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Choose File
                </Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>

            {csvFile && csvData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    Loaded {csvData.length} rows from {csvFile.name}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Preview (First 5 Rows)</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {csvHeaders.map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {csvHeaders.map((header) => (
                                <TableCell key={header}>{row[header]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUploadNext}>
                    Next: Map Fields
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Map Fields */}
      {currentStep === 'map' && (
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle>Map CSV Columns to Student Fields</CardTitle>
              <CardDescription>
                Match your CSV columns to the corresponding student fields. Required fields
                are marked with *.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-700 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Required fields:</strong> Full Name and Passport Number must be
              mapped to proceed.
            </div>
          </div>

          {/* Side-by-side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Left: CSV Columns Mapping */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your CSV Columns</CardTitle>
                <CardDescription>
                  Click on each field to map it to a student field
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {csvHeaders.map((header) => {
                  const mappedField = fieldMappings[header]
                  const fieldInfo = STUDENT_FIELDS.find((f) => f.value === mappedField)

                  return (
                    <div
                      key={header}
                      className="p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{header}</span>
                            {mappedField && mappedField !== '__skip__' && (
                              <Badge variant="secondary" className="text-xs">
                                → {fieldInfo?.label}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Preview: {csvData[0]?.[header] || '—'}
                          </div>
                        </div>
                        <Select
                          value={fieldMappings[header] || '__skip__'}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            className="z-50 !bg-white dark:!bg-slate-900 !text-gray-900 dark:!text-gray-100 border shadow-lg"
                            sideOffset={5}
                          >
                            <SelectItem
                              value="__skip__"
                              className="cursor-pointer !text-gray-700 dark:!text-gray-200 hover:!bg-gray-100 dark:hover:!bg-slate-800 focus:!bg-blue-100 dark:focus:!bg-blue-900 focus:!text-blue-900 dark:focus:!text-blue-100"
                            >
                              Skip Column
                            </SelectItem>
                            {STUDENT_FIELDS.map((field) => (
                              <SelectItem
                                key={field.value}
                                value={field.value}
                                className="cursor-pointer !text-gray-700 dark:!text-gray-200 hover:!bg-gray-100 dark:hover:!bg-slate-800 focus:!bg-blue-100 dark:focus:!bg-blue-900 focus:!text-blue-900 dark:focus:!text-blue-100"
                              >
                                {field.label}
                                {field.required && ' *'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Right: Available Student Fields Reference */}
            <Card className="h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Available Fields</CardTitle>
                <CardDescription>Student database fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {STUDENT_FIELDS.map((field) => {
                    const isMapped = Object.values(fieldMappings).includes(field.value)
                    return (
                      <div
                        key={field.value}
                        className={`p-3 border rounded-lg transition-colors ${
                          isMapped
                            ? 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-800'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                              {field.label}
                              {field.required && (
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {field.value}
                            </div>
                          </div>
                          {isMapped && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleMapNext}>
                  Next: Validate Data
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Validate */}
      {currentStep === 'validate' && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Review validation results before importing. Rows with errors will be skipped.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border-2 border-green-300 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {csvData.length - validationErrors.length}
                </div>
                <div className="text-sm text-green-800 dark:text-green-300">Valid Rows</div>
              </div>
              <div className="p-4 border-2 border-red-300 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {validationErrors.length}
                </div>
                <div className="text-sm text-red-800 dark:text-red-300">Rows with Errors</div>
              </div>
              <div className="p-4 border-2 border-blue-300 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{csvData.length}</div>
                <div className="text-sm text-blue-800 dark:text-blue-300">Total Rows</div>
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Errors by Row</h3>
                <div className="border rounded-lg max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Errors</TableHead>
                        <TableHead>Data Preview</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationErrors.map((error) => (
                        <TableRow key={error.row}>
                          <TableCell className="font-medium">Row {error.row}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {error.errors.map((err, idx) => (
                                <Badge key={idx} variant="destructive" className="mr-1">
                                  {err}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {Object.entries(error.data)
                              .slice(0, 2)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {validationErrors.length === 0 && (
              <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-950 border-2 border-green-300 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="text-sm text-green-900 dark:text-green-200">
                  All rows passed validation! Ready to import.
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('map')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleValidateNext}
                disabled={csvData.length - validationErrors.length === 0}
              >
                {validationErrors.length > 0 ? 'Import Valid Rows' : 'Start Import'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Import */}
      {currentStep === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Students</CardTitle>
            <CardDescription>
              Please wait while we import your student records...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-out"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {isImporting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Importing... {importProgress}%</span>
                  </div>
                ) : (
                  <span>Complete!</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Complete */}
      {currentStep === 'complete' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your student import has been completed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border-2 border-green-300 dark:border-green-800 rounded-lg bg-green-100 dark:bg-green-950">
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {importResult.successful}
                </div>
                <div className="text-sm text-green-900 dark:text-green-200 font-medium">Successfully Imported</div>
              </div>
              <div className="p-4 border-2 border-red-300 dark:border-red-800 rounded-lg bg-red-100 dark:bg-red-950">
                <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {importResult.failed}
                </div>
                <div className="text-sm text-red-900 dark:text-red-200 font-medium">Failed</div>
              </div>
              <div className="p-4 border-2 border-blue-300 dark:border-blue-800 rounded-lg bg-blue-100 dark:bg-blue-950">
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{importResult.total_rows}</div>
                <div className="text-sm text-blue-900 dark:text-blue-200 font-medium">Total Rows</div>
              </div>
            </div>

            {/* Email Notification Confirmation */}
            {importResult.incomplete_students.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-purple-100 dark:bg-purple-950 border-2 border-purple-300 dark:border-purple-800 rounded-lg">
                <Mail className="h-5 w-5 text-purple-700 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-200">
                    Email Notification Sent
                  </h4>
                  <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                    An email has been sent to your admin email with a list of{' '}
                    {importResult.incomplete_students.length} incomplete student record(s)
                    that need additional information (phone or email).
                  </p>
                </div>
              </div>
            )}

            {/* Incomplete Records */}
            {importResult.incomplete_students.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Incomplete Records ({importResult.incomplete_students.length})
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  The following students are missing contact information:
                </p>
                <div className="border-2 border-amber-300 dark:border-amber-800 rounded-lg max-h-64 overflow-y-auto bg-amber-50 dark:bg-amber-950/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                        <TableHead className="text-amber-900 dark:text-amber-200 font-semibold">Name</TableHead>
                        <TableHead className="text-amber-900 dark:text-amber-200 font-semibold">Passport</TableHead>
                        <TableHead className="text-amber-900 dark:text-amber-200 font-semibold">Missing Fields</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.incomplete_students.map((student) => (
                        <TableRow key={student.id} className="border-amber-200 dark:border-amber-800">
                          <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                            {student.full_name}
                          </TableCell>
                          <TableCell className="text-gray-800 dark:text-gray-200">{student.passport_number}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {student.missing_fields.map((field) => (
                                <Badge key={field} variant="outline" className="border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Error Report */}
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Failed Rows ({importResult.errors.length})
                </h3>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.slice(0, 10).map((error) => (
                        <TableRow key={error.row}>
                          <TableCell className="font-medium">Row {error.row}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {error.errors.map((err, idx) => (
                                <div key={idx} className="text-sm text-red-600">
                                  • {err}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importResult.errors.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {importResult.errors.length} errors. Download the full
                    error report below.
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <div className="space-x-2">
                {importResult.errors.length > 0 && (
                  <Button variant="outline" onClick={handleDownloadErrorReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  Import Another File
                </Button>
                <Button onClick={() => router.push('/students')}>
                  View All Students
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
