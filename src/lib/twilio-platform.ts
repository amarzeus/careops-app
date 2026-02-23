import Twilio from 'twilio';
import { prisma } from './prisma';

const TWILIO_MAIN_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_MAIN_TOKEN = process.env.TWILIO_AUTH_TOKEN;

export interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
  isoCountry: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyCost: number;
  numberType: 'local' | 'tollfree' | 'mobile';
}

export interface RegulatoryRequirement {
  required: boolean;
  documents: string[];
  addressRequired: boolean;
  addressType: 'none' | 'any' | 'local' | 'foreign';
}

const NUMBER_COSTS: Record<string, Record<string, number>> = {
  US: { local: 1.00, tollfree: 2.00, mobile: 1.00 },
  GB: { local: 0.50, tollfree: 5.00, mobile: 2.00 },
  IN: { local: 2.00, tollfree: 5.00, mobile: 4.00 },
  CA: { local: 1.00, tollfree: 2.00, mobile: 1.50 },
  AU: { local: 1.50, tollfree: 3.00, mobile: 2.00 },
  DE: { local: 1.50, tollfree: 4.00, mobile: 3.00 },
  FR: { local: 1.50, tollfree: 4.00, mobile: 3.00 },
  JP: { local: 3.00, tollfree: 5.00, mobile: 4.00 },
};

const REGULATORY_REQUIREMENTS: Record<string, Record<string, RegulatoryRequirement>> = {
  US: {
    local: { required: false, documents: [], addressRequired: false, addressType: 'none' },
    tollfree: { required: true, documents: ['business_registration'], addressRequired: true, addressType: 'any' },
    mobile: { required: false, documents: [], addressRequired: false, addressType: 'none' },
  },
  IN: {
    local: { required: true, documents: ['business_registration', 'identity_proof'], addressRequired: true, addressType: 'local' },
    tollfree: { required: true, documents: ['business_registration', 'identity_proof'], addressRequired: true, addressType: 'local' },
    mobile: { required: true, documents: ['identity_proof', 'address_proof'], addressRequired: true, addressType: 'local' },
  },
  GB: {
    local: { required: false, documents: [], addressRequired: false, addressType: 'none' },
    tollfree: { required: true, documents: ['business_registration'], addressRequired: false, addressType: 'any' },
    mobile: { required: false, documents: [], addressRequired: false, addressType: 'none' },
  },
  CA: {
    local: { required: false, documents: [], addressRequired: false, addressType: 'none' },
    tollfree: { required: true, documents: ['business_registration'], addressRequired: true, addressType: 'local' },
    mobile: { required: false, documents: [], addressRequired: false, addressType: 'none' },
  },
  AU: {
    local: { required: false, documents: [], addressRequired: false, addressType: 'none' },
    tollfree: { required: true, documents: ['business_registration'], addressRequired: false, addressType: 'any' },
    mobile: { required: false, documents: [], addressRequired: false, addressType: 'none' },
  },
  DE: {
    local: { required: true, documents: ['identity_proof'], addressRequired: true, addressType: 'local' },
    tollfree: { required: true, documents: ['business_registration'], addressRequired: true, addressType: 'local' },
    mobile: { required: true, documents: ['identity_proof'], addressRequired: true, addressType: 'local' },
  },
};

/**
 *
 */
function isTwilioConfigured(): boolean {
  return !!(TWILIO_MAIN_SID && TWILIO_MAIN_TOKEN);
}

/**
 *
 */
function getTwilioClient(subaccountSid?: string): Twilio.Twilio {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio credentials not configured');
  }
  return Twilio(TWILIO_MAIN_SID!, TWILIO_MAIN_TOKEN!, {
    accountSid: subaccountSid || TWILIO_MAIN_SID
  });
}

/**
 *
 */
