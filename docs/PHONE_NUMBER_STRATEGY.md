# CareOps Phone Number Provisioning Strategy

## Executive Summary

**Problem:** Business owners need phone numbers assigned automatically without manual setup.

**Key Finding:** Vapi does NOT have an API to search or purchase phone numbers. Vapi only provides:

- Free US numbers (max 10, US-only)
- Import endpoint for existing Twilio numbers

**Solution:** Use Twilio as the provisioning layer + Vapi as the AI voice layer.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAREOPS PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐  │
│  │   Twilio    │────▶│   CareOps API    │────▶│        Vapi             │  │
│  │  (Provision)│     │  (Orchestration) │     │  (Voice AI)             │  │
│  └─────────────┘     └──────────────────┘     └─────────────────────────┘  │
│        │                     │                          │                    │
│        │                     │                          │                    │
│        ▼                     ▼                          ▼                    │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐  │
│  │   Search    │     │   Track Usage    │     │   Create Assistant     │  │
│  │   Purchase  │     │   Enforce Limits │     │   Link Number          │  │
│  │   Subaccount│     │   Bill Customer  │     │   Handle Calls         │  │
│  └─────────────┘     └──────────────────┘     └─────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Option Analysis

### Option A: Platform-Owned Twilio Account (RECOMMENDED)

**How it works:**

1. CareOps maintains ONE Twilio master account
2. Create Twilio subaccounts per workspace (business)
3. Search & purchase numbers programmatically
4. Import numbers to Vapi
5. Bill customers via Razorpay subscription

**Pros:**

