import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { endCall, getCallDetails, isVapiConfigured } from '@/lib/vapi';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const call = await prisma.voiceCall.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      include: {
        contact: true,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    let vapiDetails = null;
    if (call.callSid && isVapiConfigured()) {
      vapiDetails = await getCallDetails(call.callSid);
    }

    return NextResponse.json({
      ...call,
      vapiDetails,
    });
  } catch (error) {
    console.error('[Voice:Call:GET:Id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call' },
      { status: 500 }
    );
  }
}

/**
 *
 * @param req
 * @param root0
 * @param root0.params
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const call = await prisma.voiceCall.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    if (action === 'end' && call.callSid) {
      if (!isVapiConfigured()) {
        return NextResponse.json(
          { error: 'VAPI not configured' },
          { status: 503 }
        );
      }

      const result = await endCall(call.callSid);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to end call' },
          { status: 500 }
        );
      }

      await prisma.voiceCall.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'update-summary') {
      const { summary, outcome } = body;

      const updated = await prisma.voiceCall.update({
        where: { id },
        data: {
          ...(summary && { summary }),
          ...(outcome && { outcome }),
        },
      });

      return NextResponse.json(updated);
    }

    if (action === 'resolve-escalation') {
      const { note } = body;

      const updated = await prisma.voiceCall.update({
        where: { id },
        data: {
          escalated: false,
          escalationReason: null,
          outcome: 'ESCALATION_REVIEWED',
          ...(note
            ? {
                summary: note,
              }
            : {}),
        },
      });

      return NextResponse.json({ success: true, call: updated });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Voice:Call:POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process call action' },
      { status: 500 }
    );
  }
}
