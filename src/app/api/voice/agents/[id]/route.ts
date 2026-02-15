import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('[VoiceAgent:GET:Id] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice agent' },
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
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.voiceAgent.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 });
    }

    const {
      name,
      description,
      isActive,
      prompt,
      voiceId,
      greeting,
      canBook,
      canCheckStatus,
      canTransfer,
      canHandleInquiry,
      tools,
    } = body;

    const agent = await prisma.voiceAgent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(prompt !== undefined && { prompt }),
        ...(voiceId !== undefined && { voiceId }),
        ...(greeting !== undefined && { greeting }),
        ...(canBook !== undefined && { canBook }),
        ...(canCheckStatus !== undefined && { canCheckStatus }),
        ...(canTransfer !== undefined && { canTransfer }),
        ...(canHandleInquiry !== undefined && { canHandleInquiry }),
        ...(tools && { tools: JSON.stringify(tools) }),
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error('[VoiceAgent:PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update voice agent' },
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
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.voiceAgent.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Voice agent not found' }, { status: 404 });
    }

    await prisma.voiceAgent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[VoiceAgent:DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice agent' },
      { status: 500 }
    );
  }
}
