# Quick Start - Development Logging

## TL;DR

**Start dev with logging:**

```bash
npm run dev:log
```

**View logs:**

```bash
npm run dev:view-logs
```

## Common Commands

### Start Development Server with Logging

```bash
npm run dev:log
```

Starts pnpm dev with comprehensive logging to `logs/dev/`

### View Logs Interactively

```bash
npm run dev:view-logs
```

Opens an interactive menu to:

- View latest logs
- Search for errors
- Tail logs in real-time
- Clean up old logs

### Quick Error Check

```bash
cat logs/dev/dev_errors_*.log | tail -50
```

View the latest 50 error lines

### Watch Logs in Real-time

```bash
tail -f logs/dev/dev_*.log
```

Follow the latest log file as it updates

## Log Locations

```
logs/
└── dev/
    ├── dev_20251115_143022.log         # Full log
    └── dev_errors_20251115_143022.log  # Errors only
```

## What's Logged?

✅ Environment info (Node, npm, pnpm versions)
✅ Git status and branch
✅ Workspace packages
✅ node_modules checks
✅ All dev server output
✅ Errors in separate file
✅ Timestamps for everything

## Troubleshooting

**Permission denied?**

```bash
chmod +x scripts/dev-with-logging.sh scripts/view-dev-logs.sh
```

**pnpm not found?**

```bash
npm install -g pnpm
```

**Need to clean logs?**

```bash
npm run dev:view-logs
# Then select option 7 (Clear old logs)
```

## Tips

💡 Keep log viewer open in a separate terminal
💡 Use search function (option 5) to find specific errors
💡 Error-only log is perfect for quick diagnosis
💡 Logs are automatically git-ignored

---

For detailed documentation, see [scripts/README.md](scripts/README.md)
