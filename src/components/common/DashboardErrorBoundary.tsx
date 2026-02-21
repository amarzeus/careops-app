"use client";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { type ReactNode } from "react";

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
}

export function DashboardErrorBoundary({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onReset={() => {
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
