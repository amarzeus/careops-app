import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isVapiConfigured } from '@/lib/vapi';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const where: Record<string, unknown> = {
      workspaceId: user.workspaceId,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const agents = await prisma.voiceAgent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('[VoiceAgent:GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isVapiConfigured()) {
      return NextResponse.json(
        { error: 'VAPI not configured. Please add VAPI_API_KEY to environment.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      prompt,
      voiceId,
      greeting,
      canBook,
      canCheckStatus,
      canTransfer,
      canHandleInquiry,
      tools,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const agent = await prisma.voiceAgent.create({
      data: {
        name,
        description,
        prompt,
        voiceId,
        greeting,
        canBook: canBook ?? false,
        canCheckStatus: canCheckStatus ?? false,
        canTransfer: canTransfer ?? false,
        canHandleInquiry: canHandleInquiry ?? true,
        tools: tools ? JSON.stringify(tools) : null,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('[VoiceAgent:POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice agent' },
      { status: 500 }
    );
  }
}
