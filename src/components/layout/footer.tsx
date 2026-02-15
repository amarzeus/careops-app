"use client";

import React from "react";
import Link from "next/link";
import { Heart, Github } from "lucide-react";

interface FooterProps {
  children?: React.ReactNode;
}

export function Footer({ children }: FooterProps) {
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-gray-500 sm:flex-row">
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <Heart className="mx-1 h-3 w-3 fill-red-400 text-red-400" />
          <span>CareOps</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="transition-colors hover:text-gray-700">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-gray-700">
            Privacy
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-gray-700"
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
