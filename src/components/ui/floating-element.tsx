"use strict";
import React, { useState, useEffect } from "react";

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Floating Element component
 * @param props props
 * @param props.children children
 * @param props.delay delay
 * @param props.className className
 */
export function FloatingElement({ children, delay = 0, className = "" }: FloatingElementProps) {
  const [offset, setOffset] = useState(0);
  const direction = delay % 2 === 0 ? 1 : -1;

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev + direction);
    }, 50);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div
      className={`transition-transform duration-100 ${className}`}
      style={{
        transform: `translateY(${Math.sin(offset * 0.1) * 8}px)`,
      }}
    >
      {children}
    </div>
  );
}