async function getOrCreateTwilioSubaccount(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { twilioSubaccountSid: true, name: true },
  });

  if (workspace?.twilioSubaccountSid) {
    return workspace.twilioSubaccountSid;
  }

  if (!isTwilioConfigured()) {
    throw new Error('Twilio credentials not configured');
  }

  const client = getTwilioClient();

  const subaccount = await client.api.v2010.accounts.create({
    friendlyName: `CareOps-${workspace?.name?.slice(0, 20) || workspaceId.slice(0, 8)}`,
  });

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { twilioSubaccountSid: subaccount.sid },
  });

  return subaccount.sid;
}

/**
 *
 */
async function searchAvailableNumbers(options: {
  countryCode: string;
  areaCode?: string;
  pattern?: string;
  numberType?: 'local' | 'tollfree' | 'mobile';
  limit?: number;
}): Promise<AvailableNumber[]> {
  if (!isTwilioConfigured()) {
    return getMockNumbers(options.countryCode);
  }

  const client = getTwilioClient();
  const { countryCode, areaCode, pattern, numberType = 'local', limit = 20 } = options;

  const searchOptions: Record<string, unknown> = {
    limit,
    voiceEnabled: true,
    smsEnabled: true,
  };

  if (areaCode) searchOptions.areaCode = areaCode;
  if (pattern) searchOptions.contains = pattern;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let availableNumbers: any[] = [];

    if (numberType === 'tollfree') {
      availableNumbers = await client.availablePhoneNumbers(countryCode)
        .tollFree.list(searchOptions);
    } else if (numberType === 'mobile' && countryCode !== 'US') {
      availableNumbers = await client.availablePhoneNumbers(countryCode)
        .mobile.list(searchOptions);
    } else {
      availableNumbers = await client.availablePhoneNumbers(countryCode)
        .local.list(searchOptions);
    }

    return availableNumbers.map((n) => ({
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName || n.phoneNumber,
      locality: n.locality || '',
      region: n.region || '',
      isoCountry: n.isoCountry || countryCode,
      capabilities: {
        voice: n.capabilities?.voice ?? true,
        sms: n.capabilities?.sms ?? true,
        mms: n.capabilities?.mms ?? false,
      },
      monthlyCost: getMonthlyCost(countryCode, numberType),
      numberType,
    }));
  } catch (error) {
    console.error('[Twilio:Search] Error:', error);
    return getMockNumbers(countryCode);
  }
}

/**
 *
 */
function getMonthlyCost(country: string, type: string): number {
  return NUMBER_COSTS[country]?.[type] || 3.00;
}

/**
 *
 */
