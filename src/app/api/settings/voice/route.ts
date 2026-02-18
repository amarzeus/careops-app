import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkVapiHealth, getVapiStatus, isVapiConfigured } from '@/lib/vapi';

/**
 *
 * @param req
 */
export async function GET(_req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: {
        name: true,
        contactPhone: true,
      },
    });

    const vapiStatus = getVapiStatus();
    const vapiHealth = isVapiConfigured() ? await checkVapiHealth() : null;

    const voiceAgents = await prisma.voiceAgent.count({
      where: { workspaceId: user.workspaceId, isActive: true },
    });

    const phoneNumbers = await prisma.phoneNumber.count({
      where: { workspaceId: user.workspaceId, isActive: true },
    });

    const recentCalls = await prisma.voiceCall.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        direction: true,
        status: true,
        duration: true,
        outcome: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      workspace: {
        name: workspace?.name,
        contactPhone: workspace?.contactPhone,
      },
      vapi: {
        configured: vapiStatus.configured,
        apiKeyPresent: vapiStatus.apiKeyPresent,
        clientInitialized: vapiStatus.clientInitialized,
        health: vapiHealth,
      },
      voice: {
        activeAgents: voiceAgents,
        activePhoneNumbers: phoneNumbers,
        recentCalls,
      },
    });
  } catch (error) {
    console.error('[Voice:Settings:GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice settings' },
      { status: 500 }
    );
  }
}

/**
 *
 * @param req
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only workspace owners can configure voice settings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { voiceAgentId, _phoneNumberId, action } = body;

    if (action === 'test') {
      const vapiHealth = await checkVapiHealth();
      return NextResponse.json({
        success: vapiHealth.healthy,
        message: vapiHealth.healthy
          ? 'VAPI connection successful'
          : `VAPI connection failed: ${vapiHealth.error}`,
        health: vapiHealth,
      });
    }

    if (action === 'activate_voice' || action === 'deactivate_voice') {
      const isActive = action === 'activate_voice';

      if (voiceAgentId) {
        await prisma.voiceAgent.update({
          where: { id: voiceAgentId },
          data: { isActive },
        });
      }

      return NextResponse.json({
        success: true,
        message: isActive
          ? 'Voice agent activated'
          : 'Voice agent deactivated',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Voice:Settings:POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update voice settings' },
      { status: 500 }
    );
  }
}
