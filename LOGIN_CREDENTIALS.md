# Login Credentials

## Demo Admin Account

Your demo admin account has been created and is ready to use:

### Credentials
- **Email**: `admin@test.local`
- **Password**: `Password123`
- **Role**: Agency Admin

### Login URL
http://localhost:3005/login

---

## Quick Commands

```bash
# Start the app (if not running)
npm run dev:shell

# Reset and recreate demo user
npm run db:reset
npm run db:create-demo
```

---

## What You Can Do

As an Agency Admin, you have full access to:
- ✅ User Management
- ✅ Agency Settings
- ✅ Entity Management
- ✅ Payment Plans
- ✅ Reports
- ✅ All Administrative Functions

---

## Need a Fresh Start?

If you need to reset everything:

```bash
# 1. Reset database
npm run db:reset

# 2. Recreate demo user
npm run db:create-demo

# 3. Login again
# Visit: http://localhost:3005/login
```

---

## Creating Additional Users

Once logged in as admin, you can:
1. Go to Settings > Users
2. Click "Invite User"
3. Send invitation emails
4. New users will receive an email to complete signup

---

**Note**: This is a development/demo account. Never use these credentials in production!
