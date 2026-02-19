"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.icon
 * @param root0.count
 * @param root0.countLabel
 * @param root0.children
 * @param root0.className
 * @param root0.headerColorClass
 * @param root0.iconColorClass
 * @param root0.previewText
 */
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
            className={cn("relative h-[72px] z-10 hover:z-50", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                layout
                initial={false}
                animate={{
                    height: isHovered ? "auto" : 72,
                    boxShadow: isHovered ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" : "0 1px 2px 0 rgb(0 0 0 / 0.05)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "absolute inset-x-0 top-0 border bg-white rounded-xl overflow-hidden",
                    // We handle height and shadow via motion, but keep base styles
                )}
            >
                <div className="p-4 h-[72px] flex flex-row items-center justify-between space-y-0">
                    <div className={cn("text-sm font-semibold flex items-center gap-2", headerColorClass)}>
                        <div className={cn("p-1.5 rounded-md bg-opacity-10", iconColorClass.replace('text-', 'bg-'))}>
                            <Icon className={cn("w-4 h-4", iconColorClass)} />
                        </div>
                        {title}
                    </div>

                    {count !== undefined && (
                        <div className="flex items-center gap-2">
                            <AnimatePresence>
                                {(!isHovered && previewText) && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: "auto" }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="text-xs text-muted-foreground hidden sm:inline-block font-normal truncate max-w-[100px] whitespace-nowrap overflow-hidden"
                                    >
                                        {previewText}
                                    </motion.span>
                                )}
                            </AnimatePresence>
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
                </div>

                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-4"
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
