"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Workspace {
    id: string;
    name: string;
    address?: string;
    services: {
        id: string;
        name: string;
        price: number;
        duration: number;
    }[];
}

/**
 *
 */
export default function SearchPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        try {
            const res = await fetch("/api/public/workspaces");
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data.workspaces || []);
            }
        } catch (_error) {
            console.error("Error fetching workspaces:", _error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkspaces = workspaces.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-gray-900">CareOps Directory</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Business Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button>List Your Business</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Search */}
            <div className="bg-blue-600 text-white py-16 px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">Find Local Services & Book Instantly</h1>
                <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
                    Browse top-rated businesses, check availability, and book appointments without signing up.
                </p>
                <div className="max-w-xl mx-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        className="pl-10 h-12 text-gray-900 bg-white border-none shadow-lg rounded-xl text-lg"
                        placeholder="Search by business name or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Results */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 py-12">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                ) : filteredWorkspaces.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWorkspaces.map((workspace) => (
                            <Card key={workspace.id} className="hover:shadow-lg transition-shadow border-gray-200 overflow-hidden flex flex-col">
                                <div className="h-32 bg-gray-100 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                    <Building2 className="w-12 h-12 text-gray-300" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl">{workspace.name}</CardTitle>
                                    {workspace.address && (
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {workspace.address}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <div className="space-y-3 mb-6 flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900">Available Services:</h4>
                                        {workspace.services.length > 0 ? (
                                            <ul className="space-y-2">
                                                {workspace.services.slice(0, 3).map((service) => (
                                                    <li key={service.id} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                        <span>{service.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="text-xs font-normal">${service.price}</Badge>
                                                        </div>
                                                    </li>
                                                ))}
                                                {workspace.services.length > 3 && (
                                                    <li className="text-xs text-blue-600 font-medium pl-1">
                                                        + {workspace.services.length - 3} more services
                                                    </li>
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No services listed yet.</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-auto pt-4 border-t">
                                        <Link href={`/ book / ${workspace.id} `} className="flex-1">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                Book Now
                                            </Button>
                                        </Link>
                                        <Link href={`/ contact / ${workspace.id} `} className="flex-1">
                                            <Button variant="outline" className="w-full">
                                                Contact
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No businesses found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                            Try adjusting your search terms or listed your own business to get started.
                        </p>
                        <Link href="/register">
                            <Button className="mt-6" variant="outline">List Your Business</Button>
                        </Link>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t py-8 text-center text-gray-500 text-sm">
                <p>&copy; 2026 CareOps Directory. All rights reserved.</p>
            </footer>
        </div>
    );
}
