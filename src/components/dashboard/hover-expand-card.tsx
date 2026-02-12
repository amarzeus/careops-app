"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface HoverExpandCardProps {
    title: string;
    icon: LucideIcon;
    count?: number;
    countLabel?: string;
    children: React.ReactNode;
    className?: string;
    headerColorClass?: string;
    iconColorClass?: string;
    previewText?: string; // Text to show in collapsed state
}

export function HoverExpandCard({
    title,
    icon: Icon,
    count,
    countLabel,
    children,
    className,
    headerColorClass = "text-gray-900",
    iconColorClass = "text-gray-600",
    previewText
}: HoverExpandCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        // Height placeholder to reserve space in the grid
        <div
            className={cn("relative h-[72px] transition-all z-10 hover:z-50", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card
                className={cn(
                    "absolute inset-x-0 top-0 border shadow-sm bg-white transition-all duration-300 ease-out origin-top",
                    isHovered ? "shadow-xl min-h-[72px] max-h-[400px]" : "h-[72px] overflow-hidden"
                )}
            >
                <CardHeader className="p-4 h-[72px] flex flex-row items-center justify-between space-y-0">
                    <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", headerColorClass)}>
                        <div className={cn("p-1.5 rounded-md bg-opacity-10", iconColorClass.replace('text-', 'bg-'))}>
                            <Icon className={cn("w-4 h-4", iconColorClass)} />
                        </div>
                        {title}
                    </CardTitle>

                    {count !== undefined && (
                        <div className="flex items-center gap-2">
                            {(!isHovered && previewText) && (
                                <span className="text-xs text-muted-foreground hidden sm:inline-block font-normal truncate max-w-[100px]">
                                    {previewText}
                                </span>
                            )}
                            <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full transition-colors",
                                count > 0
                                    ? (iconColorClass.includes('red') ? "bg-red-50 text-red-600" :
                                        iconColorClass.includes('amber') ? "bg-amber-50 text-amber-600" :
                                            iconColorClass.includes('violet') ? "bg-violet-50 text-violet-600" : "bg-gray-100 text-gray-700")
                                    : "bg-emerald-50 text-emerald-600"
                            )}>
                                {countLabel || count}
                            </span>
                        </div>
                    )}
                </CardHeader>

                {/* Expanded Content */}
                <div
                    className={cn(
                        "transition-all duration-300 ease-in-out px-4 pb-4 overflow-hidden grid",
                        isHovered ? "opacity-100 grid-rows-[1fr]" : "opacity-0 grid-rows-[0fr]"
                    )}
                >
                    <div className="min-h-0">
                        {children}
                    </div>
                </div>
            </Card>
        </div>
    );
}
