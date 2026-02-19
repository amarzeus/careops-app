"use strict";
import React from "react";

interface GradientOrbProps {
    className?: string;
    delay?: number;
}

/**
 * Gradient Orb component
 * @param props props
 * @param props.className className
 * @param props.delay delay
 */
export function GradientOrb({ className = "", delay = 0 }: GradientOrbProps) {
    return (
        <div
            className={`absolute rounded-full blur-3xl opacity-30 animate-pulse ${className}`}
            style={{ animationDuration: "8s", animationDelay: `${delay}s` }}
        />
    );
}
