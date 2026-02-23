"use strict";
import React, { useState, useRef, useEffect } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * 3D Tilt Card component
 * @param props props
 * @param props.children children
 * @param props.className className
 */
export function TiltCard({ children, className = "" }: TiltCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * 8, y: -x * 8 });
    };

    const card = cardRef.current;
    if (isHovered) {
      card?.addEventListener("mousemove", handleMouseMove);
    }
    return () => card?.removeEventListener("mousemove", handleMouseMove);
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-300 ease-out ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setTilt({ x: 0, y: 0 });
      }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.02 : 1})`,
      }}
    >
      {children}
    </div>
  );
}
