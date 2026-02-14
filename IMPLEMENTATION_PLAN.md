# CareOps Production-Ready Implementation Plan

## Executive Summary
**Timeline**: 2 Weeks to Production-Ready MVP  
**Priority**: Critical fixes (Week 1), Medium fixes (Week 2), Nice-to-have (Post-launch)  
**Estimated Effort**: 40-50 development hours

---

## Phase 1: CRITICAL FIXES (Week 1) - Non-Negotiable

### 🚨 Fix 1.1: Activation Validation - Availability Check
**Priority**: CRITICAL  
**Effort**: 2 hours  
**File**: `/src/app/api/workspace/validate-activation/route.ts`

#### Problem
Workspace can activate without service availability defined (days/times), violating PRD Step 8.

#### Implementation

```typescript
// Add to validate-activation/route.ts
const servicesWithoutAvailability = await prisma.service.count({
  where: { 
    workspaceId: user.workspaceId, 
    isActive: true,
    OR: [
      { availableDays: { equals: "" } },
      { availableDays: { equals: null } },
      { startTime: { equals: "" } },
      { startTime: { equals: null } },
      { endTime: { equals: "" } },
      { endTime: { equals: null } }
    ]
  },
});

if (servicesWithoutAvailability > 0) {
  errors.push("All active services must have availability (days and time slots) defined");
}
```

#### Testing Checklist
- [ ] Create service without availableDays → activation blocked
- [ ] Create service without startTime → activation blocked
- [ ] Create service without endTime → activation blocked
- [ ] Create service with all fields → activation allowed
- [ ] Create multiple services, one incomplete → activation blocked

---

### 🚨 Fix 1.2: Inventory Blocking at Zero Stock
**Priority**: CRITICAL  
**Effort**: 3 hours  
**Files**: 
- `/src/app/api/booking/create/route.ts`
- `/prisma/schema.prisma` (add constraints)

#### Problem
Can book even when inventory = 0, leading to over-commitment.

#### Implementation

**Step 1: Update booking creation API**
```typescript
// Add after fetching service, before creating booking
const inventoryLinks = await prisma.serviceInventoryLink.findMany({
  where: { serviceId },
  include: { inventory: true }
});

for (const link of inventoryLinks) {
  if (link.inventory.quantity < link.quantity) {
    return NextResponse.json(
      { 
        error: "Insufficient inventory", 
        details: {
          item: link.inventory.name,
          requested: link.quantity,
          available: link.inventory.quantity
        }
      },
      { status: 409 }
    );
  }
}
```

**Step 2: Add frontend error handling**
Update booking page to display inventory errors gracefully.

#### Testing Checklist
- [ ] Book with sufficient inventory → success
- [ ] Book with exact inventory match → success, inventory goes to 0
- [ ] Book with insufficient inventory → 409 error with details
- [ ] Book with linked inventory = 0 → 409 error
- [ ] Service without inventory links → booking works (optional inventory)

---

### 🚨 Fix 1.3: Webhook Security - HMAC Signatures
**Priority**: CRITICAL  
**Effort**: 4 hours  
**Files**:
- `/src/lib/automation.ts`
- `/prisma/schema.prisma`
- `/src/app/api/webhooks/route.ts`

#### Problem
Webhooks sent without signature verification - security vulnerability.

#### Implementation

**Step 1: Update Webhook model to include secret**
```prisma
model Webhook {
  id          String            @id @default(cuid())
  url         String
  event       AutomationTrigger
  secret      String?           // HMAC secret for signature
  isActive    Boolean           @default(true)
  workspaceId String
  workspace   Workspace         @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime          @default(now())
}
```

