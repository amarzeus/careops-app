# Email & SMS Configuration Fix

## Problem

Email and SMS stopped working even though environment variables were properly configured. The issue was that the application checks `workspace.emailConfigured` and `workspace.smsConfigured` flags in the database before sending messages, but these flags default to `false`.

## Root Cause

The application has a two-layer configuration system:
1. **Environment Variables** - Contain the actual SMTP/Twilio credentials
2. **Database Flags** - Workspace-level feature flags (`emailConfigured`, `smsConfigured`)

The automation code was only checking the database flags, ignoring the environment variables.

## Solution

### 1. Helper Functions Created

Added helper functions that check both workspace flags AND environment variables:

```typescript
function isEmailAvailable(workspace: Workspace): boolean {
  // If workspace flag is explicitly set, use it
  if (workspace.emailConfigured) return true;
  
  // Otherwise check if environment variables are configured
  const hasEmailEnv = !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
  
  return hasEmailEnv;
}

function isSMSAvailable(workspace: Workspace): boolean {
  if (workspace.smsConfigured) return true;
  
  const hasSMSEnv = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
  
  return hasSMSEnv;
}
```

### 2. Files Updated

- `src/lib/automation.ts` - Automation triggers now use helper functions
- `src/app/api/inbox/messages/route.ts` - Message sending uses helper functions
- `src/app/api/workspace/validate-activation/route.ts` - Validation uses helper functions

### 3. Utility Script Created

Created `src/lib/update-workspace-config.ts` to manually update workspace flags:

```bash
# Update workspace config for a specific workspace
npx tsx src/lib/update-workspace-config.ts <workspace-id>
```

## How to Fix Your Installation

### Option 1: Automatic (Recommended)
The code now automatically detects environment variables, so email/SMS should work immediately after restarting the server.

### Option 2: Update Database Flags
Run the utility script to set the flags in the database:

```bash
# Find your workspace ID
npx prisma studio

# Update the workspace
npx tsx src/lib/update-workspace-config.ts <workspace-id>
```

### Option 3: Manual Update
Use Prisma Studio to manually set `emailConfigured` and `smsConfigured` to `true`:

```bash
npx prisma studio
# Navigate to Workspace table
# Edit your workspace record
# Set emailConfigured = true, smsConfigured = true
```

## Verification

To verify email and SMS are working:

1. **Check environment variables**:
   ```bash
   # Should all be set
   echo $EMAIL_HOST $EMAIL_PORT $EMAIL_USER $EMAIL_PASS $EMAIL_FROM
   echo $TWILIO_ACCOUNT_SID $TWILIO_AUTH_TOKEN $TWILIO_PHONE_NUMBER
   ```

2. **Test email**: Create a contact with an email address and trigger an automation

3. **Test SMS**: Create a contact with a phone number and trigger an automation

4. **Check logs**: Look for success/failure messages in the application logs

## Environment Variables Required

### Email (SMTP via Resend)
```env
EMAIL_HOST="smtp.resend.com"
EMAIL_PORT="587"
EMAIL_USER="resend"
EMAIL_PASS="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="careops@your-domain.com"
```

### SMS (Twilio)
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"
```

## Troubleshooting

### Still not receiving emails?
1. Check spam/junk folders
2. Verify email address is valid
3. Check application logs for errors
4. Verify `EMAIL_FROM` domain is verified in Resend

### Still not receiving SMS?
1. Verify phone number format (E.164 format recommended)
2. Check Twilio account balance
3. Verify Twilio phone number is active
4. Check application logs for errors

### Workspace activation failing?
The validation now checks environment variables, so activation should work if env vars are set.

## Security Note

Environment variables are the preferred configuration method for server-side integrations. The database flags are optional and only needed if you want to disable email/SMS for specific workspaces while keeping the environment variables configured.
