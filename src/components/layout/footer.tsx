"use client";

import React from "react";
import Link from "next/link";
import { Heart, Github } from "lucide-react";

interface FooterProps {
  children?: React.ReactNode;
}

/**
 *
 * @param root0
 * @param root0.children
 */
export function Footer({ children }: FooterProps) {
  return (
    <footer className="border-border/40 bg-background border-t px-6 py-4">
      <div className="text-muted-foreground flex flex-col items-center justify-between gap-2 text-xs sm:flex-row">
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <Heart className="mx-1 h-3 w-3 fill-red-400 text-red-400" />
          <span>CareOps</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
            Privacy
          </Link>
          <a
            href="https://github.com/amarzeus/careops-app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground flex items-center gap-1 transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
        {children}
      </div>
    </footer>
  );
}
