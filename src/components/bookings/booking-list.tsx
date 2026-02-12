"use client";

import { useState } from "react";
import { Booking, Contact, Service } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import { MoreHorizontal, CalendarCheck, CalendarX, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BookingWithRelations extends Booking {
  contact: Contact;
  service: Service;
}

interface BookingListProps {
  bookings: BookingWithRelations[];
  onStatusUpdate: (id: string, status: string) => void;
  onEdit: (booking: BookingWithRelations) => void;
}

export function BookingList({ bookings, onStatusUpdate, onEdit }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-md border border-dashed text-center animate-in fade-in-50">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarX className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No bookings found</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          There are no bookings matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{formatDate(booking.date)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(booking.date)} - {formatTime(booking.endTime)}
                  </span>
                </div>
              </TableCell>
              <TableCell>{booking.service.name}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{booking.contact.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {booking.contact.email || booking.contact.phone}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    booking.status === "CONFIRMED"
                      ? "default"
                      : booking.status === "COMPLETED"
                      ? "secondary" // secondary usually gray/purple, checking badge usage...
                      : booking.status === "CANCELLED" || booking.status === "NO_SHOW"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {booking.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(booking)}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusUpdate(booking.id, "CONFIRMED")}>
                      Confirm Booking
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusUpdate(booking.id, "COMPLETED")}>
                      Mark Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusUpdate(booking.id, "NO_SHOW")}
                      className="text-red-600"
                    >
                      Mark No-Show
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusUpdate(booking.id, "CANCELLED")}
                      className="text-red-600"
                    >
                      Cancel Booking
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
