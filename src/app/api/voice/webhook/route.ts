import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processVapiWebhook } from '@/lib/vapi';
import { generateWebhookSignature } from '@/lib/webhook-security';

/**
 *
 * @param req
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get('x-vapi-signature');

    console.log('[VAPI:Webhook] Received event:', body.type, body.call_id);

    const { type, call_id, status, duration, recording_url, transcript, metadata } = body;

    if (!call_id) {
      console.warn('[VAPI:Webhook] No call_id in payload');
      return NextResponse.json({ error: 'Missing call_id' }, { status: 400 });
    }

    const workspaceId = metadata?.workspaceId as string | undefined;

    const processed = processVapiWebhook({
      type,
      call_id,
      status: status as never,
      duration,
      transcript,
      metadata,
    });

    console.log('[VAPI:Webhook] Processed:', processed);

    switch (processed.action) {
      case 'create':
        await prisma.voiceCall.upsert({
          where: { callSid: call_id },
          create: {
            callSid: call_id,
            direction: metadata?.contactPhone ? 'OUTBOUND' : 'INBOUND',
            status: processed.status,
            startedAt: new Date(),
            assistantId: metadata?.assistantId as string | undefined,
            contactId: metadata?.contactId as string | undefined,
            workspaceId: workspaceId || 'unknown',
            metadata: JSON.stringify(metadata || {}),
          },
          update: {
            status: processed.status,
            startedAt: new Date(),
          },
        });
        break;

      case 'update':
        await prisma.voiceCall.updateMany({
          where: { callSid: call_id },
          data: {
            status: processed.status,
          },
        });
        break;

      case 'end':
        await prisma.voiceCall.updateMany({
          where: { callSid: call_id },
          data: {
            status: processed.status,
            endedAt: new Date(),
            duration: duration || null,
            recordingUrl: recording_url || null,
            transcript: transcript || null,
          },
        });

        if (transcript && workspaceId && workspaceId !== 'unknown') {
          await prisma.alert.create({
            data: {
              type: 'voice_call',
              title: 'Voice Call Completed',
              message: `Call completed. Duration: ${duration || 0}s`,
              actionUrl: '/voice/calls',
              workspaceId,
            },
          });
        }
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[VAPI:Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 *
 * @param req
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'VAPI webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
