const FRUSTRATION_PATTERNS = [
  /representative/i,
  /human/i,
  /agent/i,
  /this is (?:useless|frustrating)/i,
  /not helping/i,
  /speak to (?:someone|person)/i,
  /angry/i,
  /upset/i,
  /cancel this/i,
  /terrible/i,
];

export interface ConsentDecision {
  provided: boolean;
  granted: boolean;
  text: string;
  raw: string;
}

/**
 * Normalizes a phone number for voice compliance (E.164).
 * @param phone - The input phone number
 * @returns Normalized phone number string
 */
export function normalizeVoicePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return phone.startsWith("+") ? `+${digits}` : `+${digits}`;
}

/**
 * Parses raw metadata into a structured object.
 * @param raw - The raw metadata (string or object)
 * @returns Parsed metadata record
 */
export function parseVoiceMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }

  if (typeof raw === "object") {
    return raw as Record<string, unknown>;
  }

  return {};
}

/**
 * Serializes metadata for storage/transmission.
 * @param metadata - The metadata object
 * @returns JSON string of metadata
 */
export function serializeVoiceMetadata(metadata: Record<string, unknown>): string {
  return JSON.stringify(metadata);
}

/**
 * Normalizes voice status strings.
 * @param value - The raw status string
 * @returns Normalized uppercase status
 */
export function normalizeVoiceStatus(value: string | undefined): string {
  if (!value) {
    return "UNKNOWN";
  }

  return value.replace(/-/g, "_").toUpperCase();
}

/**
 * Detects frustration in a transcript.
 * @param transcript - The call transcript
 * @returns True if frustration detected
 */
export function detectFrustration(transcript: string | null | undefined): boolean {
  if (!transcript) {
    return false;
  }

  return FRUSTRATION_PATTERNS.some((pattern) => pattern.test(transcript));
}

/**
 * Extracts consent decision from payload and metadata.
 * @param payload - The webhook payload
 * @param metadata - The call metadata
 * @returns Consent decision object
 */
export function extractConsentDecision(
  payload: Record<string, unknown>,
  metadata: Record<string, unknown>
): ConsentDecision {
  const candidates: unknown[] = [
    payload.consent,
    payload.recordingConsent,
    payload.recording_consent,
    metadata.consent,
    metadata.consentGiven,
    metadata.recordingConsent,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "boolean") {
      return {
        provided: true,
        granted: candidate,
        text:
          (typeof metadata.consentText === "string" && metadata.consentText) ||
          "For quality purposes, this call may be recorded. Is that okay?",
        raw: candidate ? "true" : "false",
      };
    }

    if (typeof candidate === "string") {
      const normalized = candidate.trim().toLowerCase();
      if (["yes", "y", "true", "granted", "allow"].includes(normalized)) {
        return {
          provided: true,
          granted: true,
          text:
            (typeof metadata.consentText === "string" && metadata.consentText) ||
            "For quality purposes, this call may be recorded. Is that okay?",
          raw: candidate,
        };
      }

      if (["no", "n", "false", "denied", "deny"].includes(normalized)) {
        return {
          provided: true,
          granted: false,
          text:
            (typeof metadata.consentText === "string" && metadata.consentText) ||
            "For quality purposes, this call may be recorded. Is that okay?",
          raw: candidate,
        };
      }
    }
  }

  return {
    provided: false,
    granted: false,
    text: "",
    raw: "",
  };
}

/**
 * Checks if the current time is after business hours.
 * @param timezone - The timezone to check against
 * @param now - Current date (default: now)
 * @param startHour - Start of business hours (default: 9)
 * @param endHour - End of business hours (default: 17)
 * @returns True if after hours
 */
export function isAfterHours(
  timezone: string | null | undefined,
  now: Date = new Date(),
  startHour = 9,
  endHour = 17
): boolean {
  const tz = timezone || "UTC";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  });

  const formattedHour = formatter.format(now);
  const hour = Number.parseInt(formattedHour, 10);

  if (Number.isNaN(hour)) {
    return false;
  }

  return hour < startHour || hour >= endHour;
}
