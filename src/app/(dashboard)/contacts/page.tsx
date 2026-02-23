"use client";

import { Suspense, useEffect, useState } from "react";
import { Plus, Mail, Phone, Search, Users } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  notes: string | null;
  createdAt: string;
  _count: { bookings: number };
}

/**
 *
 */
function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-12" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 *
 */
function ContactsTable({ contacts, searchQuery }: { contacts: Contact[]; searchQuery: string }) {
  const filtered = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return (
      <div className="border-border bg-muted/30 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
        <div className="bg-muted mb-3 flex h-12 w-12 items-center justify-center rounded-full">
          <Users className="text-muted-foreground h-5 w-5" />
        </div>
        <h3 className="text-foreground text-sm font-medium">
          {searchQuery ? "No contacts found" : "No contacts yet"}
        </h3>
        <p className="text-muted-foreground mt-1 max-w-7xl text-sm">
          {searchQuery
            ? `No results for "${searchQuery}"`
            : "Contacts appear here when they book or fill out a form. You can also add them manually."}
        </p>
        {!searchQuery && (
          <div className="mt-4">
            <CreateContactDialog
              trigger={
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add First Contact
                </Button>
              }
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Name
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Contact Info
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Source
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Bookings
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Joined
            </TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-semibold tracking-wide uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((contact) => (
            <TableRow key={contact.id} className="group hover:bg-muted/30 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-primary/90 bg-blue-50 text-xs font-semibold">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{contact.name}</p>
                    {contact.notes && (
                      <p className="text-muted-foreground max-w-[160px] truncate text-xs">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-muted-foreground flex flex-col gap-0.5 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="text-muted-foreground/60 h-3 w-3 shrink-0" />
                      <span className="max-w-[200px] truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="text-muted-foreground/60 h-3 w-3 shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs font-medium capitalize">
                  {contact.source.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-foreground text-sm font-semibold">
                  {contact._count.bookings}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">bookings</span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(contact.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <CreateContactDialog
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  initialData={contact as any}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100"
                    >
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

/**
 *
 */
export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/contacts");
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
        }
      } catch (_err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <Header title="Contacts" subtitle="Manage your customer database and history">
        <CreateContactDialog
          trigger={
            <Button size="sm" className="bg-primary hover:bg-primary/90 h-9 gap-2 text-white">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          }
        />
      </Header>

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        {/* Search bar + stats summary */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-7xl flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              className="bg-background h-9 pl-9 text-sm"
              placeholder="Search by name, email, phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!loading && (
            <p className="text-muted-foreground shrink-0 text-sm">
              <span className="text-foreground font-semibold">{contacts.length}</span> total
              contacts
            </p>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonRows />
              </TableBody>
            </Table>
          </div>
        ) : (
          <Suspense
            fallback={<div className="text-muted-foreground text-sm">Loading contacts...</div>}
          >
            <ContactsTable contacts={contacts} searchQuery={searchQuery} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