**Step 2: Create webhook signature utility**
```typescript
// /src/lib/webhook-security.ts
import crypto from 'crypto';

export function generateWebhookSignature(
  payload: string, 
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Step 3: Update webhook dispatch with signature**
```typescript
// In automation.ts, update webhook dispatch
webhooks.forEach(async (hook) => {
  const payload = {
    event: trigger,
    workspaceId,
    timestamp: new Date().toISOString(),
    payload: data,
  };
  
  const payloadString = JSON.stringify(payload);
  const signature = hook.secret 
    ? generateWebhookSignature(payloadString, hook.secret)
    : undefined;
  
  try {
    const response = await fetch(hook.url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(signature && { "X-Webhook-Signature": signature })
      },
      body: payloadString,
    });
    
    // Log delivery attempt
    await prisma.webhookDeliveryLog.create({
      data: {
        webhookId: hook.id,
        status: response.ok ? "SUCCESS" : "FAILED",
        statusCode: response.status,
        responseBody: response.ok ? null : await response.text(),
        workspaceId,
      }
    });
  } catch (err) {
    console.error(`Webhook failed (${hook.url}):`, err);
    
    await prisma.webhookDeliveryLog.create({
      data: {
        webhookId: hook.id,
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        workspaceId,
      }
    });
  }
});
```

**Step 4: Add WebhookDeliveryLog model**
```prisma
model WebhookDeliveryLog {
  id          String    @id @default(cuid())
  webhookId   String
  webhook     Webhook   @relation(fields: [webhookId], references: [id])
  status      String    // SUCCESS, FAILED
  statusCode  Int?
  responseBody String?
  error       String?
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  createdAt   DateTime  @default(now())
}
```

#### Testing Checklist
- [ ] Create webhook with secret → signature included in header
- [ ] Create webhook without secret → no signature header
- [ ] Webhook succeeds → logged as SUCCESS
- [ ] Webhook fails → logged as FAILED with error
- [ ] Delivery log visible in UI

---

### 🚨 Fix 1.4: Booking Transaction - Conflict Prevention
**Priority**: CRITICAL  
**Effort**: 3 hours  
**File**: `/src/app/api/booking/create/route.ts`

#### Problem
Race condition possible - conflict check runs before booking creation without database-level protection.

#### Implementation

**Option A: Database Transaction with SELECT FOR UPDATE (Recommended)**
```typescript
// Use Prisma transaction
const booking = await prisma.$transaction(async (tx) => {
  // Check conflict with locking
  const existingConflict = await tx.booking.findFirst({
    where: {
      workspaceId: service.workspaceId,
      status: { not: "CANCELLED" },
      AND: [
        { date: { lt: bookingEnd } },
        { endTime: { gt: bookingStart } }
      ]
    },
    // Note: SQLite doesn't support FOR UPDATE, use unique constraint instead
  });

  if (existingConflict) {
    throw new Error("CONFLICT");
  }

  // Create booking
  return tx.booking.create({
    data: {
      date: bookingStart,
      endTime: bookingEnd,
      status: "CONFIRMED",
      notes: notes,
      serviceId: service.id,
      contactId: dbContact.id,
      workspaceId: service.workspaceId
    }
  });
}, {
  isolationLevel: 'Serializable' // Prevents race conditions
});
```

**Option B: Unique Constraint on Time Slot (Alternative)**
```prisma
// Add to schema
model Booking {
  // ... existing fields
  
  // Prevent overlapping bookings at database level
  @@index([workspaceId, date, endTime])
}
```

#### Testing Checklist
- [ ] Simulate concurrent booking requests → only one succeeds
- [ ] Book exact same slot from two browsers → one gets conflict error
- [ ] Book adjacent slots (back-to-back) → both succeed

---

## Phase 2: MEDIUM PRIORITY FIXES (Week 2) - Important

### ⚠️ Fix 2.1: Real-Time Dashboard Updates
**Priority**: HIGH  
**Effort**: 6 hours  
**Files**:
- `/src/app/api/dashboard/route.ts`
- `/src/app/(dashboard)/dashboard/page.tsx`

#### Problem
PRD says "Real-time visibility" but dashboard requires manual refresh.

#### Implementation Options

**Option A: Polling (Simple, Recommended for MVP)**
```typescript
// In dashboard page component
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 30000); // Refresh every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**Option B: Server-Sent Events (More Real-Time)**
```typescript
// /src/app/api/dashboard/stream/route.ts
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      sendDashboardData(controller, user.workspaceId);
      
      // Set up interval for updates
      const interval = setInterval(async () => {
        await sendDashboardData(controller, user.workspaceId);
      }, 5000);
      
      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

#### Testing Checklist
- [ ] Dashboard updates without refresh
- [ ] Multiple tabs update simultaneously
- [ ] Performance acceptable (no excessive API calls)

---

### ⚠️ Fix 2.2: Auto-Resume Automation After Inactivity
**Priority**: HIGH  
**Effort**: 4 hours  
**Files**:
- `/src/app/api/automation/cron/route.ts`
- `/src/lib/automation.ts`

#### Problem
Automation paused forever after staff reply - should resume after period of inactivity.

#### Implementation

**Step 1: Add lastActivityAt to Conversation model**
```prisma
model Conversation {
  // ... existing fields
  lastActivityAt  DateTime  @default(now())
  autoResumeAt    DateTime? // When to auto-resume automation
}
```

**Step 2: Update staff reply handler to set auto-resume**
```typescript
// In automation.ts handleStaffReply
await prisma.conversation.update({
  where: { id: conversationId },
  data: { 
    isActive: false,
    autoResumeAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Resume after 24 hours
  },
});
```

**Step 3: Add auto-resume to cron job**
```typescript
// In cron/route.ts
const conversationsToResume = await prisma.conversation.findMany({
  where: {
    isActive: false,
    autoResumeAt: { lte: new Date() }
  }
});

