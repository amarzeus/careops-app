import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

async function ContactsTable() {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) redirect("/login");

  const contacts = await prisma.contact.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
    }
  });

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-gray-50 border-dashed h-[400px]">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <UserIcon className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No contacts yet</h3>
        <p className="max-w-sm mt-2 text-sm text-gray-500 mb-6">
          Contacts will appear here when they book a service or fill out a form. You can also add them manually.
        </p>
        <CreateContactDialog
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add First Contact
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Bookings</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{contact.name}</span>
                    {contact.notes && (
                      <span className="text-xs text-gray-400 truncate max-w-[150px]">{contact.notes}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-3 h-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                  {contact.source}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{contact._count.bookings}</span>
                  <span className="text-gray-500 text-xs">bookings</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {format(new Date(contact.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <CreateContactDialog
                  initialData={contact}
                  trigger={
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/**
 *
 */
export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your customer database and view their history.
          </p>
        </div>
        <CreateContactDialog
          trigger={
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          }
        />
      </div>

      <Suspense fallback={<div>Loading contacts...</div>}>
        <ContactsTable />
      </Suspense>
    </div>
  );
}
