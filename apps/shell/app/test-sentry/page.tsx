'use client'

import { captureException, captureMessage } from '@pleeno/utils'

export default function TestSentryPage() {
  const throwError = () => {
    throw new Error('Test Sentry Error - Unhandled')
  }

  const captureTestError = () => {
    try {
      throw new Error('Test Sentry Error - Manually Captured')
    } catch (error) {
      captureException(error as Error, {
        testContext: 'manual capture',
        timestamp: new Date().toISOString(),
      })
      alert('Error captured and sent to Sentry!')
    }
  }

  const captureTestMessage = () => {
    captureMessage('Test Sentry Message', 'info', {
      testContext: 'message capture',
      timestamp: new Date().toISOString(),
    })
    alert('Message captured and sent to Sentry!')
  }

  const captureWarning = () => {
    captureMessage('Test Warning Message', 'warning', {
      testContext: 'warning capture',
      timestamp: new Date().toISOString(),
    })
    alert('Warning captured and sent to Sentry!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Test Sentry Integration</h1>
          <p className="mb-6 text-gray-600">
            Use these buttons to test Sentry error tracking and monitoring. Check your Sentry
            dashboard to see if events are being captured.
          </p>

          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h2 className="mb-2 font-semibold text-red-900">Unhandled Error</h2>
              <p className="mb-3 text-sm text-red-700">
                Throws an error that will be caught by the Error Boundary
              </p>
              <button
                onClick={throwError}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Throw Unhandled Error
              </button>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h2 className="mb-2 font-semibold text-orange-900">Manually Captured Error</h2>
              <p className="mb-3 text-sm text-orange-700">
                Captures an error manually and sends it to Sentry
              </p>
              <button
                onClick={captureTestError}
                className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white transition hover:bg-orange-700"
              >
                Capture Exception Manually
              </button>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h2 className="mb-2 font-semibold text-yellow-900">Warning Message</h2>
              <p className="mb-3 text-sm text-yellow-700">Sends a warning message to Sentry</p>
              <button
                onClick={captureWarning}
                className="rounded-lg bg-yellow-600 px-4 py-2 font-semibold text-white transition hover:bg-yellow-700"
              >
                Capture Warning
              </button>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h2 className="mb-2 font-semibold text-blue-900">Info Message</h2>
              <p className="mb-3 text-sm text-blue-700">Sends an informational message to Sentry</p>
              <button
                onClick={captureTestMessage}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Capture Message
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Notes:</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li>Sentry is disabled in development by default</li>
              <li>Set NODE_ENV=production to test in production mode</li>
              <li>Configure NEXT_PUBLIC_SENTRY_DSN in your environment</li>
              <li>Check the Sentry dashboard after triggering events</li>
            </ul>
          </div>

          <div className="mt-6">
            <a href="/" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
