"use client";

import { Booking, Contact, Service } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, cn } from "@/lib/utils";
import { MoreHorizontal, CalendarX, Clock } from "lucide-react";
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

/**
 *
 * @param root0
 * @param root0.bookings
 * @param root0.onStatusUpdate
 * @param root0.onEdit
 */
export function BookingList({ bookings, onStatusUpdate, onEdit }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed text-center animate-in fade-in-50 bg-muted/30">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm border border-border/40">
          <CalendarX className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">No bookings found</h3>
        <p className="mt-1 text-[11px] text-muted-foreground max-w-[200px]">
          There are no bookings matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-background shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="py-2.5 h-auto font-bold text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Date & Time</TableHead>
              <TableHead className="py-2.5 h-auto font-bold text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Service</TableHead>
              <TableHead className="py-2.5 h-auto font-bold text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Contact</TableHead>
              <TableHead className="py-2.5 h-auto font-bold text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right py-2.5 h-auto font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} className="group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-xs">{formatDate(booking.date)}</span>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <Clock className="w-3 h-3 opacity-60" />
                      <span>
                        {formatTime(booking.date)} — {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0" />
                    <span className="font-semibold text-slate-700 text-xs">{booking.service.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-xs">{booking.contact.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-tight">
                      {booking.contact.email || booking.contact.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight uppercase border shadow-sm",
                    booking.status === "CONFIRMED" && "bg-blue-50 text-blue-700 border-blue-100",
                    booking.status === "PENDING" && "bg-amber-50 text-amber-700 border-amber-100",
                    booking.status === "COMPLETED" && "bg-emerald-50 text-emerald-700 border-emerald-100",
                    (booking.status === "CANCELLED" || booking.status === "NO_SHOW") && "bg-rose-50 text-rose-700 border-rose-100",
                  )}>
                    {booking.status.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="text-right py-2 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0 rounded-lg hover:bg-background hover:shadow-sm border border-transparent hover:border-border/40 transition-all">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-border/40">
                      <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 py-1.5">Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(booking)} className="text-[11px] font-bold cursor-pointer gap-2 focus:bg-muted/30 transition-colors">
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(booking.id, "CONFIRMED")} className="text-[11px] font-bold cursor-pointer gap-2 focus:bg-blue-50 focus:text-blue-700 transition-colors">
                        Confirm
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusUpdate(booking.id, "COMPLETED")} className="text-[11px] font-bold cursor-pointer gap-2 focus:bg-emerald-50 focus:text-emerald-700 transition-colors">
                        Complete
                      </DropdownMenuItem>
                      <div className="h-px bg-muted/50 my-1" />
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "NO_SHOW")}
                        className="text-rose-600 text-[11px] font-bold cursor-pointer gap-2 focus:bg-rose-50 transition-colors"
                      >
                        No-Show
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "CANCELLED")}
                        className="text-rose-600 text-[11px] font-bold cursor-pointer gap-2 focus:bg-rose-50 transition-colors"
                      >
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
