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
      <div className="animate-in fade-in-50 bg-muted/30 flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed text-center">
        <div className="bg-background border-border/40 mx-auto flex h-10 w-10 items-center justify-center rounded-full border shadow-sm">
          <CalendarX className="text-muted-foreground h-5 w-5" />
        </div>
        <h3 className="text-foreground mt-3 text-sm font-bold">No bookings found</h3>
        <p className="text-muted-foreground mt-1 max-w-[200px] text-[11px]">
          There are no bookings matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border/40 bg-background overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/40 border-b hover:bg-transparent">
              <TableHead className="text-muted-foreground h-auto py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Date & Time
              </TableHead>
              <TableHead className="text-muted-foreground h-auto py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Service
              </TableHead>
              <TableHead className="text-muted-foreground h-auto py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Contact
              </TableHead>
              <TableHead className="text-muted-foreground h-auto py-2.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Status
              </TableHead>
              <TableHead className="text-muted-foreground h-auto px-4 py-2.5 text-right text-[10px] font-bold tracking-widest whitespace-nowrap uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow
                key={booking.id}
                className="group hover:bg-muted/30 border-border/40 border-b transition-colors last:border-0"
              >
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs font-bold">
                      {formatDate(booking.date)}
                    </span>
                    <div className="text-muted-foreground flex items-center gap-1 text-[10px] font-medium">
                      <Clock className="h-3 w-3 opacity-60" />
                      <span>
                        {formatTime(booking.date)} — {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/40" />
                    <span className="text-xs font-semibold text-slate-700">
                      {booking.service.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="text-foreground text-xs font-bold">
                      {booking.contact.name}
                    </span>
                    <span className="text-muted-foreground text-[10px] font-medium tracking-tight">
                      {booking.contact.email || booking.contact.phone}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-black tracking-tight uppercase shadow-sm",
                      booking.status === "CONFIRMED" &&
                        "text-primary/90 border-blue-100 bg-blue-50",
                      booking.status === "PENDING" && "border-amber-100 bg-amber-50 text-amber-700",
                      booking.status === "COMPLETED" &&
                        "border-emerald-100 bg-emerald-50 text-emerald-700",
                      (booking.status === "CANCELLED" || booking.status === "NO_SHOW") &&
                        "border-rose-100 bg-rose-50 text-rose-700"
                    )}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:bg-background hover:border-border/40 h-7 w-7 rounded-lg border border-transparent p-0 transition-all hover:shadow-sm"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="text-muted-foreground h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-border/40 w-40 rounded-xl shadow-xl"
                    >
                      <DropdownMenuLabel className="text-muted-foreground px-3 py-1.5 text-[9px] font-black tracking-widest uppercase">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onEdit(booking)}
                        className="focus:bg-muted/30 cursor-pointer gap-2 text-[11px] font-bold transition-colors"
                      >
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "CONFIRMED")}
                        className="focus:text-primary/90 cursor-pointer gap-2 text-[11px] font-bold transition-colors focus:bg-blue-50"
                      >
                        Confirm
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "COMPLETED")}
                        className="cursor-pointer gap-2 text-[11px] font-bold transition-colors focus:bg-emerald-50 focus:text-emerald-700"
                      >
                        Complete
                      </DropdownMenuItem>
                      <div className="bg-muted/50 my-1 h-px" />
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "NO_SHOW")}
                        className="cursor-pointer gap-2 text-[11px] font-bold text-rose-600 transition-colors focus:bg-rose-50"
                      >
                        No-Show
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onStatusUpdate(booking.id, "CANCELLED")}
                        className="cursor-pointer gap-2 text-[11px] font-bold text-rose-600 transition-colors focus:bg-rose-50"
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