- Fully automated provisioning
- Single point of compliance management
- Better UX (customer doesn't need Twilio account)
- Revenue opportunity (markup on Twilio costs)

**Cons:**

- Platform bears Twilio costs upfront
- Compliance burden on platform
- Address verification required for some regions

**Cost Structure:**
| Item | Twilio Cost | Charge to Customer |
|------|-------------|-------------------|
| US Local Number | $1.00/month | ₹150/month (included in plan) |
| IN Mobile Number | ~$3-5/month | ₹500/month (add-on) |
| Voice Minutes | $0.005-0.02/min | ₹0.50-2/min |

---

### Option B: BYOT (Bring Your Own Twilio)

**How it works:**

1. Customer provides Twilio credentials
2. CareOps imports their existing numbers
3. Customer pays Twilio directly

**Pros:**

- No upfront cost to platform
- Compliance is customer's responsibility
- Works for all regions

**Cons:**

- Poor UX (customer must set up Twilio)
- Not fully automated
- Customer may leave if they own the number

---

### Option C: Vapi Free Numbers (US ONLY)

**How it works:**

1. Use Vapi's free US number provisioning
2. Limited to US numbers, max 10 per account

**Pros:**

- Completely free
- Simplest implementation

**Cons:**

- US numbers only
- Max 10 numbers per platform (not per customer)
- No international support

---

## Recommended Strategy: Option A + B Hybrid

### Phase 1: Platform Provisioning (US, UK, CA, AU)

For supported regions with straightforward compliance:

```
Customer Flow:
1. Subscribe to Growth/Pro plan
2. Go to Voice Setup
3. Select country → See available numbers
4. Click "Get Number" → Number provisioned automatically
5. Number appears in dashboard, ready to use
```

### Phase 2: BYOT for Complex Regions

For regions with strict regulations (EU, Asia):

```
Customer Flow:
1. Subscribe to plan
2. Go to Voice Setup
3. Select "Import your own number"
4. Enter Twilio credentials (encrypted)
5. Number imported and linked
```

---

## Technical Implementation

### 1. Twilio Subaccount Architecture

```typescript
// lib/twilio-platform.ts

import Twilio from "twilio";
import { prisma } from "./prisma";

const TWILIO_MAIN_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_MAIN_TOKEN = process.env.TWILIO_AUTH_TOKEN!;

export async function getOrCreateTwilioSubaccount(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { twilioSubaccountSid: true, name: true },
  });

  if (workspace?.twilioSubaccountSid) {
    return workspace.twilioSubaccountSid;
  }

  const client = Twilio(TWILIO_MAIN_SID, TWILIO_MAIN_TOKEN);

  const subaccount = await client.api.v2010.accounts.create({
    friendlyName: `CareOps-${workspaceId.slice(0, 8)}`,
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { twilioSubaccountSid: subaccount.sid },
  });

  return subaccount.sid;
}

export function getTwilioClient(subaccountSid?: string) {
  return Twilio(TWILIO_MAIN_SID, TWILIO_MAIN_TOKEN, {
    accountSid: subaccountSid || TWILIO_MAIN_SID,
  });
}
```

### 2. Phone Number Search API

```typescript
// app/api/voice/numbers/search/route.ts

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get("country") || "US";
  const areaCode = searchParams.get("areaCode");
  const pattern = searchParams.get("pattern");
  const type = searchParams.get("type") || "local"; // local, tollfree, mobile

  const subaccountSid = await getOrCreateTwilioSubaccount(user.workspaceId);
  const client = getTwilioClient(subaccountSid);

  const searchOptions: Record<string, unknown> = {
    limit: 20,
    voiceEnabled: true,
    smsEnabled: true,
  };

  if (areaCode) searchOptions.areaCode = areaCode;
  if (pattern) searchOptions.contains = pattern;

  let availableNumbers;

  if (type === "tollfree") {
    availableNumbers = await client.availablePhoneNumbers(countryCode).tollFree.list(searchOptions);
  } else if (type === "mobile") {
    availableNumbers = await client.availablePhoneNumbers(countryCode).mobile.list(searchOptions);
  } else {
    availableNumbers = await client.availablePhoneNumbers(countryCode).local.list(searchOptions);
  }

  return NextResponse.json({
    numbers: availableNumbers.map((n) => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
      locality: n.locality,
      region: n.region,
      isoCountry: n.isoCountry,
      capabilities: {
        voice: n.capabilities.voice,
        sms: n.capabilities.sms,
        mms: n.capabilities.mms,
      },
      monthlyCost: getEstimatedCost(countryCode, type),
    })),
    country: countryCode,
  });
}

function getEstimatedCost(country: string, type: string): number {
  const costs: Record<string, Record<string, number>> = {
    US: { local: 1.0, tollfree: 2.0, mobile: 1.0 },
    GB: { local: 0.5, tollfree: 5.0, mobile: 2.0 },
    IN: { local: 2.0, tollfree: 5.0, mobile: 4.0 },
    CA: { local: 1.0, tollfree: 2.0, mobile: 1.5 },
    AU: { local: 1.5, tollfree: 3.0, mobile: 2.0 },
  };
  return costs[country]?.[type] || 3.0;
}
```

### 3. Phone Number Purchase & Provisioning

```typescript
// app/api/voice/numbers/provision/route.ts

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { phoneNumber, country, type, agentId } = body;

  // 1. Check plan limits
  const limitCheck = await checkPhoneNumberLimit(user.workspaceId);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 402 });
  }

  // 2. Get or create Twilio subaccount
  const subaccountSid = await getOrCreateTwilioSubaccount(user.workspaceId);
  const twilio = getTwilioClient(subaccountSid);

  // 3. Purchase number from Twilio
  const purchased = await twilio.incomingPhoneNumbers.create({
    phoneNumber,
    friendlyName: `CareOps-${user.workspaceId.slice(0, 8)}`,
    voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook`,
    voiceMethod: "POST",
    statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
    statusCallbackMethod: "POST",
  });

  // 4. Get Vapi assistant ID
  const agent = await prisma.voiceAgent.findFirst({
    where: { id: agentId, workspaceId: user.workspaceId },
    select: { vapiAssistantId: true },
  });

  // 5. Import to Vapi
  const vapiClient = getVapiClient();
  const vapiPhone = await vapiClient.importTwilioNumber({
    twilioPhoneNumberSid: purchased.sid,
    assistantId: agent?.vapiAssistantId,
    workspaceId: user.workspaceId,
  });

  // 6. Store in database
  const phoneNumberRecord = await prisma.phoneNumber.create({
    data: {
      phoneNumber,
      label: `Main Number`,
      twilioPhoneSid: purchased.sid,
      vapiPhoneId: vapiPhone.id,
      workspaceId: user.workspaceId,
      voiceAgentId: agentId,
      isActive: true,
    },
  });

  // 7. Update usage record
  await trackUsage(user.workspaceId, "phone_numbers", 1);

  return NextResponse.json({
    success: true,
    phoneNumber: phoneNumberRecord,
    monthlyCost: getEstimatedCost(country, type),
  });
}
```

### 4. Webhook Configuration

```typescript
// After purchasing, configure Twilio webhooks to point to Vapi

