"use client";

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
import { Edit2, Shield, Trash2, User } from "lucide-react";
import { StaffMemberDTO } from "@/types/dto";
import { format } from "date-fns";

interface StaffListProps {
    staff: StaffMemberDTO[];
    onEdit: (staff: StaffMemberDTO) => void;
    onDelete: (id: string) => void;
}

export function StaffList({ staff, onEdit, onDelete }: StaffListProps) {
    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">User</TableHead>
                        <TableHead className="whitespace-nowrap">Role</TableHead>
                        <TableHead className="whitespace-nowrap">Permissions</TableHead>
                        <TableHead className="whitespace-nowrap">Joined</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {staff.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span>{member.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {member.email}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {member.role === "OWNER" ? (
                                        <Shield className="h-4 w-4 text-purple-500" />
                                    ) : (
                                        <User className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="text-sm">
                                        {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {member.role === "OWNER" ? (
                                        <Badge variant="secondary">Full Access</Badge>
                                    ) : (
                                        <>
                                            {member.canAccessInbox && <Badge variant="outline">Inbox</Badge>}
                                            {member.canAccessBookings && <Badge variant="outline">Bookings</Badge>}
                                            {member.canAccessForms && <Badge variant="outline">Forms</Badge>}
                                            {member.canAccessInventory && <Badge variant="outline">Inventory</Badge>}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(member.createdAt), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                {member.role !== "OWNER" && (
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(member)}>
                                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(member.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {staff.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No staff members found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}