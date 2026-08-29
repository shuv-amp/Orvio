import type { CommandSection, CommandView } from "@/lib/ui/commands";

/** Role workspace currently on screen. */
export type View = CommandView;

/** Sub-section of the organizer control tower. */
export type OrganizerSection = CommandSection;

/** Transient confirmation or warning shown after an action. */
export interface Toast {
  title: string;
  detail: string;
  kind?: "success" | "warning";
}

/** Raise a toast, or clear the current one with `null`. */
export type ShowToast = (toast: Toast | null) => void;