await twilio.incomingPhoneNumbers(purchased.sid).update({
  voiceUrl: `https://api.vapi.ai/call/webhook`, // Vapi handles this
  voiceMethod: "POST",
  statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/twilio-status`,
  statusCallbackMethod: "POST",
  statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
});
```

---

## Database Schema Updates

```prisma
model Workspace {
  // ... existing fields
  twilioSubaccountSid String?
  twilioAuthToken     String?  // Encrypted subaccount token
}

model PhoneNumber {
  // ... existing fields
  twilioPhoneSid    String?   // Twilio's phone number SID
  monthlyFee        Float     @default(150)  // INR per month
  country           String    @default("IN")
  numberType        String    @default("local") // local, tollfree, mobile
}
```

---

## Pricing Model

### Included in Plans

| Plan                    | Phone Numbers | Voice Minutes |
| ----------------------- | ------------- | ------------- |
| Free                    | 0             | 0             |
| Growth (₹1,999/mo)      | 1 included    | 200 included  |
| Pro (₹4,999/mo)         | 3 included    | 1000 included |
| Enterprise (₹14,999/mo) | Unlimited     | Unlimited     |

### Add-on Pricing

| Item                 | Price      |
| -------------------- | ---------- |
| Additional US Number | ₹150/month |
| Additional IN Number | ₹500/month |
| Extra Voice Minutes  | ₹2/minute  |
| Toll-Free Number     | ₹300/month |

---

## Compliance Considerations

### US Numbers

- No address required for most numbers
- Toll-free requires business verification

### India Numbers

- TRAI regulations apply
- Business registration required
- Address verification mandatory
- Use Twilio's regulatory bundle API

### EU Numbers (GDPR)

- Local address in EU required
- Data processing agreements
- Voice recording consent

### Implementation

```typescript
// Check regulatory requirements before purchase
export async function checkRegulatoryRequirements(
  countryCode: string,
  numberType: string
): Promise<{
  required: boolean;
  documents: string[];
  addressRequired: boolean;
}> {
  const requirements: Record<string, Record<string, typeof result>> = {
    US: {
      local: { required: false, documents: [], addressRequired: false },
      tollfree: { required: true, documents: ["business_registration"], addressRequired: true },
    },
    IN: {
      local: {
        required: true,
        documents: ["business_registration", "identity_proof"],
        addressRequired: true,
      },
      mobile: { required: true, documents: ["identity_proof"], addressRequired: true },
    },
    GB: {
      local: { required: false, documents: [], addressRequired: false },
      tollfree: { required: true, documents: ["business_registration"], addressRequired: false },
    },
  };

  return (
    requirements[countryCode]?.[numberType] || {
      required: false,
      documents: [],
      addressRequired: false,
    }
  );
}
```

---

## Customer Experience Flow

### Simple Flow (US/UK/CA)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Upgrade to Growth Plan                                       │
│     └── Razorpay checkout → Subscription activated              │
│                                                                  │
│  2. Voice Setup Page                                             │
│     └── "Select your phone number"                               │
│         ├── Choose country: [US ▼]                               │
│         ├── Choose area code: [415 ▼] or Search: "San Fran..."  │
│         └── See 20 available numbers                             │
│                                                                  │
│  3. Select Number                                                │
│     └── Click "+1 415-555-1234" → "Provision"                   │
│         ├── Number purchased from Twilio                         │
│         ├── Number imported to Vapi                              │
│         └── Number appears in dashboard                          │
│                                                                  │
│  4. Configure Agent                                              │
│     └── Select template → Customize → Save                       │
│                                                                  │
│  5. Done! Number rings to AI agent                               │
└─────────────────────────────────────────────────────────────────┘
```

### Complex Flow (India/EU)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Upgrade to Growth Plan                                       │
│                                                                  │
│  2. Voice Setup Page                                             │
│     └── "Select your phone number"                               │
│         ├── Choose country: [India ▼]                            │
│         └── ⚠️ "Additional verification required"                │
│                                                                  │
│  3. Compliance Form                                              │
│     ├── Business Name: ___________                              │
│     ├── GST Number: ___________                                 │
│     ├── Address: ___________                                    │
│     ├── Upload: [Business Registration] [Identity Proof]        │
│     └── Submit → Twilio validates                               │
│                                                                  │
│  4. Search Numbers (after verification)                          │
│     └── Select from available numbers                            │
│                                                                  │
│  5. Number Provisioned                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Week 1: Core Infrastructure

- [ ] Add Twilio subaccount management
- [ ] Create number search API
- [ ] Create number purchase API
- [ ] Update database schema

### Week 2: Vapi Integration

- [ ] Import number to Vapi after purchase
- [ ] Configure webhooks
- [ ] Link numbers to agents
- [ ] Test call flow

### Week 3: UI/UX

- [ ] Number search UI with filters
- [ ] Provisioning flow UI
- [ ] Compliance forms for regulated countries
- [ ] Error handling and feedback

### Week 4: Billing & Compliance

- [ ] Track number costs per workspace
- [ ] Enforce plan limits
- [ ] Regulatory compliance API
- [ ] Document upload handling

---

## Environment Variables Required

```env
# Twilio (Platform Account)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_MAIN_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Vapi
VAPI_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Summary

| Aspect                  | Solution                                           |
| ----------------------- | -------------------------------------------------- |
| **Number Source**       | Twilio (not Vapi)                                  |
| **Provisioning**        | Programmatic via Twilio API                        |
| **Voice AI**            | Vapi (import numbers)                              |
| **Subaccounts**         | One per workspace for isolation                    |
| **Billing**             | Included in plan + overage charges                 |
| **Compliance**          | Platform-managed with customer data                |
| **Supported Countries** | US, UK, CA, AU (easy) + others (with verification) |

This strategy enables **fully automated phone number provisioning** for business owners with no manual setup required.
