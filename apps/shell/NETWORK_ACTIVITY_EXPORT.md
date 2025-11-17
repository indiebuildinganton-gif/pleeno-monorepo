# Network Activity Export Feature

## Overview

The Network Activity Export feature provides comprehensive monitoring and logging of all network API calls made within the application. It captures both requests and responses, allowing developers and QA teams to debug, analyze, and export network activity for troubleshooting purposes.

## Features

- **Automatic Request/Response Capture**: Intercepts all `fetch()` calls automatically
- **Detailed Logging**: Captures method, URL, headers, body, status codes, response data, and timing information
- **Real-time Monitoring**: View network activity as it happens
- **Export Capabilities**: Export logs in JSON or CSV format
- **Performance Metrics**: View statistics like success rate, average duration, and request counts
- **Error Tracking**: Captures and displays failed requests with error details
- **Persistent Storage**: Logs are saved to localStorage for persistence across sessions
- **Enable/Disable Toggle**: Control when logging is active

## How to Use

### Accessing the Network Activity Panel

1. Look for the **Activity icon** (📊) in the application header (top-right corner, next to the notification bell)
2. Click the icon to open the Network Activity Monitor panel
3. The badge on the icon shows the number of captured requests

### Viewing Network Activity

The panel is divided into two sections:

#### Left Panel - Request List
- Shows all captured network requests
- Each entry displays:
  - HTTP method (GET, POST, PUT, PATCH, DELETE)
  - Status code with color coding:
    - Green (2xx) - Success
    - Blue (3xx) - Redirects
    - Orange (4xx) - Client errors
    - Red (5xx) - Server errors
  - Request URL
  - Response time in milliseconds
  - Timestamp
  - Error message (if request failed)
- Click any request to view detailed information

#### Right Panel - Request Details
When you select a request, this panel shows:
- **General Information**: Method, status, duration, timestamp
- **Full URL**: Complete request URL
- **Request Headers**: All headers sent with the request
- **Request Body**: Payload sent (formatted JSON)
- **Response Headers**: All headers received in the response
- **Response Body**: Response data (formatted JSON or text)
- **Error Details**: If the request failed, detailed error information

### Statistics Bar

At the top of the panel, you'll see real-time statistics:
- **Total**: Total number of requests captured
- **Success**: Number of successful requests (status 2xx)
- **Failed**: Number of failed requests (status 4xx/5xx or network errors)
- **Avg**: Average response time in milliseconds

### Exporting Network Activity

The panel provides several export options:

#### Export as JSON
1. Click the **JSON** button in the header
2. A file named `network-logs-[timestamp].json` will be downloaded
3. The JSON file contains all request/response details in a structured format
4. Useful for programmatic analysis or sharing with developers

#### Export as CSV
1. Click the **CSV** button in the header
2. A file named `network-logs-[timestamp].csv` will be downloaded
3. The CSV includes columns for timestamp, method, URL, status, duration, request/response bodies
4. Useful for spreadsheet analysis or reporting

### Managing Logs

#### Pause/Resume Logging
- Click the **Logging/Paused** button to toggle network capture
- When paused, new requests won't be captured (existing logs remain visible)
- Use this to reduce overhead or focus on specific operations

#### Clear All Logs
- Click the **Clear** button to remove all captured requests
- This also clears logs from localStorage
- Use this to start fresh or reduce memory usage

### Keyboard Shortcuts

- **ESC**: Close the Network Activity panel (when open)

## Technical Details

### What Gets Captured

The logger captures the following information for each request:

```typescript
{
  id: string,                          // Unique identifier
  timestamp: string,                   // ISO timestamp
  method: string,                      // HTTP method
  url: string,                         // Full request URL
  requestHeaders: object,              // Request headers
  requestBody: any,                    // Request payload (parsed)
  status: number,                      // Response status code
  statusText: string,                  // Response status text
  responseHeaders: object,             // Response headers
  responseBody: any,                   // Response data (parsed)
  duration: number,                    // Request duration in ms
  error: string                        // Error message (if failed)
}
```

### Storage Limits

- **In-Memory**: Up to 1,000 most recent requests
- **localStorage**: Up to 100 most recent requests (for persistence)
- Older logs are automatically removed when limits are reached

### Performance Considerations

- The interceptor adds minimal overhead (<5ms per request)
- Logging can be disabled to eliminate overhead entirely
- Response body parsing is done asynchronously to avoid blocking
- Large responses (>1MB) may be truncated or marked as "[Unable to parse]"

## Use Cases

### Debugging API Issues
1. Enable logging before reproducing an issue
2. Perform the action that causes the problem
3. Review the captured requests to identify:
   - Which API call failed
   - What data was sent
   - What error was returned
4. Export logs to share with backend team

### Performance Analysis
1. Monitor the statistics panel while using the app
2. Identify slow API calls (high duration)
3. Export CSV for detailed timing analysis
4. Optimize calls with consistently high response times

### QA Testing
1. Capture network activity during test scenarios
2. Export logs as evidence of API behavior
3. Verify correct data is being sent/received
4. Document API errors for bug reports

### Development Monitoring
1. Keep the panel open during development
2. Monitor API calls as you build features
3. Verify request/response formats match expectations
4. Catch unexpected API calls early

## Security Notes

- Network logs may contain sensitive data (auth tokens, personal information)
- **Do not share exported logs** without reviewing their contents
- Clear logs before switching users or accounts
- Logs are stored only in browser localStorage (not sent to any server)
- Consider disabling logging in production environments

## Browser Compatibility

The feature works in all modern browsers that support:
- `fetch()` API
- `crypto.randomUUID()`
- localStorage
- ES2017+ JavaScript features

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Panel Not Opening
- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page

### Requests Not Being Captured
- Check if logging is enabled (green "Logging" button)
- Verify requests are using `fetch()` (not XMLHttpRequest)
- Check browser console for interceptor initialization errors

### Export Not Working
- Verify browser allows file downloads
- Check if pop-up blocker is interfering
- Try a different export format (JSON vs CSV)

### Performance Issues
- Clear old logs (use "Clear" button)
- Disable logging when not needed
- Reduce the number of concurrent requests in your app

## Implementation Files

- `apps/shell/lib/network-logger.ts` - Core logging and export logic
- `apps/shell/app/components/NetworkActivityPanel.tsx` - UI component
- `apps/shell/app/components/Providers.tsx` - Logger initialization
- `apps/shell/app/components/Header.tsx` - UI integration

## Future Enhancements

Potential features for future versions:
- Filter logs by URL pattern, method, or status
- Search functionality
- Export selected requests only
- Request replay functionality
- Compare requests side-by-side
- Auto-export on errors
- Integration with error tracking services
- HAR format export for browser DevTools import
