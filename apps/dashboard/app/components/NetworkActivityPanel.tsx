/**
 * Network Activity Panel Component
 *
 * Displays all captured network activity with the ability to view details,
 * filter logs, and export them in JSON or CSV format.
 */

'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, Eye, EyeOff, Activity, X, Save, CheckCircle } from 'lucide-react'
import { getNetworkLogger, type NetworkLog } from '@/lib/network-logger'

export function NetworkActivityPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<NetworkLog[]>([])
  const [selectedLog, setSelectedLog] = useState<NetworkLog | null>(null)
  const [stats, setStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageDuration: 0,
  })
  const [isEnabled, setIsEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // Refresh logs periodically
  useEffect(() => {
    const refreshLogs = () => {
      const logger = getNetworkLogger()
      if (logger) {
        setLogs(logger.getLogs())
        setStats(logger.getStats())
        setIsEnabled(logger.isLoggingEnabled())
      }
    }

    refreshLogs()
    const interval = setInterval(refreshLogs, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleExportJSON = () => {
    const logger = getNetworkLogger()
    if (logger) {
      logger.downloadJSON(`network-logs-${Date.now()}.json`)
    }
  }

  const handleExportCSV = () => {
    const logger = getNetworkLogger()
    if (logger) {
      logger.downloadCSV(`network-logs-${Date.now()}.csv`)
    }
  }

  const handleClear = () => {
    const logger = getNetworkLogger()
    if (logger) {
      logger.clearLogs()
      setLogs([])
      setSelectedLog(null)
    }
  }

  const handleToggleLogging = () => {
    const logger = getNetworkLogger()
    if (logger) {
      if (isEnabled) {
        logger.disable()
      } else {
        logger.enable()
      }
      setIsEnabled(!isEnabled)
    }
  }

  const handleSaveToServer = async (format: 'json' | 'csv') => {
    setIsSaving(true)
    setSaveSuccess(null)

    try {
      const response = await fetch('/api/network-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          format,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save logs to server')
      }

      const result = await response.json()
      setSaveSuccess(`Saved ${result.logsCount} logs to ${result.filename}`)

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSaveSuccess(null)
      }, 5000)
    } catch (error) {
      console.error('Error saving logs to server:', error)
      alert('Failed to save logs to server. Check console for details.')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-500'
    if (status >= 200 && status < 300) return 'text-green-600'
    if (status >= 300 && status < 400) return 'text-blue-600'
    if (status >= 400 && status < 500) return 'text-orange-600'
    return 'text-red-600'
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800'
      case 'POST':
        return 'bg-green-100 text-green-800'
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800'
      case 'PATCH':
        return 'bg-purple-100 text-purple-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) {
    const hasErrors = logs.some((log) => (log.status && log.status >= 400) || log.error)

    return (
      <div className="relative flex items-center gap-2">
        {/* Quick Export Button - Only show if there are errors */}
        {hasErrors && (
          <button
            onClick={() => handleSaveToServer('json')}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
            title="Quick save all errors to server"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Export Errors'}
          </button>
        )}

        {/* Activity Icon */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Network Activity"
          title="View Network Activity"
        >
          <Activity className={`h-5 w-5 ${hasErrors ? 'text-red-600' : 'text-gray-600'}`} />
          {logs.length > 0 && (
            <span
              className={`absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full min-w-[18px] ${
                hasErrors ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {logs.length > 99 ? '99+' : logs.length}
            </span>
          )}
        </button>

        {/* Success Message */}
        {saveSuccess && !isOpen && (
          <div className="absolute right-0 top-12 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap z-50">
            <CheckCircle className="h-4 w-4 inline mr-2" />
            {saveSuccess}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Network Activity Monitor</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {stats.totalRequests} total
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {stats.successfulRequests} success
              </span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                {stats.failedRequests} failed
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                {stats.averageDuration}ms avg
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                {saveSuccess}
              </div>
            )}
            <button
              onClick={handleToggleLogging}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEnabled
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              title={isEnabled ? 'Disable logging' : 'Enable logging'}
            >
              {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isEnabled ? 'Logging' : 'Paused'}
            </button>

            {/* Download to Browser Group */}
            <div className="flex items-center border-l border-gray-300 pl-2 gap-2">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                title="Download JSON to browser"
              >
                <Download className="h-4 w-4" />
                JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                title="Download CSV to browser"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>

            {/* Save to Server Group */}
            <div className="flex items-center border-l border-gray-300 pl-2 gap-2">
              <button
                onClick={() => handleSaveToServer('json')}
                disabled={isSaving || logs.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save JSON to server logs directory"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save JSON'}
              </button>
              <button
                onClick={() => handleSaveToServer('csv')}
                disabled={isSaving || logs.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save CSV to server logs directory"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save CSV'}
              </button>
            </div>

            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium ml-2"
              title="Clear all logs"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Logs List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Request Log</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No network activity recorded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedLog?.id === log.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(
                              log.method
                            )}`}
                          >
                            {log.method}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                            {log.status || (log.error ? 'ERROR' : 'PENDING')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {log.duration ? `${log.duration}ms` : '-'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 truncate font-mono">{log.url}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                      {log.error && (
                        <p className="text-xs text-red-600 mt-1 truncate">Error: {log.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Log Details */}
          <div className="w-1/2 flex flex-col">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Request Details</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">General</h3>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium">{selectedLog.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedLog.status)}`}>
                          {selectedLog.status || 'N/A'} {selectedLog.statusText}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{selectedLog.duration || '-'}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Timestamp:</span>
                        <span className="font-medium">
                          {new Date(selectedLog.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">URL</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-mono break-all">{selectedLog.url}</p>
                    </div>
                  </div>

                  {selectedLog.requestHeaders &&
                    Object.keys(selectedLog.requestHeaders).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Request Headers
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          {Object.entries(selectedLog.requestHeaders).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-gray-600">{key}:</span>{' '}
                              <span className="font-mono text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedLog.requestBody && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedLog.requestBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.responseHeaders &&
                    Object.keys(selectedLog.responseHeaders).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Response Headers
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                          {Object.entries(selectedLog.responseHeaders).map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-gray-600">{key}:</span>{' '}
                              <span className="font-mono text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedLog.responseBody && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Response Body</h3>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedLog.responseBody, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.error && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Error</h3>
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-sm text-red-900">{selectedLog.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Select a request to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