for (const conv of conversationsToResume) {
  await resumeAutomation(conv.id, conv.workspaceId);
  
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { autoResumeAt: null }
  });
}
```

#### Testing Checklist
- [ ] Staff reply → automation pauses
- [ ] After 24 hours → automation resumes
- [ ] Manual resume still works
- [ ] Multiple pauses/resumes work correctly

---

### ⚠️ Fix 2.3: Timezone Handling for Bookings
**Priority**: MEDIUM  
**Effort**: 5 hours  
**Files**:
- `/src/app/api/booking/create/route.ts`
- `/src/app/api/booking/availability/route.ts`
- `/src/lib/date-utils.ts` (new file)

#### Problem
Booking dates stored without timezone conversion - cross-timezone confusion.

#### Implementation

**Step 1: Create date utility**
```typescript
// /src/lib/date-utils.ts
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export function toUTC(date: Date | string, timezone: string): Date {
  return zonedTimeToUtc(date, timezone);
}

export function fromUTC(date: Date, timezone: string): Date {
  return utcToZonedTime(date, timezone);
}

export function parseLocalDateTime(
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:mm
  timezone: string
): Date {
  const localDateTime = new Date(`${dateStr}T${timeStr}:00`);
  return toUTC(localDateTime, timezone);
}
```

**Step 2: Update booking creation**
```typescript
// In /api/booking/create/route.ts
import { parseLocalDateTime } from "@/lib/date-utils";

// Get workspace timezone
const workspace = await prisma.workspace.findUnique({
  where: { id: service.workspaceId },
  select: { timezone: true }
});

const bookingStart = parseLocalDateTime(date, time, workspace?.timezone || "UTC");
const bookingEnd = addMinutes(bookingStart, service.duration);
```

**Step 3: Update availability check**
```typescript
// Convert slot times to UTC for comparison
const slotStartUTC = parseLocalDateTime(date, time, workspace.timezone);
const slotEndUTC = addMinutes(slotStartUTC, service.duration);
```

#### Testing Checklist
- [ ] Book in different timezone → stored correctly in UTC
- [ ] Display booking → shows in workspace timezone
- [ ] Availability check respects timezone
- [ ] DST transitions handled correctly

---

### ⚠️ Fix 2.4: Rate Limiting on Public Endpoints
**Priority**: MEDIUM  
**Effort**: 3 hours  
**Files**:
- `/src/middleware.ts`
- `/src/lib/rate-limiter.ts` (new file)

#### Problem
Public contact forms and booking endpoints have no rate limiting - spam vulnerability.

#### Implementation

**Step 1: Create rate limiter utility**
```typescript
// /src/lib/rate-limiter.ts
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const cache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 60 * 60 * 1000, // 1 hour
});

export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const requests = cache.get(identifier) || [];
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: recentRequests[0] + config.windowMs
    };
  }
  
  recentRequests.push(now);
  cache.set(identifier, recentRequests);
  
  return {
    allowed: true,
    remaining: config.maxRequests - recentRequests.length - 1,
    resetTime: now + config.windowMs
  };
}
```

**Step 2: Apply rate limiting to public routes**
```typescript
// In middleware.ts or specific route handlers
const rateLimitResult = checkRateLimit(
  `${req.ip}:${pathname}`,
  { windowMs: 15 * 60 * 1000, maxRequests: 10 } // 10 requests per 15 minutes
);

