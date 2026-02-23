import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    size?: number;
    variant?: "icon" | "full";
}

/**
 * Premium SOTA-grade SVG Logo for CareOps.
 * Features a modern squircle shape with a sophisticated indigo-purple gradient
 * and a stylized pulse/heartbeat line representing "Care" + "Operations".
 *
 * @param root0
 * @param root0.className
 * @param root0.size - dimension in pixels (square)
 * @param root0.variant - 'icon' for just the mark, 'full' for mark + text
 */
export function Logo({ className, size = 32, variant = "full" }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 drop-shadow-sm"
            >
                <defs>
                    <linearGradient
                        id="careops-gradient"
                        x1="2"
                        y1="2"
                        x2="30"
                        y2="30"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#6366F1" /> {/* Indigo-500 */}
                        <stop offset="1" stopColor="#A855F7" /> {/* Purple-500 */}
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main Background: Continuous Squircle (gradient) */}
                <rect
                    x="2"
                    y="2"
                    width="28"
                    height="28"
                    rx="8"
                    fill="url(#careops-gradient)"
                />

                {/* Inner Detail: Stylized Pulse Line (White) */}
                {/* Represents vital signs (healthcare) + data graph (ops) */}
                <path
                    d="M8.5 16 H12 L14 10.5 L18 21.5 L20 16 H23.5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.1))"
                />
            </svg>

            {variant === "full" && (
                <span className="font-bold tracking-tight text-xl text-foreground select-none">
                    Care<span className="text-primary">Ops</span>
                </span>
            )}
        </div>
    );
}
