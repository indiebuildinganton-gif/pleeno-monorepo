# Development Scripts

This directory contains utility scripts for development and debugging.

## Development Logging System

### Overview

The development logging system provides comprehensive logging and debugging capabilities for the `pnpm dev` process. It captures all output, errors, and environment information to help diagnose issues quickly.

### Scripts

#### 1. `dev-with-logging.sh`

Runs the development server with comprehensive logging.

**Usage:**

```bash
npm run dev:log
```

**Features:**

- Captures all console output to timestamped log files
- Separate error log for quick error diagnosis
- Pre-flight checks for common issues
- Environment information logging
- Color-coded console output
- Real-time output streaming

**Log Files Location:**

- Full logs: `logs/dev/dev_YYYYMMDD_HHMMSS.log`
- Error logs: `logs/dev/dev_errors_YYYYMMDD_HHMMSS.log`

**What it logs:**

- Node, npm, and pnpm versions
- Git branch and status
- Workspace packages status
- node_modules existence checks for all apps/packages
- TypeScript and Turbo configuration
- All dev server output
- Separate error tracking

#### 2. `view-dev-logs.sh`

Interactive log viewer with multiple viewing options.

**Usage:**

```bash
npm run dev:view-logs
```

**Features:**

1. **View latest full log** - Opens the most recent complete log
2. **View latest errors only** - Shows only error messages
3. **List all log files** - Displays all available logs with sizes
4. **View specific log file** - Choose a specific log from the list
5. **Search logs for pattern** - Search across all logs for specific text
6. **View logs in real-time** - Tail the latest log file
7. **Clear old logs** - Remove old logs (keeps latest 5)

### Quick Start

1. **Start dev server with logging:**

   ```bash
   npm run dev:log
   ```

2. **In another terminal, view logs:**

   ```bash
   npm run dev:view-logs
   ```

3. **Or tail logs in real-time:**
   ```bash
   tail -f logs/dev/dev_*.log | tail -1
   ```

### Common Use Cases

#### Debugging Module Resolution Errors

1. Run dev with logging: `npm run dev:log`
2. Wait for the error to occur
3. In another terminal: `npm run dev:view-logs`
4. Choose option 2 to view errors only
5. Search for specific module names or error patterns

#### Tracking Build Performance

The logs include timestamps for all operations, making it easy to identify slow build steps:

```bash
npm run dev:view-logs
# Choose option 5 (search)
# Search for: "Compiled"
```

#### Checking Environment Issues

The pre-flight checks log critical environment information:

- Missing node_modules
- Missing TypeScript configs
- Workspace package status

### Log File Format

Each log entry includes:

```
[YYYY-MM-DD HH:MM:SS] MESSAGE
```

Error entries are duplicated to the error log for quick access.

### Maintenance

Logs are stored in `logs/dev/` and can grow over time. Use the log viewer's "Clear old logs" option to maintain only recent logs.

**Manual cleanup:**

```bash
rm -rf logs/dev/*
```

### Tips

- Use `npm run dev:log` when you encounter errors
- Keep the log viewer open in a separate terminal
- Use the search function to find specific errors quickly
- The error-only log is perfect for CI/CD integration
- Logs are git-ignored by default

## Troubleshooting

### Script Permission Denied

If you get permission errors:

```bash
chmod +x scripts/dev-with-logging.sh
chmod +x scripts/view-dev-logs.sh
```

### pnpm Not Found

The script automatically configures the pnpm path. If it still fails, ensure pnpm is installed:

```bash
npm install -g pnpm
```

### No Logs Generated

1. Check if the `logs/dev` directory was created
2. Verify the script ran successfully
3. Check terminal output for errors