function getMockNumbers(countryCode: string): AvailableNumber[] {
  const mockData: Record<string, AvailableNumber[]> = {
    US: [
      { phoneNumber: '+1 (415) 555-0101', friendlyName: '+1 (415) 555-0101', locality: 'San Francisco', region: 'CA', isoCountry: 'US', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
      { phoneNumber: '+1 (415) 555-0102', friendlyName: '+1 (415) 555-0102', locality: 'San Francisco', region: 'CA', isoCountry: 'US', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
      { phoneNumber: '+1 (650) 555-0103', friendlyName: '+1 (650) 555-0103', locality: 'Palo Alto', region: 'CA', isoCountry: 'US', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
      { phoneNumber: '+1 (212) 555-0104', friendlyName: '+1 (212) 555-0104', locality: 'New York', region: 'NY', isoCountry: 'US', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
      { phoneNumber: '+1 (310) 555-0105', friendlyName: '+1 (310) 555-0105', locality: 'Los Angeles', region: 'CA', isoCountry: 'US', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
    ],
    IN: [
      { phoneNumber: '+91 22 5555 0101', friendlyName: '+91 22 5555 0101', locality: 'Mumbai', region: 'MH', isoCountry: 'IN', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 4.00, numberType: 'mobile' },
      { phoneNumber: '+91 11 5555 0102', friendlyName: '+91 11 5555 0102', locality: 'Delhi', region: 'DL', isoCountry: 'IN', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 4.00, numberType: 'mobile' },
      { phoneNumber: '+91 80 5555 0103', friendlyName: '+91 80 5555 0103', locality: 'Bangalore', region: 'KA', isoCountry: 'IN', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 4.00, numberType: 'mobile' },
      { phoneNumber: '+91 44 5555 0104', friendlyName: '+91 44 5555 0104', locality: 'Chennai', region: 'TN', isoCountry: 'IN', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 4.00, numberType: 'mobile' },
    ],
    GB: [
      { phoneNumber: '+44 20 7555 0101', friendlyName: '+44 20 7555 0101', locality: 'London', region: 'England', isoCountry: 'GB', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 0.50, numberType: 'local' },
      { phoneNumber: '+44 161 555 0102', friendlyName: '+44 161 555 0102', locality: 'Manchester', region: 'England', isoCountry: 'GB', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 0.50, numberType: 'local' },
    ],
    CA: [
      { phoneNumber: '+1 (416) 555-0101', friendlyName: '+1 (416) 555-0101', locality: 'Toronto', region: 'ON', isoCountry: 'CA', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
      { phoneNumber: '+1 (604) 555-0102', friendlyName: '+1 (604) 555-0102', locality: 'Vancouver', region: 'BC', isoCountry: 'CA', capabilities: { voice: true, sms: true, mms: true }, monthlyCost: 1.00, numberType: 'local' },
    ],
    AU: [
      { phoneNumber: '+61 2 5555 0101', friendlyName: '+61 2 5555 0101', locality: 'Sydney', region: 'NSW', isoCountry: 'AU', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 1.50, numberType: 'local' },
      { phoneNumber: '+61 3 5555 0102', friendlyName: '+61 3 5555 0102', locality: 'Melbourne', region: 'VIC', isoCountry: 'AU', capabilities: { voice: true, sms: true, mms: false }, monthlyCost: 1.50, numberType: 'local' },
    ],
  };

  return mockData[countryCode] || mockData.US;
}

/**
 *
 */
function getRegulatoryRequirements(country: string, numberType: string): RegulatoryRequirement {
  return REGULATORY_REQUIREMENTS[country]?.[numberType] || {
    required: false,
    documents: [],
    addressRequired: false,
    addressType: 'none',
  };
}

/**
 *
 */
async function purchasePhoneNumber(options: {
  workspaceId: string;
  phoneNumber: string;
  friendlyName?: string;
  agentId?: string;
}): Promise<{
  success: boolean;
  phoneNumber?: {
    id: string;
    phoneNumber: string;
    twilioPhoneSid: string;
    vapiPhoneId?: string;
  };
  error?: string;
}> {
  const { workspaceId, phoneNumber: phoneNumberToPurchase, friendlyName, agentId } = options;

  try {
    const subaccountSid = await getOrCreateTwilioSubaccount(workspaceId);
    const twilio = getTwilioClient(subaccountSid);

    const purchased = await twilio.incomingPhoneNumbers.create({
      phoneNumber: phoneNumberToPurchase,
      friendlyName: friendlyName || `CareOps-${workspaceId.slice(0, 8)}`,
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/webhook`,
      voiceMethod: 'POST',
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
      statusCallbackMethod: 'POST',
    });

    let vapiPhoneId: string | undefined;

    if (agentId) {
      const agent = await prisma.voiceAgent.findFirst({
        where: { id: agentId, workspaceId },
        select: { vapiAssistantId: true },
      });

      if (agent?.vapiAssistantId) {
        try {
          const apiKey = process.env.VAPI_API_KEY;
          if (apiKey) {
            const response = await fetch('https://api.vapi.ai/phone-number/import/twilio', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                twilioPhoneNumberSid: purchased.sid,
                assistantId: agent.vapiAssistantId,
                serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/tools`,
                serverHeaders: { 'X-Workspace-Id': workspaceId },
              }),
            });

            if (response.ok) {
              const vapiData = await response.json();
              vapiPhoneId = vapiData.id;
            }
          }
        } catch (vapiError) {
          console.error('[Vapi:Import] Warning:', vapiError);
        }
      }
    }

    const phoneNumberRecord = await prisma.phoneNumber.create({
      data: {
        phoneNumber: phoneNumberToPurchase,
        label: friendlyName || 'Main Number',
        twilioPhoneSid: purchased.sid,
        vapiPhoneId,
        workspaceId,
        voiceAgentId: agentId,
        isActive: true,
      },
    });

    return {
      success: true,
      phoneNumber: {
        id: phoneNumberRecord.id,
        phoneNumber: phoneNumberRecord.phoneNumber,
        twilioPhoneSid: purchased.sid,
        vapiPhoneId,
      },
    };
  } catch (error) {
    console.error('[Twilio:Purchase] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to purchase phone number',
    };
  }
}

