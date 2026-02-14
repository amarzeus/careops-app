# VAPI Voice AI Integration Plan for CareOps

## Executive Summary

This document outlines the comprehensive integration of VAPI.ai voice AI capabilities into the CareOps platform. The integration will add voice-based communication features that enhance customer service and operational efficiency.

**Budget**: $100 USD credit provided by hackathon judges

---

## 1. PRD Compliance Analysis

### Current Communication Channels (PRD Requirement 6)
| Channel | Status | Implementation |
|---------|--------|----------------|
| Email | ✅ Implemented | Nodemailer SMTP |
| SMS | ✅ Implemented | Twilio |
| WhatsApp | ✅ Implemented | Twilio WhatsApp |
| Voice Calls | ❌ Missing | **VAPI Integration** |

### Required Automation Rules (PRD Section 9)
- ✅ New contact → welcome message
- ✅ Booking created → confirmation
- ✅ Before booking → reminder
- ✅ Pending form → reminder
- ✅ Inventory below threshold → alert
- ✅ Staff reply → automation stops
- ❌ **Voice call handling** → NEW

### Integration Requirements (PRD Section 11)
PRD requires at least 2 integrations. Current:
1. ✅ Email provider
2. ✅ SMS provider
3. ✅ Calendar integration
4. ✅ File storage
5. ✅ Webhooks
6. ❌ **Voice AI** (NEW - adds significant value)

---

## 2. VAPI Platform Overview

### What is VAPI?
VAPI is a developer-first voice AI platform that provides:
- **Voice AI Agents**: AI-powered conversational agents
- **100+ Languages**: Multilingual support
- **Low Latency**: <500ms voice-to-voice
- **40+ Integrations**: HubSpot, Notion, etc.
- **Custom Tools**: API function calling during calls
- **Enterprise Security**: SOC2, HIPAA, PCI compliant
- **Inbound/Outbound Calls**: Full telephony capabilities

### How VAPI Works
```
User Call → VAPI (Transcriber) → AI Model → Voice (TTS) → User
                    ↓
            Custom Tools (API calls)
                    ↓
            Webhooks (events)
```

---

## 3. Integration Architecture

### 3.1 Database Models (Prisma)

```prisma
// Voice Call Management
model VoiceCall {
  id              String    @id @default(cuid())
  callSid        String?   @unique  // VAPI Call SID
  direction       String    // INBOUND | OUTBOUND
  status          String    // INITIATED, RINGING, IN_PROGRESS, COMPLETED, FAILED, NO_ANSWER
  contactId       String?
  contact         Contact?  @relation(fields: [contactId], references: [id])
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  duration        Int?      // seconds
  recordingUrl    String?
  transcript      String?
  cost            Float?
  startedAt       DateTime?
  endedAt         DateTime?
  
  // AI Agent details
  assistantId     String?   // VAPI Assistant ID
  summary         String?   // AI-generated call summary
  outcome         String?   // CALL_BACK, BOOKING_CREATED, INFO_PROVIDED, etc.
  
  createdAt      DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([workspaceId, status])
  @@index([contactId])
}

// Voice Agent Configuration
model VoiceAgent {
  id              String    @id @default(cuid())
  name            String
  description     String?
  isActive        Boolean   @default(true)
  
  // VAPI Configuration
  vapiAssistantId String?   // VAPI assistant ID (if created via VAPI)
  prompt          String?   // System prompt for the AI
  voiceId         String?   // Voice provider ID (e.g., ElevenLabs)
  
  // Capabilities
  canBook         Boolean   @default(false)
  canCheckStatus Boolean   @default(false)
  canTransfer     Boolean   @default(false)
  
  // Tool configuration (JSON)
  tools           Json?     // Enabled tools for this agent
  
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// Phone Number Management
model PhoneNumber {
  id              String    @id @default(cuid())
  phoneNumber     String    @unique
  label           String?   // e.g., "Main Line", "Booking Line"
  
  // VAPI Configuration
  vapiPhoneId     String?   // VAPI phone number ID
  isActive        Boolean   @default(true)
  
  // Forwarding
  forwardToStaff  Boolean   @default(false)
  forwardNumber   String?   // If not using VAPI assistant
  
  // Voice Agent assignment
  voiceAgentId    String?
  voiceAgent      VoiceAgent? @relation(fields: [voiceAgentId], references: [id])
  
  workspaceId     String
  workspace       Workspace @relation(fields: [workspaceId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([workspaceId])
}
```

### 3.2 VAPI Integration Library

Create `src/lib/vapi.ts`:

```typescript
import Vapi from '@vapi-ai/node';

interface VapiConfig {
  apiKey: string;
}

interface OutboundCallParams {
  assistantId: string;
  phoneNumber: string;
  contactName?: string;
  workspaceId: string;
  metadata?: Record<string, any>;
}

interface CallEvent {
  type: 'call-started' | 'call-ended' | 'speech-update' | 'tool-call';
  callId: string;
  // ... other fields
}

class VapiService {
  private client: Vapi | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client = new Vapi(apiKey);
    }
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  // Create outbound call
  async startOutboundCall(params: OutboundCallParams): Promise<string> {
    if (!this.client) {
      throw new Error('VAPI not configured');
    }

    const call = await this.client.calls.create({
      assistant_id: params.assistantId,
      phone_number: params.phoneNumber,
      metadata: {
        workspaceId: params.workspaceId,
        contactName: params.contactName,
        ...params.metadata,
      },
    });

    return call.id;
  }

  // End active call
  async endCall(callId: string): Promise<void> {
    if (!this.client) {
      throw new Error('VAPI not configured');
    }
    await this.client.calls.end(callId);
  }

  // Get call details
  async getCall(callId: string) {
    if (!this.client) {
      throw new Error('VAPI not configured');
    }
    return this.client.calls.get(callId);
  }

  // Handle webhook events
  handleWebhookEvent(event: CallEvent) {
    // Process VAPI webhook events
    switch (event.type) {
      case 'call-started':
        // Update call status in database
        break;
      case 'call-ended':
        // Update call record, generate summary
        break;
      case 'speech-update':
        // Real-time transcription
        break;
      case 'tool-call':
        // Execute tool (booking, etc.)
        break;
    }
  }
}

export const vapiService = new VapiService(process.env.VAPI_API_KEY || '');
export default vapiService;
```

