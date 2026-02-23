import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookingPage from '@/app/book/[workspaceId]/page';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useParams: vi.fn(() => ({ workspaceId: 'ws-1' })),
    useRouter: () => ({ push: vi.fn() }),
}));

// Mock React.use for Next.js 15+ style params
vi.mock("react", async (importOriginal: () => Promise<any>) => {
    const original = await importOriginal();
    return {
        ...original,
        use: (_promise: unknown) => ({ workspaceId: "clzoq6z8w0000x2vclzoq6z8w" }),
    };
});

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
    toast: vi.fn(),
}));

// Mock components to avoid deep rendering issues
vi.mock('@/components/ui/calendar', () => ({
    Calendar: ({ onSelect }: any) => (
        <div data-testid="mock-calendar" onClick={() => onSelect(new Date())}>Mock Calendar</div>
    ),
}));

describe('BookingPage Submission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete the booking flow successfully', async () => {
        const mockFetch = vi.fn();
        global.fetch = mockFetch;

        // 1. Mock Workspace Context Fetch
        (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
            if (url.includes('/api/booking/context/')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        id: 'ws-1',
                        name: 'Test Business',
                        address: '123 Test St',
                        services: [
                            { id: 'srv-1', name: 'Test Service', price: 50, duration: 30 }
                        ]
                    })
                });
            }
            if (url.includes('/api/booking/availability')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ slots: ['10:00 AM', '11:00 AM'] })
                });
            }
            if (url.includes('/api/booking/create')) {
                return Promise.resolve({ ok: true, json: async () => ({}) });
            }
            return Promise.resolve({ ok: false, json: async () => ({}) });
        });

        render(<BookingPage />);

        // Wait for workspace to load
        await waitFor(() => {
            expect(screen.getByText('Test Business')).toBeInTheDocument();
        });

        // STEP 1: Select Service
        const serviceBtn = screen.getByText('Test Service');
        fireEvent.click(serviceBtn);

        // STEP 2: Select Date/Time
        // Mock Availability Fetch
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ slots: ['10:00 AM', '11:00 AM'] })
        });

        // Calendar is already rendered, wait for it
        await waitFor(() => {
            expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
        });

        // Wait for slots to load
        await waitFor(() => {
            expect(screen.getByText('10:00 AM')).toBeInTheDocument();
        });

        const timeBtn = screen.getByText('10:00 AM');
        fireEvent.click(timeBtn);

        // STEP 3: Fill Details
        await waitFor(() => {
            expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });

        // STEP 4: Submit
        (global.fetch as any).mockResolvedValueOnce({ ok: true });

        const submitBtn = screen.getByText('Confirm Booking');
        fireEvent.click(submitBtn);

        // STEP 5: Verify Success
        await waitFor(() => {
            expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
        });
        expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    });
});
