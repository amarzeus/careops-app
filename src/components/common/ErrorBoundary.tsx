"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-lg font-semibold text-red-800">Something went wrong</h2>
            <p className="mb-4 text-sm text-red-600">
              An unexpected error occurred. Please try again or contact support if the problem
              persists.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs font-medium text-red-700">
                  Error Details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 *
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onReset?: () => void
): React.FC<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onReset={onReset}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
