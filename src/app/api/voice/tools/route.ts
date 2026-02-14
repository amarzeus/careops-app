import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBookingConfirmation } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool, parameters, workspaceId, callId } = body;

    if (!tool || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, workspaceId' },
        { status: 400 }
      );
    }

    console.log(`[VoiceTools] Executing tool: ${tool}`, parameters);

    let result: { success: boolean; data?: unknown; error?: string };

    switch (tool) {
      case 'get_services':
        result = await handleGetServices(workspaceId);
        break;

      case 'check_availability':
        result = await handleCheckAvailability(workspaceId, parameters);
        break;

      case 'create_booking':
        result = await handleCreateBooking(workspaceId, parameters, callId);
        break;

      case 'get_booking_status':
        result = await handleGetBookingStatus(workspaceId, parameters);
        break;

      case 'get_business_hours':
        result = await handleGetBusinessHours(workspaceId);
        break;

      case 'transfer_to_staff':
        result = await handleTransferToStaff(workspaceId, parameters);
        break;

      default:
        result = { success: false, error: `Unknown tool: ${tool}` };
    }

    if (callId && workspaceId) {
      await prisma.voiceCall.updateMany({
        where: { id: callId },
        data: {
          metadata: JSON.stringify({ lastTool: tool, lastToolResult: result }),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[VoiceTools] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Tool execution failed' },
      { status: 500 }
    );
  }
}

async function handleGetServices(workspaceId: string) {
  const services = await prisma.service.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      location: true,
    },
  });

  return {
    success: true,
    data: services,
  };
}

async function handleCheckAvailability(workspaceId: string, params: { serviceId?: string; date?: string }) {
  const { serviceId, date } = params;

  if (!serviceId || !date) {
    return { success: false, error: 'serviceId and date are required' };
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      workspaceId,
      isActive: true,
    },
  });

  if (!service) {
    return { success: false, error: 'Service not found' };
  }

  const availableDays = service.availableDays.split(',').map(Number);
  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.getDay();

  if (!availableDays.includes(dayOfWeek)) {
    return {
      success: true,
      data: {
        available: false,
        reason: `${service.name} is not available on ${requestedDate.toLocaleDateString('en-US', { weekday: 'long' })}`,
      },
    };
  }

  const startTime = service.startTime;
  const endTime = service.endTime;
  const duration = service.duration;

  const existingBookings = await prisma.booking.findMany({
    where: {
      serviceId,
      date: {
        gte: new Date(`${date}T00:00:00`),
        lt: new Date(`${date}T23:59:59`),
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    select: {
      date: true,
    },
  });

  const bookedTimes = existingBookings.map((b) => b.date.getHours());

  const availableSlots: string[] = [];
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);

  for (let hour = startHour; hour < endHour; hour++) {
    if (!bookedTimes.includes(hour)) {
      availableSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (duration > 30 && hour + 1 < endHour) {
        availableSlots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
  }

  return {
    success: true,
    data: {
      available: availableSlots.length > 0,
      date,
      serviceName: service.name,
      slots: availableSlots,
    },
  };
}

async function handleCreateBooking(
  workspaceId: string,
  params: {
    serviceId?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    date?: string;
    time?: string;
    notes?: string;
  },
  callId?: string
) {
  const { serviceId, contactName, contactPhone, contactEmail, date, time, notes } = params;

  if (!serviceId || !contactName || !contactPhone || !date || !time) {
    return { success: false, error: 'Missing required booking fields' };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, workspaceId, isActive: true },
    include: { workspace: true },
  });

  if (!service) {
    return { success: false, error: 'Service not found' };
  }

  let contact = await prisma.contact.findFirst({
    where: { phone: contactPhone, workspaceId },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        source: 'voice',
        workspaceId,
      },
    });
  }

  const [hours, minutes] = time.split(':').map(Number);
  const bookingDate = new Date(date);
  bookingDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(bookingDate);
  endDate.setMinutes(endDate.getMinutes() + service.duration);

  const booking = await prisma.booking.create({
    data: {
      date: bookingDate,
      endTime: endDate,
      status: 'CONFIRMED',
      serviceId,
      contactId: contact.id,
      workspaceId,
      notes: notes || `Booked via voice call${callId ? ` (Call ID: ${callId})` : ''}`,
    },
  });

  if (callId) {
    await prisma.voiceCall.update({
      where: { id: callId },
      data: {
        outcome: 'BOOKING_CREATED',
        contactId: contact.id,
      },
    });
  }

  return {
    success: true,
    data: {
      bookingId: booking.id,
      date: bookingDate.toISOString(),
      serviceName: service.name,
      contactName,
    },
  };
}

async function handleGetBookingStatus(workspaceId: string, params: { bookingId?: string; phone?: string }) {
  const { bookingId, phone } = params;

  let booking;

  if (bookingId) {
    booking = await prisma.booking.findFirst({
      where: { id: bookingId, workspaceId },
      include: { service: true, contact: true },
    });
  } else if (phone) {
    const contact = await prisma.contact.findFirst({
      where: { phone, workspaceId },
    });

    if (contact) {
      booking = await prisma.booking.findFirst({
        where: {
          contactId: contact.id,
          workspaceId,
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        include: { service: true },
      });
    }
  }

  if (!booking) {
    return { success: false, error: 'No upcoming bookings found' };
  }

  return {
    success: true,
    data: {
      bookingId: booking.id,
      status: booking.status,
      serviceName: booking.service.name,
      date: booking.date.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  };
}

async function handleGetBusinessHours(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  const services = await prisma.service.findMany({
    where: { workspaceId, isActive: true },
    select: {
      name: true,
      availableDays: true,
      startTime: true,
      endTime: true,
      location: true,
    },
    take: 5,
  });

  return {
    success: true,
    data: {
      timezone: workspace?.timezone || 'UTC',
      services,
    },
  };
}

async function handleTransferToStaff(workspaceId: string, params: { staffName?: string; reason?: string }) {
  const { staffName, reason } = params;

  const staff = await prisma.user.findFirst({
    where: {
      workspaceId,
      name: { contains: staffName || '', mode: 'insensitive' },
      role: 'STAFF',
    },
  });

  if (!staff) {
    await prisma.alert.create({
      data: {
        type: 'voice_call',
        title: 'Voice Call Transfer Request',
        message: `Transfer requested to "${staffName}". Reason: ${reason || 'Not provided'}`,
        actionUrl: '/voice/calls',
        workspaceId,
      },
    });

    return {
      success: true,
      data: {
        transferred: false,
        message: 'Transfer request sent. A staff member will call you back shortly.',
      },
    };
  }

  return {
    success: true,
    data: {
      transferred: true,
      staffName: staff.name,
      staffEmail: staff.email,
    },
  };
}
