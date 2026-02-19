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
          <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
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
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground">
          {searchQuery ? "No contacts found" : "No contacts yet"}
        </h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Info</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bookings</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((contact) => (
            <TableRow key={contact.id} className="group transition-colors hover:bg-muted/30">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-50 text-xs font-semibold text-blue-700">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
                    {contact.notes && (
                      <p className="truncate text-xs text-muted-foreground max-w-[160px]">{contact.notes}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {contact.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span className="truncate max-w-[200px]">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize font-medium text-xs">
                  {contact.source.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm font-semibold text-foreground">{contact._count.bookings}</span>
                <span className="ml-1 text-xs text-muted-foreground">bookings</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(contact.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <CreateContactDialog
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  initialData={contact as any}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100">
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
            <Button size="sm" className="h-9 gap-2 bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          }
        />
      </Header>

      <div className="mx-auto w-full max-w-screen-xl flex-1 p-4 sm:p-6">
        {/* Search bar + stats summary */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 bg-background pl-9 text-sm"
              placeholder="Search by name, email, phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {!loading && (
            <p className="shrink-0 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{contacts.length}</span> total contacts
            </p>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading contacts...</div>}>
            <ContactsTable contacts={contacts} searchQuery={searchQuery} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
