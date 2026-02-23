import { describe, it, expect, vi, type Mock, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PublicContactPage from "@/app/(public)/contact/[slug]/page";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: vi.fn(() => ({ slug: "contact-slug" })),
}));

// Mock React.use for Next.js 15+ style params
vi.mock("react", async (importOriginal: () => Promise<Mock>) => {
  const original = await importOriginal();
  return {
    ...original,
    use: (_promise: unknown) => ({ slug: "cmlnhj36y000ecv2sbvckuul7" }),
  };
});

describe("ContactPage Submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should render fields and submit successfully", async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    // 1. Mock Form Fetch
    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url.includes("/api/public/contact-form/")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            form: {
              id: "form-1",
              name: "Contact Us",
              fields: JSON.stringify([
                { name: "name", label: "Full Name", type: "text", required: true },
                { name: "email", label: "Email Address", type: "email", required: true },
                { name: "message", label: "Your Message", type: "textarea", required: true },
              ]),
              workspace: { name: "Test Business" },
            },
          }),
        });
      }
      if (url.includes("/api/public/contact")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: "Message Sent" }),
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: "Not Found" }) });
    });

    const paramsPromise = Promise.resolve({ slug: "contact-slug" });
    render(<PublicContactPage params={paramsPromise} />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
    });

    // Verify fields rendered
    expect(screen.getByPlaceholderText(/Enter full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your message/i)).toBeInTheDocument();

    // Fill Form
    fireEvent.change(screen.getByPlaceholderText(/Enter full name/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your message/i), {
      target: { value: "Hello there!" },
    });

    // Mock Submission - Handled by mockImplementation above

    const submitBtn = screen.getByText("Submit");
    fireEvent.click(submitBtn);

    // Verify Success State
    await waitFor(() => {
      expect(screen.getByText(/Thank You!/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Message Sent/i)).toBeInTheDocument();
  });
});
