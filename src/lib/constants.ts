import type { LeadStatus, Priority } from "./types";

/** Ordered active pipeline stages (shown on the board, in order). */
export const PIPELINE_STAGES: LeadStatus[] = [
  "new_inquiry",
  "first_contact",
  "qualification",
  "building_itinerary",
  "quote_sent",
  "follow_up",
  "deposit_received",
  "booking_confirmed",
  "operations",
  "traveling",
  "trip_completed",
  "review_received",
];

/** Non-linear / terminal statuses. */
export const SPECIAL_STATUSES: LeadStatus[] = [
  "waiting_for_customer",
  "cancelled",
  "lost",
];

export const ALL_STATUSES: LeadStatus[] = [
  ...PIPELINE_STAGES,
  ...SPECIAL_STATUSES,
];

/** "Open" statuses used for KPIs (not closed/terminal). */
export const OPEN_STATUSES: LeadStatus[] = [
  ...PIPELINE_STAGES.filter((s) => s !== "trip_completed" && s !== "review_received"),
  "waiting_for_customer",
];

export const WON_STATUSES: LeadStatus[] = [
  "deposit_received",
  "booking_confirmed",
  "operations",
  "traveling",
  "trip_completed",
  "review_received",
];

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new_inquiry: "#6366f1",
  first_contact: "#0ea5e9",
  qualification: "#06b6d4",
  building_itinerary: "#8b5cf6",
  quote_sent: "#f59e0b",
  follow_up: "#eab308",
  deposit_received: "#14b8a6",
  booking_confirmed: "#22c55e",
  operations: "#3b82f6",
  traveling: "#ec4899",
  trip_completed: "#10b981",
  review_received: "#a855f7",
  waiting_for_customer: "#f97316",
  cancelled: "#ef4444",
  lost: "#6b7280",
};

export const STATUS_EMOJI: Record<LeadStatus, string> = {
  new_inquiry: "🟢",
  first_contact: "📞",
  qualification: "📋",
  building_itinerary: "🗓",
  quote_sent: "💰",
  follow_up: "⏳",
  deposit_received: "💳",
  booking_confirmed: "✅",
  operations: "⚙️",
  traveling: "✈️",
  trip_completed: "🎉",
  review_received: "❤️",
  waiting_for_customer: "🟠",
  cancelled: "🔴",
  lost: "⚫",
};

export const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#94a3b8",
  normal: "#64748b",
  high: "#f59e0b",
  urgent: "#ef4444",
};
