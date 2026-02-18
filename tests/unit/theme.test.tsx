import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

describe("ThemeProvider", () => {
  it("should be importable", async () => {
    const { ThemeProvider } = await import(
      "@/components/providers/theme-provider"
    );
    expect(ThemeProvider).toBeDefined();
  });

  it("should render children", async () => {
    const { ThemeProvider } = await import(
      "@/components/providers/theme-provider"
    );
    render(
      <ThemeProvider>
        <div data-testid="child">Test Child</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("ThemeToggle", () => {
  it("should be importable", async () => {
    const { ThemeToggle } = await import("@/components/ui/theme-toggle");
    expect(ThemeToggle).toBeDefined();
  });

  it("should render a button", async () => {
    const { ThemeToggle } = await import("@/components/ui/theme-toggle");
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
