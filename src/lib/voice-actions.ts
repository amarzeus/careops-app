// import { toast } from "sonner";

export type VoiceActionType =
    | "navigate"
    | "create_booking"
    | "check_inventory"
    | "send_form"
    | "general_info";

export interface VoiceAction {
    type: VoiceActionType;
    payload?: any;
}

export const VoiceActionService = {
    execute: (action: VoiceAction, router: any) => {
        console.log("Executing Voice Action:", action);

        switch (action.type) {
            case "navigate":
                if (action.payload?.path) {
                    router.push(action.payload.path);
                }
                break;

            case "create_booking":
                // For now, redirect to bookings page with a query param to open modal
                // In a real app, we'd use a global store to open the modal directly
                router.push("/bookings?action=new");
                toast.info("Opening booking creation...");
                break;

            case "check_inventory":
                router.push("/inventory");
                // Could highlight low stock items if payload has IDs
                break;

            case "send_form":
                router.push("/forms");
                toast.info("Navigating to forms to send...");
                break;

            case "general_info":
                // Just spoken context, no UI action needed usually
                break;

            default:
                console.warn("Unknown voice action type:", action.type);
        }
    }
};
