export type LeadStatus =
  | "new_inquiry"
  | "first_contact"
  | "qualification"
  | "building_itinerary"
  | "quote_sent"
  | "follow_up"
  | "deposit_received"
  | "booking_confirmed"
  | "operations"
  | "traveling"
  | "trip_completed"
  | "review_received"
  | "waiting_for_customer"
  | "cancelled"
  | "lost";

export type Priority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type Role = "admin" | "agent";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  country: string | null;
  preferred_language: string | null;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  contact_id: string | null;
  status: LeadStatus;
  priority: Priority;
  assigned_to_user_id: string | null;
  planning_owner_user_id: string | null;
  service_category: string | null;
  program_type: string[] | null;
  boat_level: string | null;
  accommodation_level: string | null;
  number_of_travelers: number | null;
  party_type: string | null;
  age_range: string | null;
  travel_start_date: string | null;
  date_flexibility: string | null;
  program_length_nights: number | null;
  destination: string | null;
  preferred_language: string | null;
  message: string | null;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  quote_amount: number | null;
  deposit_amount: number | null;
  currency: string;
  source: string | null;
  source_page: string | null;
  source_cta: string | null;
  form_name: string | null;
  external_submission_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_page: string | null;
  raw_payload: Record<string, unknown> | null;
  inquiry_details: Record<string, unknown> | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
  assigned_to?: Profile | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  author?: Profile | null;
}

export interface Task {
  id: string;
  lead_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  lead?: { id: string; contact?: Contact | null } | null;
  assignee?: Profile | null;
}

export type ActivityType =
  | "lead_created"
  | "lead_updated"
  | "status_changed"
  | "assignment_changed"
  | "note_added"
  | "task_created"
  | "task_completed"
  | "imported"
  | "system_event";

export interface LeadActivity {
  id: string;
  lead_id: string | null;
  activity_type: ActivityType;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  actor_type: "user" | "automation" | "system";
  created_at: string;
  actor?: Profile | null;
}
