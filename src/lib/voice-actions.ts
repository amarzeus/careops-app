import { toast } from "@/hooks/use-toast";

export type VoiceActionType =
    | "navigate"
    | "create_booking"
    | "check_inventory"
    | "send_form"
    | "general_info";

export interface VoiceAction {
    type: VoiceActionType;
    payload?: Record<string, unknown>;
}

export const VoiceActionService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: (action: VoiceAction, router: any) => {
        console.log("Executing Voice Action:", action);

        switch (action.type) {
            case "navigate":
                if (typeof action.payload?.path === 'string') {
                    router.push(action.payload.path);
                }
                break;

            case "create_booking":
                // For now, redirect to bookings page with a query param to open modal
                // In a real app, we'd use a global store to open the modal directly
                router.push("/bookings?action=new");
                toast({ title: "Voice Action", description: "Opening booking creation..." });
                break;

            case "check_inventory":
                router.push("/inventory");
                // Could highlight low stock items if payload has IDs
                break;

            case "send_form":
                router.push("/forms");
                toast({ title: "Voice Action", description: "Navigating to forms to send..." });
                break;

            case "general_info":
                // Just spoken context, no UI action needed usually
                break;

            default:
                console.warn("Unknown voice action type:", action.type);
        }
    }
};
