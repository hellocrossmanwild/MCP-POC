import type { Request } from "express";

export const SERVER_NAME = "contractor-search";
export const SERVER_VERSION = "2.0.0";

export interface AuthenticatedRequest extends Request {
  userEmail?: string;
}

export interface ContractorRow {
  id: string;
  name: string;
  initials: string;
  title: string;
  bio: string | null;
  location: string;
  day_rate: string | number;
  years_experience: string | number;
  availability: string;
  available_from: string | null;
  certifications: string[];
  sectors: string[];
  skills: string[];
  rating: string | null;
  review_count: string | number;
  placement_count: string | number;
  security_clearance: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  profile_photo_url: string | null;
  education: EducationEntry[];
  work_history: WorkHistoryEntry[];
  notable_projects: ProjectEntry[];
  languages: string[];
  created_at: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  year?: number;
}

export interface WorkHistoryEntry {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  client?: string;
}

export interface JobRow {
  id: string;
  title: string;
  client_name: string;
  description: string;
  location: string;
  remote_option: string;
  day_rate_min: number | null;
  day_rate_max: number | null;
  duration_weeks: number | null;
  start_date: string | null;
  required_certifications: string[];
  required_skills: string[];
  required_clearance: string | null;
  sector: string | null;
  experience_min: number | null;
  status: string;
  urgency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShortlistRow {
  id: string;
  name: string;
  description: string | null;
  role_title: string | null;
  client_name: string | null;
  created_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ShortlistItemRow {
  id: string;
  shortlist_id: string;
  contractor_id: string;
  notes: string | null;
  status: string;
  added_at: string;
  updated_at: string;
}

export interface OutreachRow {
  id: string;
  contractor_id: string;
  shortlist_id: string | null;
  subject: string;
  body: string;
  status: string;
  created_at: string;
}

export interface EngagementRow {
  id: string;
  contractor_id: string;
  shortlist_id: string | null;
  role_title: string;
  client_name: string | null;
  start_date: string | null;
  end_date: string | null;
  agreed_rate: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function getBaseUrl(req?: Request): string {
  if (req?.headers.host) {
    const proto = req.headers["x-forwarded-proto"] || "https";
    return `${proto}://${req.headers.host}`;
  }
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return `http://localhost:${process.env.PORT || 5000}`;
}
