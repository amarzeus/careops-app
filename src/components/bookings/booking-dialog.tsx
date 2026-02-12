"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Booking, Contact, Service } from "@prisma/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Need to ensure Form component exists
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// We need a form component. If shadcn/ui form doesn't exist, we'll implement inline.
// But usually it relies on react-hook-form + zod.
// I'll create the Form component wrapper as well if it's missing, but for now assuming it might be missing based on file list.
// File list showed `input`, `label` but not `form`.
// So I will implement the form fields manually using `Label` and `Input` to avoid missing component errors.

const formSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
  serviceId: z.string().min(1, "Service is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  contacts: Contact[];
  services: Service[];
  initialData?: Booking | null;
  initialDate?: Date;
}

export function BookingDialog({
  open,
  onOpenChange,
  onSubmit,
  contacts,
  services,
  initialData,
  initialDate,
}: BookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: initialData?.notes || "",
      contactId: initialData?.contactId || "",
      serviceId: initialData?.serviceId || "",
      time: initialData 
          ? format(new Date(initialData.date), "HH:mm") 
          : initialDate 
            ? format(initialDate, "HH:mm") 
            : "09:00",
      date: initialData 
          ? new Date(initialData.date) 
          : initialDate || new Date(),
    },
  });

  // Reset form when dialog opens or data changes
  useEffect(() => {
    if (open) {
      reset({
        notes: initialData?.notes || "",
        contactId: initialData?.contactId || "",
        serviceId: initialData?.serviceId || "",
        time: initialData 
            ? format(new Date(initialData.date), "HH:mm") 
            : initialDate 
              ? format(initialDate, "HH:mm") 
              : "09:00",
        date: initialData 
            ? new Date(initialData.date) 
            : initialDate || new Date(),
      });
    }
  }, [open, initialData, initialDate, reset]);

  const onFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDate = watch("date");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Booking" : "New Booking"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update booking details below."
              : "Create a new booking manually."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          
          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Contact
            </label>
            <Select
              onValueChange={(val) => setValue("contactId", val)}
              defaultValue={initialData?.contactId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name} ({contact.email || contact.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contactId && (
              <p className="text-sm font-medium text-destructive">{errors.contactId.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Service
            </label>
            <Select
              onValueChange={(val) => setValue("serviceId", val)}
              defaultValue={initialData?.serviceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm font-medium text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setValue("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm font-medium text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Time
              </label>
              <Input
                type="time"
                {...register("time")}
              />
              {errors.time && (
                <p className="text-sm font-medium text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Notes
            </label>
            <Textarea
              placeholder="Any special requests or notes..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
