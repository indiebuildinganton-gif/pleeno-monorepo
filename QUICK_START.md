# Quick Start - Pleeno

Get up and running in 4 simple steps:

## 1. Start Supabase
```bash
npx supabase start
```

## 2. Apply Migrations
```bash
npm run db:seed
```

## 3. Create Demo User
```bash
npm run db:create-demo
```

This creates:
- Email: `admin@test.local`
- Password: `Password123`
- Role: Agency Admin

## 4. Start the App & Login
```bash
npm run dev:shell
```

Visit: **http://localhost:3005/login**

Login with:
- Email: `admin@test.local`
- Password: `Password123`

**Done!** You're now logged in as the admin user.

---

## ⚠️ If Login Fails

If you get "Failed to fetch" or "Invalid credentials":

1. **Make sure shell app is running** on port 3005
2. **Restart the shell app** to load environment changes:
   ```bash
   # Kill any process on port 3005
   lsof -ti:3005 | xargs kill -9

   # Start again
   npm run dev:shell
   ```

3. **Check environment is correct**:
   - File: `apps/shell/.env.local`
   - Should have: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`

---

## Reset Everything

If you need to start fresh:

```bash
npm run db:reset
```

Then go back to step 3 and create a new account.

---

For detailed setup instructions, see [SETUP.md](SETUP.md)