if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Please try again later." },
    { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimitResult.resetTime)
      }
    }
  );
}
```

#### Testing Checklist
- [ ] Submit form 10 times quickly → 11th blocked
- [ ] Wait 15 minutes → can submit again
- [ ] Different IPs have separate limits
- [ ] Rate limit headers present in response

---

## Phase 3: NICE-TO-HAVE FEATURES (Post-Launch) - Optional

### 📝 Feature 3.1: Inventory Audit Log
**Priority**: LOW  
**Effort**: 4 hours

Track all inventory changes with reason/context.

```prisma
model InventoryLog {
  id            String    @id @default(cuid())
  itemId        String
  item          InventoryItem @relation(fields: [itemId], references: [id])
  previousQty   Int
  newQty        Int
  change        Int
  reason        String    // "booking_completed", "manual_adjustment", "restock"
  referenceId   String?   // bookingId or manual entry id
  workspaceId   String
  createdAt     DateTime  @default(now())
}
```

---

### 📝 Feature 3.2: Webhook Retry with Exponential Backoff
**Priority**: LOW  
**Effort**: 6 hours

Implement proper retry queue for failed webhooks.

- Store failed webhooks in queue
- Retry 3 times with exponential backoff (1min, 5min, 15min)
- Alert after all retries exhausted
- Manual retry option in UI

---

### 📝 Feature 3.3: Alert Priority Levels
**Priority**: LOW  
**Effort**: 3 hours

Add priority to alerts for better visibility.

```prisma
enum AlertPriority {
  CRITICAL  // Inventory 0, System failures
  HIGH      // Overdue forms, Unconfirmed bookings
  MEDIUM    // Low inventory, Failed deliveries
  LOW       // Informational
}
```

---

## Implementation Schedule

### Week 1: Critical Fixes (Days 1-5)

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| 1 | Fix 1.1: Activation validation | 2 | ⬜ |
| 1 | Fix 1.4: Booking transaction | 3 | ⬜ |
| 2 | Fix 1.2: Inventory blocking | 3 | ⬜ |
| 2 | Testing critical fixes | 2 | ⬜ |
| 3 | Fix 1.3: Webhook security (models) | 2 | ⬜ |
| 3 | Fix 1.3: Webhook security (logic) | 2 | ⬜ |
| 4 | Database migrations | 1 | ⬜ |
| 4 | Integration testing | 3 | ⬜ |
| 5 | Bug fixes & refinement | 4 | ⬜ |

**Week 1 Deliverable**: All critical fixes deployed, 89→95+ score

### Week 2: Medium Priority (Days 6-10)

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| 6 | Fix 2.1: Real-time dashboard | 3 | ⬜ |
| 6 | Fix 2.4: Rate limiting | 2 | ⬜ |
| 7 | Fix 2.2: Auto-resume automation | 4 | ⬜ |
| 8 | Fix 2.3: Timezone handling | 4 | ⬜ |
| 9 | Testing & integration | 4 | ⬜ |
| 10 | Documentation & deployment | 3 | ⬜ |

**Week 2 Deliverable**: Production-ready MVP with all fixes

---

## Database Migrations Required

```sql
-- Migration 1: Add webhook secret and delivery logs
ALTER TABLE "Webhook" ADD COLUMN "secret" TEXT;

CREATE TABLE "WebhookDeliveryLog" (
  "id" TEXT PRIMARY KEY,
  "webhookId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "statusCode" INTEGER,
  "responseBody" TEXT,
  "error" TEXT,
  "workspaceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id"),
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
);

-- Migration 2: Add conversation auto-resume
ALTER TABLE "Conversation" ADD COLUMN "autoResumeAt" TIMESTAMP;
ALTER TABLE "Conversation" ADD COLUMN "lastActivityAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Migration 3: Add alert priority
ALTER TABLE "Alert" ADD COLUMN "priority" TEXT DEFAULT 'MEDIUM';

-- Migration 4: Add inventory log (optional)
CREATE TABLE "InventoryLog" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "previousQty" INTEGER NOT NULL,
  "newQty" INTEGER NOT NULL,
  "change" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "referenceId" TEXT,
  "workspaceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id"),
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
);
```

---

## Testing Strategy

### Unit Tests
- Rate limiter logic
- Webhook signature generation/verification
- Date timezone conversions

### Integration Tests
- Booking conflict prevention (concurrent requests)
- Inventory blocking at zero
- Automation pause/resume flow

### E2E Tests
- Complete onboarding flow
- Contact-first customer journey
- Book-first customer journey
- Staff permissions enforcement

---

## Success Metrics

After implementation, verify:
- [ ] Activation validation blocks incomplete setups (100%)
- [ ] Zero inventory blocks bookings (100%)
- [ ] Webhooks include HMAC signatures (100%)
- [ ] No double-bookings under concurrent load (100%)
- [ ] Dashboard updates every 30 seconds (configurable)
- [ ] Automation resumes after 24 hours of inactivity
- [ ] Rate limiting blocks abuse (>10 req/15min)
- [ ] All tests passing

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Database migrations fail | Test on staging first, backup production DB |
| Timezone changes break existing bookings | Migration script to convert existing dates |
| Rate limiting blocks legitimate users | Start with generous limits, monitor logs |
| Webhook security breaks existing integrations | Make signature optional (backward compatible) |

---

**Plan Version**: 1.0  
**Last Updated**: 2026-02-14  
**Estimated Total Effort**: 47 hours (6 days active development)
