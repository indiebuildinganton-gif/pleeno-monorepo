/**
 * Network Activity Logger
 *
 * Provides utilities to intercept, log, and export all network activity
 * including API requests and responses for debugging and monitoring purposes.
 */

export interface NetworkLog {
  id: string
  timestamp: string
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody?: unknown
  status?: number
  statusText?: string
  responseHeaders?: Record<string, string>
  responseBody?: unknown
  duration?: number
  error?: string
}

class NetworkActivityLogger {
  private logs: NetworkLog[] = []
  private maxLogs = 1000
  private isEnabled = true
  private originalFetch: typeof fetch

  constructor() {
    this.originalFetch = window.fetch.bind(window)
    this.setupInterceptor()
  }

  private setupInterceptor() {
    const originalFetch = this.originalFetch

    // Override the global fetch function
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      if (!this.isEnabled) {
        return originalFetch(...args)
      }

      const [resource, config] = args
      const url = typeof resource === 'string' ? resource : resource.url
      const method = config?.method || 'GET'
      const startTime = Date.now()

      // Create log entry
      const logEntry: NetworkLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        method,
        url,
        requestHeaders: this.extractHeaders(config?.headers),
        requestBody: config?.body ? this.parseBody(config.body) : undefined,
      }

      try {
        // Make the actual request
        const response = await originalFetch(...args)
        const endTime = Date.now()

        // Clone the response so we can read it
        const responseClone = response.clone()

        // Extract response data
        logEntry.status = response.status
        logEntry.statusText = response.statusText
        logEntry.responseHeaders = this.extractResponseHeaders(response.headers)
        logEntry.duration = endTime - startTime

        // Try to parse response body
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            logEntry.responseBody = await responseClone.json()
          } else if (contentType?.includes('text/')) {
            logEntry.responseBody = await responseClone.text()
          }
        } catch {
          logEntry.responseBody = '[Unable to parse response]'
        }

        // Add to logs
        this.addLog(logEntry)

        return response
      } catch (error) {
        const endTime = Date.now()
        logEntry.duration = endTime - startTime
        logEntry.error = error instanceof Error ? error.message : String(error)
        this.addLog(logEntry)
        throw error
      }
    }
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {}

    if (!headers) return result

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value
      })
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value
      })
    } else {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = value
      })
    }

    return result
  }

  private extractResponseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  private parseBody(body: BodyInit): unknown {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body)
      } catch {
        return body
      }
    }
    if (body instanceof FormData) {
      const formDataObj: Record<string, unknown> = {}
      body.forEach((value, key) => {
        formDataObj[key] = value
      })
      return formDataObj
    }
    if (body instanceof URLSearchParams) {
      return Object.fromEntries(body.entries())
    }
    return '[Binary or complex body data]'
  }

  private addLog(log: NetworkLog) {
    this.logs.unshift(log)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Optionally save to localStorage for persistence
    this.saveToLocalStorage()
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('network-logs', JSON.stringify(this.logs.slice(0, 100)))
    } catch (e) {
      // localStorage might be full or unavailable
      console.warn('Failed to save network logs to localStorage:', e)
    }
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('network-logs')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          this.logs = parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load network logs from localStorage:', e)
    }
  }

  // Public API
  public getLogs(): NetworkLog[] {
    return [...this.logs]
  }

  public clearLogs() {
    this.logs = []
    localStorage.removeItem('network-logs')
  }

  public exportAsJSON(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  public exportAsCSV(): string {
    if (this.logs.length === 0) {
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
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.method,
      log.url,
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

  public downloadJSON(filename = 'network-logs.json') {
    const json = this.exportAsJSON()
    this.downloadFile(json, filename, 'application/json')
  }

  public downloadCSV(filename = 'network-logs.csv') {
    const csv = this.exportAsCSV()
    this.downloadFile(csv, filename, 'text/csv')
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  public enable() {
    this.isEnabled = true
  }

  public disable() {
    this.isEnabled = false
  }

  public isLoggingEnabled(): boolean {
    return this.isEnabled
  }

  public getStats() {
    const totalRequests = this.logs.length
    const successfulRequests = this.logs.filter((log) => log.status && log.status < 400).length
    const failedRequests = this.logs.filter(
      (log) => (log.status && log.status >= 400) || log.error
    ).length
    const averageDuration =
      this.logs.reduce((sum, log) => sum + (log.duration || 0), 0) / (totalRequests || 1)

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageDuration: Math.round(averageDuration),
    }
  }
}

// Singleton instance
let networkLogger: NetworkActivityLogger | null = null

export function initNetworkLogger() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!networkLogger) {
    networkLogger = new NetworkActivityLogger()
  }

  return networkLogger
}

export function getNetworkLogger() {
  return networkLogger
}
