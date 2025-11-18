/**
 * Network Activity Logs API Endpoint
 *
 * Handles saving network activity logs to the file system.
 * POST /api/network-logs - Save logs to server
 */

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join, resolve } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logs, format = 'json' } = body

    if (!logs) {
      return NextResponse.json({ error: 'No logs provided' }, { status: 400 })
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `network-logs-${timestamp}.${format}`

    // Determine project root - process.cwd() returns the workspace root in turbo/pnpm monorepos
    const cwd = process.cwd()
    let logsDir: string

    // Check if we're in a workspace subdirectory
    if (cwd.includes('/apps/dashboard')) {
      // We're in apps/dashboard, go up to project root
      logsDir = resolve(cwd, '../../logs/network-activity')
    } else {
      // We're already at project root
      logsDir = join(cwd, 'logs', 'network-activity')
    }

    const filePath = join(logsDir, filename)

    // Debug logging
    console.log('[Network Logs API] CWD:', cwd)
    console.log('[Network Logs API] Logs Directory:', logsDir)
    console.log('[Network Logs API] File Path:', filePath)

    // Ensure directory exists
    await mkdir(logsDir, { recursive: true })

    // Convert logs to appropriate format
    let content: string

    if (format === 'csv') {
      content = convertToCSV(logs)
    } else {
      content = JSON.stringify(logs, null, 2)
    }

    // Write file to disk
    await writeFile(filePath, content, 'utf-8')

    console.log('[Network Logs API] Successfully saved:', filename)

    return NextResponse.json({
      success: true,
      filename,
      path: filePath,
      logsCount: Array.isArray(logs) ? logs.length : 0,
    })
  } catch (error) {
    console.error('[Network Logs API] Error saving network logs:', error)
    console.error('[Network Logs API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to save logs',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

function convertToCSV(logs: any[]): string {
  if (!Array.isArray(logs) || logs.length === 0) {
    return 'No logs to export'
  }

  // CSV headers
  const headers = [
    'Timestamp',
    'Method',
    'URL',
    'Status',
    'Status Text',
    'Duration (ms)',
    'Request Body',
    'Response Body',
    'Error',
  ]

  // CSV rows
  const rows = logs.map((log) => [
    log.timestamp || '',
    log.method || '',
    log.url || '',
    log.status?.toString() || '',
    log.statusText || '',
    log.duration?.toString() || '',
    JSON.stringify(log.requestBody || ''),
    JSON.stringify(log.responseBody || ''),
    log.error || '',
  ])

  // Escape CSV values
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  // Build CSV
  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n')

  return csv
}
