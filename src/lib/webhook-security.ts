import crypto from 'crypto';

/**
 * Webhook Security Utilities
 * Provides HMAC signature generation and verification for secure webhook delivery
 */

/**
 * Generate HMAC-SHA256 signature for webhook payload
 * @param payload - JSON string of the webhook payload
 * @param secret - Webhook secret key
 * @returns Hex-encoded signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC-SHA256 signature from incoming webhook
 * Uses timing-safe comparison to prevent timing attacks
 * @param payload - Raw payload string
 * @param signature - Signature from X-Webhook-Signature header
 * @param secret - Webhook secret key
 * @returns Boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expected = generateWebhookSignature(payload, secret);
    
    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch (error) {
    console.error('[Webhook Security] Signature verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random secret for new webhooks
 * @returns Random hex string
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create webhook payload with standard structure
 */
export interface WebhookPayload {
  event: string;
  workspaceId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Serialize payload for signing (ensures consistent formatting)
 * @param payload
 */
export function serializePayload(payload: WebhookPayload): string {
  // Use deterministic JSON stringify (sorted keys)
  return JSON.stringify(payload, Object.keys(payload).sort());
}