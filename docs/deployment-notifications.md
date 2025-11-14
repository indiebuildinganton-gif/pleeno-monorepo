# Notification System - Deployment Guide

## Prerequisites

1. **Resend Account:**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain (e.g., pleeno.com)
   - Generate API key

2. **Domain Verification:**
   - Add DNS records provided by Resend
   - Verify SPF, DKIM, and DMARC records
   - Test email sending from verified domain

## Environment Variables

Add these environment variables to your deployment:

### Production (.env.production or Vercel)

```bash
# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application URL (for generating links in emails)
NEXT_PUBLIC_APP_URL=https://pleeno.com

# Supabase (should already be set)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### Development (.env.local)

```bash
# Use Resend test mode for development
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Migration

1. **Run notification system migration:**
   ```bash
   supabase migration up
   ```

2. **Verify tables created:**
   ```bash
   supabase db ls
   ```
   Should see:
   - notification_rules
   - email_templates
   - notification_log

3. **Verify RLS policies:**
   ```sql
   SELECT tablename, policyname FROM pg_policies
   WHERE tablename IN ('notification_rules', 'email_templates', 'notification_log');
   ```

## Edge Function Deployment

1. **Deploy send-notifications function:**
   ```bash
   supabase functions deploy send-notifications
   ```

2. **Set secrets:**
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   supabase secrets set APP_URL=https://pleeno.com
   ```

3. **Test function:**
   ```bash
   curl -i --location --request POST \
     'https://xxxxx.supabase.co/functions/v1/notifications/send-notifications' \
     --header 'Authorization: Bearer YOUR_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"installmentIds":[],"eventType":"overdue"}'
   ```

## Verification Steps

### 1. Test Email Sending

```bash
# Send test email via Resend dashboard
# Or use the preview API endpoint
curl -X POST https://pleeno.com/api/email/preview \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Test User","amount":"$100"}'
```

### 2. Test Notification Rules

1. Login as agency admin
2. Navigate to Settings → Notifications
3. Enable student overdue notifications
4. Create a test installment with due date in the past
5. Run status update job manually
6. Verify email sent to student

### 3. Test Duplicate Prevention

1. Run status update job twice
2. Check notification_log table
3. Verify only one entry per installment/recipient

### 4. Monitor Resend Dashboard

1. Login to Resend dashboard
2. Navigate to Logs
3. Verify emails are being delivered
4. Check bounce/complaint rates

## Troubleshooting

### Emails Not Sending

**Check 1: Verify RESEND_API_KEY**
```bash
supabase secrets list
```

**Check 2: Check Edge Function logs**
```bash
supabase functions logs send-notifications
```

**Check 3: Verify domain authentication**
- Login to Resend dashboard
- Check domain verification status
- Ensure SPF/DKIM records are correct

### High Bounce Rate

1. **Verify recipient email addresses:**
   - Check students table for invalid emails
   - Remove test/fake emails

2. **Update email templates:**
   - Avoid spammy words (free, win, click here)
   - Include plain text version
   - Add unsubscribe link

3. **Monitor sender reputation:**
   - Check Resend dashboard for sender score
   - Reduce send volume if needed

## Rate Limits

**Resend Free Tier:**
- 100 emails/day
- 3,000 emails/month

**Resend Pro Tier:**
- 50,000 emails/month
- Higher sending rate

**Application Rate Limits:**
- Max 100 emails per hour per agency (configurable in Edge Function)

## Monitoring

### Metrics to Track

1. **Email delivery rate:** % of emails successfully delivered
2. **Bounce rate:** % of emails bounced
3. **Complaint rate:** % of emails marked as spam
4. **Open rate:** % of emails opened (if tracking enabled)

### Alerts to Configure

1. **High bounce rate:** > 5%
2. **High complaint rate:** > 0.1%
3. **Failed sends:** > 10 consecutive failures

## Rollback Plan

If notification system causes issues:

1. **Disable notifications:**
   ```sql
   UPDATE notification_rules SET is_enabled = false;
   ```

2. **Disable status update job:**
   - Comment out Edge Function call in status update job
   - Redeploy job

3. **Revert database migration:**
   ```bash
   supabase migration down
   ```

## Support Contacts

- **Resend Support:** support@resend.com
- **Technical Issues:** [Your support email]
- **Emergency Contact:** [Your on-call number]