/**
 *
 */
async function releasePhoneNumber(options: {
  workspaceId: string;
  phoneNumberId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { workspaceId, phoneNumberId } = options;

  try {
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { id: phoneNumberId, workspaceId },
    });

    if (!phoneNumber) {
      return { success: false, error: 'Phone number not found' };
    }

    if (phoneNumber.twilioPhoneSid) {
      try {
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { twilioSubaccountSid: true },
        });

        const twilio = getTwilioClient(workspace?.twilioSubaccountSid || undefined);
        await twilio.incomingPhoneNumbers(phoneNumber.twilioPhoneSid).remove();
      } catch (twilioError) {
        console.error('[Twilio:Release] Warning:', twilioError);
      }
    }

    if (phoneNumber.vapiPhoneId) {
      try {
        const apiKey = process.env.VAPI_API_KEY;
        if (apiKey) {
          await fetch(`https://api.vapi.ai/phone-number/${phoneNumber.vapiPhoneId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${apiKey}` },
          });
        }
      } catch (vapiError) {
        console.error('[Vapi:Delete] Warning:', vapiError);
      }
    }

    await prisma.phoneNumber.delete({
      where: { id: phoneNumberId },
    });

    return { success: true };
  } catch (error) {
    console.error('[PhoneNumber:Release] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release phone number',
    };
  }
}

/**
 *
 */
async function getWorkspacePhoneNumbers(workspaceId: string): Promise<{
  total: number;
  numbers: Array<{
    id: string;
    phoneNumber: string;
    label: string | null;
    isActive: boolean;
    country: string;
    monthlyCost: number;
    voiceAgent: { id: string; name: string } | null;
  }>;
}> {
  const numbers = await prisma.phoneNumber.findMany({
    where: { workspaceId },
    include: {
      voiceAgent: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    total: numbers.length,
    numbers: numbers.map((n) => ({
      id: n.id,
      phoneNumber: n.phoneNumber,
      label: n.label,
      isActive: n.isActive,
      country: n.phoneNumber.startsWith('+91') ? 'IN' :
        n.phoneNumber.startsWith('+44') ? 'GB' :
          n.phoneNumber.startsWith('+1') && n.phoneNumber.length === 12 ?
            (n.phoneNumber.startsWith('+1 (416)') || n.phoneNumber.startsWith('+1604') ? 'CA' : 'US') :
            n.phoneNumber.startsWith('+61') ? 'AU' : 'US',
      monthlyCost: n.monthlyFee || 150,
      voiceAgent: n.voiceAgent,
    })),
  };
}

export const twilioPlatform = {
  isConfigured: isTwilioConfigured,
  getClient: getTwilioClient,
  getOrCreateSubaccount: getOrCreateTwilioSubaccount,
  searchNumbers: searchAvailableNumbers,
  purchaseNumber: purchasePhoneNumber,
  releaseNumber: releasePhoneNumber,
  getNumbers: getWorkspacePhoneNumbers,
  getRegulatoryRequirements,
  getMonthlyCost,
};

export {
  isTwilioConfigured,
  getTwilioClient,
  getOrCreateTwilioSubaccount,
  searchAvailableNumbers,
  purchasePhoneNumber,
  releasePhoneNumber,
  getWorkspacePhoneNumbers,
  getRegulatoryRequirements,
  getMonthlyCost,
};


