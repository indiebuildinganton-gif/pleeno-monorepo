# Node.js Version Setup

## Requirements

This project requires Node.js version `^18.18.0 || ^19.8.0 || >=20.0.0` (as specified in package.json).

**Your current Node version is incompatible.** You have Node.js 18.17.0, which is below the minimum required version of 18.18.0.

## Quick Fix

### Option 1: Using nvm (Recommended)

1. Load nvm and install the correct Node version:

```bash
# Load nvm (if not already loaded)
source ~/.nvm/nvm.sh

# Install Node 20 (recommended for best compatibility)
nvm install 20

# Use Node 20
nvm use 20

# Verify the version
node --version  # Should show v20.x.x
```

2. Run the dev server:

```bash
pnpm run dev:log
```

The dev script has been updated to automatically use the Node version specified in `.nvmrc`.

### Option 2: Update System Node.js

If you don't use nvm, download and install Node.js 20 LTS from [nodejs.org](https://nodejs.org/).

## Automatic Version Management

An `.nvmrc` file has been created in the project root specifying Node 20.18.0.

The `dev-with-logging.sh` script has been updated to automatically:
1. Load nvm if available
2. Use the Node version from `.nvmrc`
3. Install the required version if not already installed

## Verification

After updating your Node version, verify with:

```bash
node --version  # Should show v20.x.x or v18.18.0+
pnpm run dev:log  # Should start without Node version errors
```

## Issues Fixed

1. ✅ Added `import-in-the-middle` and `require-in-the-middle` packages (required by OpenTelemetry/Sentry)
2. ✅ Created `.nvmrc` file for automatic Node version management
3. ✅ Updated `package.json` engines field to match Next.js requirements
4. ✅ Enhanced dev script to auto-load correct Node version via nvm
5. ⚠️ **ACTION REQUIRED**: Update your Node.js version to 20.x or 18.18.0+

## Next Steps

Once you've updated your Node version:

```bash
# Verify Node version
node --version

# Start dev server
pnpm run dev:log
```

All apps should now start without errors.
