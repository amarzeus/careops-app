const apiKey = process.env.VAPI_API_KEY || '';

interface VapiCall {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface VapiCallsClient {
  create(params: unknown): Promise<VapiCall>;
  get(id: string): Promise<VapiCall>;
  list(): Promise<{ data: VapiCall[] }>;
}

interface VapiAssistantsClient {
  create(params: unknown): Promise<any>;
  update(id: string, params: unknown): Promise<any>;
  list(): Promise<any>;
  get(id: string): Promise<any>;
}

interface VapiClientType {
  calls: VapiCallsClient;
  assistants: VapiAssistantsClient;
}

let vapiClient: VapiClientType | null = null;

if (apiKey) {
  // Use dynamic import for ESM compatibility and to satisfy linting
  import('@vapi-ai/server-sdk')
    .then(({ VapiClient }) => {
      vapiClient = new VapiClient({ token: apiKey }) as unknown as VapiClientType;
    })
    .catch((e) => {
      console.warn('[VAPI] Failed to initialize VAPI client:', e);
    });
}

export const vapi = vapiClient;

export interface VapiConfig {
  isConfigured: boolean;
}

/**
 *
 */
export function isVapiConfigured(): boolean {
  return !!vapiClient;
}

export interface OutboundCallRequest {
  assistantId?: string;
  phoneNumber: string;
  contactName?: string;
  workspaceId: string;
  contactId?: string;
  metadata?: Record<string, unknown>;
}

/**
 *
 * @param request
 */
export async function initiateOutboundCall(
  request: OutboundCallRequest
): Promise<{ callId: string; success: boolean; error?: string }> {
  if (!vapiClient) {
    return { callId: '', success: false, error: 'VAPI not configured' };
  }

  try {
    const call = await vapiClient.calls.create({
      assistant_id: request.assistantId,
      phone_number: request.phoneNumber,
      metadata: {
        workspaceId: request.workspaceId,
        contactName: request.contactName,
        contactId: request.contactId,
        ...request.metadata,
      },
    }) as VapiCall;

    return { callId: call.id, success: true };
  } catch (error) {
    console.error('[VAPI] Outbound call failed:', error);
    return {
      callId: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 *
 * @param callId
 */
export async function endCall(callId: string): Promise<{ success: boolean; error?: string }> {
  if (!vapiClient) {
    return { success: false, error: 'VAPI not configured' };
  }

  try {
    await vapiClient.calls.get(callId);
    return { success: true };
  } catch (error) {
    console.error('[VAPI] End call failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 *
 * @param callId
 */
export async function getCallDetails(callId: string): Promise<VapiCall | null> {
  if (!vapiClient) {
    return null;
  }

  try {
    return await vapiClient.calls.get(callId);
  } catch (error) {
    console.error('[VAPI] Get call details failed:', error);
    return null;
  }
}

export type VapiCallStatus =
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'no-answer'
  | 'busy'
  | 'cancelled';

export interface VapiCallEvent {
  type: string;
  call_id: string;
  status?: VapiCallStatus;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}

/**
 *
 * @param event
 */
export function processVapiWebhook(event: VapiCallEvent): {
  callId: string;
  status: string;
  action: 'update' | 'create' | 'end';
} {
  const { type, call_id, status } = event;

  switch (type) {
    case 'call.started':
    case 'call.ringing':
      return { callId: call_id, status: status || 'initiated', action: 'create' };

    case 'call.in-progress':
      return { callId: call_id, status: 'in_progress', action: 'update' };

    case 'call.completed':
    case 'call.ended':
      return { callId: call_id, status: 'completed', action: 'end' };

    case 'call.failed':
      return { callId: call_id, status: 'failed', action: 'end' };

    case 'call.no-answer':
      return { callId: call_id, status: 'no_answer', action: 'end' };

    case 'call.busy':
      return { callId: call_id, status: 'busy', action: 'end' };

    default:
      console.log('[VAPI] Unknown webhook event type:', type);
      return { callId: call_id, status: 'unknown', action: 'update' };
  }
}

export const VOICE_TOOLS = [
  {
    name: 'check_availability',
    description: 'Check available booking slots for a service on a given date',
    parameters: {
      type: 'object',
      properties: {
        serviceId: { type: 'string', description: 'The service ID' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      },
      required: ['serviceId', 'date'],
    },
  },
  {
    name: 'create_booking',
    description: 'Create a new booking appointment',
    parameters: {
      type: 'object',
      properties: {
        serviceId: { type: 'string', description: 'The service ID' },
        contactName: { type: 'string', description: 'Customer name' },
        contactPhone: { type: 'string', description: 'Customer phone number' },
        contactEmail: { type: 'string', description: 'Customer email (optional)' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM format' },
        notes: { type: 'string', description: 'Additional notes (optional)' },
      },
      required: ['serviceId', 'contactName', 'contactPhone', 'date', 'time'],
    },
  },
  {
    name: 'get_booking_status',
    description: 'Check the status of an existing booking',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'The booking ID (preferred)' },
        customerPhone: { type: 'string', description: 'Customer phone number (fallback lookup)' },
        workspaceId: { type: 'string', description: 'Workspace ID for fallback lookup' },
      },
      required: [],
    },
  },
  {
    name: 'reschedule_booking',
    description: 'Reschedule an existing booking to a new date/time',
    parameters: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', description: 'The booking ID' },
        date: { type: 'string', description: 'New date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'New time in HH:MM format' },
      },
      required: ['bookingId', 'date', 'time'],
    },
  },
  {
    name: 'transfer_to_staff',
    description: 'Transfer the call to a staff member',
    parameters: {
      type: 'object',
      properties: {
        staffName: { type: 'string', description: 'Name of the staff member' },
        reason: { type: 'string', description: 'Reason for transfer' },
      },
      required: ['staffName', 'reason'],
    },
  },
  {
    name: 'get_services',
    description: 'Get list of available services',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_business_hours',
    description: 'Get business hours and availability information',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

export const DEFAULT_SYSTEM_PROMPT = `You are a professional receptionist for a service-based business called {business_name}.

Your responsibilities:
1. Greet customers warmly and professionally
2. Help customers book appointments
3. Answer questions about services and pricing
4. Check booking status
5. Provide business information (hours, location, etc.)
6. Transfer to a staff member if needed

Guidelines:
- Be friendly, helpful, and professional
- Keep responses concise and clear
- Confirm details before creating bookings
- Always ask if there's anything else you can help with
- If you cannot help, offer to transfer to a staff member

Available services: {services_list}
Business hours: {business_hours}
`;

/**
 *
 */
export async function checkVapiHealth(): Promise<{
  healthy: boolean;
  configured: boolean;
  error?: string;
}> {
  if (!vapiClient) {
    return {
      healthy: false,
      configured: false,
      error: 'VAPI API key not configured',
    };
  }

  try {
    const start = Date.now();
    await vapiClient.calls.list();
    const latency = Date.now() - start;

    return {
      healthy: true,
      configured: true,
      error: undefined,
    };
  } catch (error) {
    return {
      healthy: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 *
 */
export function getVapiStatus(): {
  configured: boolean;
  apiKeyPresent: boolean;
  clientInitialized: boolean;
} {
  return {
    configured: isVapiConfigured(),
    apiKeyPresent: !!apiKey,
    clientInitialized: !!vapiClient,
  };
}

/**
 * Create a new Vapi assistant
 * @param params
 */
export async function createVapiAssistant(params: any): Promise<any> {
  if (!vapiClient) {
    throw new Error('VAPI client not initialized');
  }
  try {
    const assistant = await vapiClient.assistants.create(params);
    return assistant;
  } catch (error) {
    console.error('[VAPI] Failed to create assistant:', error);
    throw error;
  }
}

/**
 * Update an existing Vapi assistant
 * @param id
 * @param params
 */
export async function updateVapiAssistant(id: string, params: any): Promise<any> {
  if (!vapiClient) {
    throw new Error('VAPI client not initialized');
  }
  try {
    const assistant = await vapiClient.assistants.update(id, params);
    return assistant;
  } catch (error) {
    console.error('[VAPI] Failed to update assistant:', error);
    throw error;
  }
}