### 3.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/voice/agents` | Manage voice agents |
| GET/POST | `/api/voice/numbers` | Manage phone numbers |
| POST | `/api/voice/calls/outbound` | Initiate outbound call |
| GET | `/api/voice/calls/[id]` | Get call details |
| POST | `/api/voice/webhook` | VAPI webhook receiver |
| POST | `/api/voice/calls/[id]/end` | End active call |

### 3.4 Voice Tools for AI Agents

Custom tools the AI can call during conversations:

```typescript
const voiceTools = [
  {
    name: 'check_availability',
    description: 'Check available booking slots',
    parameters: {
      serviceId: 'string',
      date: 'string',
    }
  },
  {
    name: 'create_booking',
    description: 'Create a new booking appointment',
    parameters: {
      serviceId: 'string',
      contactName: 'string',
      contactPhone: 'string',
      date: 'string',
      time: 'string',
      notes: 'string',
    }
  },
  {
    name: 'get_booking_status',
    description: 'Check status of existing booking',
    parameters: {
      bookingId: 'string',
    }
  },
  {
    name: 'transfer_to_staff',
    description: 'Transfer call to staff member',
    parameters: {
      staffId: 'string',
    }
  },
  {
    name: 'schedule_callback',
    description: 'Schedule a callback from staff',
    parameters: {
      contactPhone: 'string',
      preferredTime: 'string',
      reason: 'string',
    }
  },
];
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Day 1)
- [ ] Add VAPI API key to environment
- [ ] Install VAPI SDK: `npm install @vapi-ai/node`
- [ ] Add database models to schema.prisma
- [ ] Run `npx prisma db push`
- [ ] Create basic VAPI service library
- [ ] Create webhook endpoint for VAPI events

### Phase 2: Inbound Voice (Day 2)
- [ ] Configure VAPI assistant for inbound calls
- [ ] Set up phone number forwarding
- [ ] Implement call handling logic
- [ ] Add call recording storage
- [ ] Create call transcription handling
- [ ] Add call summary generation (using Gemini)

### Phase 3: Outbound Voice (Day 3)
- [ ] Create outbound call API endpoint
- [ ] Implement appointment confirmation calls
- [ ] Add reminder call functionality
- [ ] Create call scheduling system
- [ ] Add call outcome tracking

### Phase 4: AI Features (Day 4)
- [ ] Implement voice tools (booking, availability)
- [ ] Add real-time CRM context
- [ ] Create intelligent call routing
- [ ] Implement sentiment analysis
- [ ] Add automated follow-up actions

### Phase 5: Admin UI (Day 5)
- [ ] Voice agent management page
- [ ] Phone number management page
- [ ] Call history and recordings
- [ ] Analytics dashboard
- [ ] Settings and configuration

---

## 5. Environment Configuration

```env
# VAPI Configuration
VAPI_API_KEY=e59b37d5-ce8f-4093-9c2c-fea839b83ead

# Optional: Voice Providers (if using custom)
ELEVENLABS_API_KEY=
GEMINI_API_KEY=

# Storage for recordings (optional)
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

---

## 6. Testing Strategy

### Unit Tests
- VAPI service methods
- Tool call handlers
- Webhook processing

### E2E Tests
- Complete inbound call flow
- Complete outbound call flow
- Booking via voice
- Call transfer to staff

### Manual Testing
- Test various voice commands
- Test fallback scenarios
- Test call quality

---

## 7. Compliance & Security

### PRD Compliance Checklist
- [ ] Voice calls integrate with existing inbox
- [ ] Call history preserved per contact
- [ ] Staff can view all voice interactions
- [ ] Automation can trigger voice calls
- [ ] Voice calls fail gracefully

### Security Measures
- [ ] VAPI API key stored securely
- [ ] Call recordings encrypted at rest
- [ ] Phone numbers validated
- [ ] Rate limiting on outbound calls
- [ ] Audit logging for all calls

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Voice call pickup rate | >80% |
| Successful bookings via voice | >60% |
| Call completion rate | >90% |
| Average call duration | <5 min |
| Customer satisfaction | >4/5 |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| VAPI credit exhaustion | Set monthly limits, monitor usage |
| Call quality issues | Use multiple voice providers |
| API rate limits | Implement queuing system |
| Failed bookings | Always confirm via SMS/email |
| Timezone issues | Use user's local timezone |

---

## 10. Future Enhancements

- [ ] Video calling integration
- [ ] Multi-language support
- [ ] Voice biometrics
- [ ] Call scheduling UI
- [ ] Integration with more CRM systems
- [ ] Custom voice prompts
- [ ] Call analytics dashboard

---

## Appendix: VAPI Resources

- **Dashboard**: https://dashboard.vapi.ai
- **Documentation**: https://docs.vapi.ai
- **API Reference**: https://docs.vapi.ai/api-reference
- **Quick Start**: https://docs.vapi.ai/quickstart
- **Voice Providers**: https://docs.vapi.ai/voice-providers
- **Tools**: https://docs.vapi.ai/tools

---

*Document Version: 1.0*  
*Created: February 14, 2026*  
*For: CareOps Hackathon*
