# Critical Bug Fix: Data Loss on Password Reset / OAuth Login

## Issue Summary

**Severity**: Critical  
**Impact**: Users could lose access to their workspace and data after password reset or Google OAuth login

### Root Cause

The Google OAuth callback was creating new users **without a workspace**, leaving them with `workspaceId: null`. When such users logged in, they were redirected to onboarding as if they were new users.

Additionally, if an existing user somehow lost their workspace association, the OAuth flow didn't create a new one for them.

## Affected Code

### Before (Buggy)
```typescript
// src/app/api/auth/google/callback/route.ts
if (!user) {
    // ❌ Creating user WITHOUT workspace
    user = await prisma.user.create({
        data: {
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            passwordHash: "",
            role: "OWNER",
            emailVerified: new Date(),
            // ❌ Missing workspaceId!
        },
    });
}
```

### After (Fixed)
```typescript
if (!user) {
    // ✅ Create workspace first
    const workspace = await prisma.workspace.create({
        data: { 
            name: `${googleUser.name}'s Workspace`, 
            status: "ONBOARDING",
            emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_FROM),
            smsConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER),
        },
    });
    
    // ✅ Create user linked to workspace
    user = await prisma.user.create({
        data: {
            email: googleUser.email,
            name: googleUser.name,
            googleId: googleUser.id,
            passwordHash: "",
            role: "OWNER",
            emailVerified: new Date(),
            workspaceId: workspace.id, // ✅ Linked!
        },
    });
}
```

## Files Changed

1. **`src/app/api/auth/google/callback/route.ts`**
   - Now creates workspace for new Google OAuth users
   - Creates workspace for existing users who don't have one
   - Properly links user to workspace

2. **New diagnostic tools:**
   - `src/lib/check-user.ts` - Check user/workspace status
   - `src/lib/recover-user.ts` - Recover orphaned users

## How to Diagnose

Check if a user has lost their workspace:

```bash
npx tsx src/lib/check-user.ts user@example.com
```

Output if workspace is missing:
```
👤 User Details:
  ID: xxx
  Email: user@example.com
  Workspace ID: ❌ NULL - No workspace!

⚠️  WARNING: User has no workspace associated!
   This means all previous data is inaccessible.
```

## How to Fix Affected Users

### Option 1: Automatic Recovery (Recommended)

Run the recovery script:

```bash
npx tsx src/lib/recover-user.ts user@example.com
```

This will:
1. Check for orphaned workspaces
2. Create a new workspace if needed
3. Link the user to the workspace
4. User can now log in normally

### Option 2: Manual Database Fix

Using Prisma Studio:

```bash
npx prisma studio
```

1. Find the user in the `User` table
2. Check if `workspaceId` is null
3. Either:
   - Create a new workspace and copy its ID to the user
   - Or find an existing workspace and link it

### Option 3: Raw SQL

```sql
-- Create new workspace for orphaned user
INSERT INTO "Workspace" (id, name, status, "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'User Workspace', 'ONBOARDING', NOW(), NOW())
RETURNING id;

-- Link user to workspace (replace with actual IDs)
UPDATE "User" 
SET "workspaceId" = 'workspace-id-here'
WHERE email = 'user@example.com';
```

## Prevention

The fix has been applied to ensure:

1. **New Google OAuth users** get a workspace automatically
2. **Existing users without workspace** get one created on OAuth login
3. **Email/password registration** continues to work as before

## Testing

To verify the fix works:

1. Create a new user via Google OAuth
2. Check they have a workspace:
   ```bash
   npx tsx src/lib/check-user.ts newuser@example.com
   ```
3. Verify workspace exists and is linked

## Data Recovery Notes

⚠️ **Important**: If a user's workspace was truly deleted (not just unlinked), their data (contacts, bookings, etc.) may be orphaned in the database. Check for:

- Contacts with `workspaceId` that doesn't exist
- Bookings with `workspaceId` that doesn't exist  
- Services with `workspaceId` that doesn't exist

To find orphaned data:

```bash
npx prisma studio
# Check each table for records with workspaceIds that don't exist in Workspace table
```

## Related Issues

This fix also resolves:
- Users being redirected to onboarding after password reset
- "Lost data" issues after OAuth login
- Workspace activation issues for OAuth users
