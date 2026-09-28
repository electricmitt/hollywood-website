/** AdminLoginRequest */
export interface AdminLoginRequest {
  /** Password */
  password: string;
}

/** AdminLoginResponse */
export interface AdminLoginResponse {
  /** Token */
  token: string;
}

/** AdminVerifyRequest */
export interface AdminVerifyRequest {
  /** Token */
  token: string;
}

/** AdminVerifyResponse */
export interface AdminVerifyResponse {
  /** Valid */
  valid: boolean;
}

/** ChurchEvent */
export interface ChurchEvent {
  /** Id */
  id: number;
  /** Title */
  title: string;
  /** Date */
  date?: string | null;
  dateRange?: DateRange | null;
  recurrence?: RecurrenceRule | null;
  /** Start time, "HH:MM" 24h, church-local */
  startTime?: string | null;
  /** End time, "HH:MM" 24h */
  endTime?: string | null;
  /** Ends at sunset (no fixed end time) */
  endsAtSunset?: boolean;
  /** All-day event */
  allDay?: boolean;
  /** Display label, e.g. "7:30 PM – 9:30 PM" */
  time: string;
  /** Location */
  location: string;
  /** Description */
  description?: string;
  /**
   * Color
   * @default "bg-indigo-500"
   */
  color?: string | null;
  /**
   * Featured
   * @default false
   */
  featured?: boolean | null;
  /** Imageurl */
  imageUrl?: string | null;
}

/** CreateEventRequest */
export interface CreateEventRequest {
  /** Title */
  title: string;
  /** Date */
  date?: string | null;
  dateRange?: DateRange | null;
  recurrence?: RecurrenceRule | null;
  /** Start time, "HH:MM" 24h, church-local */
  startTime?: string | null;
  /** End time, "HH:MM" 24h */
  endTime?: string | null;
  /** Ends at sunset (no fixed end time) */
  endsAtSunset?: boolean;
  /** All-day event */
  allDay?: boolean;
  /** Display label, e.g. "7:30 PM – 9:30 PM" */
  time: string;
  /** Location */
  location: string;
  /** Description */
  description?: string;
  /**
   * Color
   * @default "bg-indigo-500"
   */
  color?: string | null;
  /**
   * Featured
   * @default false
   */
  featured?: boolean | null;
  /** Imageurl */
  imageUrl?: string | null;
}

/** DateRange */
export interface DateRange {
  /** Start */
  start: string;
  /** End */
  end: string;
}

/** DeleteResponse */
export interface DeleteResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** DownloadRequest */
export interface DownloadRequest {
  /** Video Id */
  video_id: string;
}

/** EventsResponse */
export interface EventsResponse {
  /** Events */
  events: ChurchEvent[];
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** RecurrenceRule */
export interface RecurrenceRule {
  /** "weekly" | "monthly" | "yearly" */
  freq?: string | null;
  /** Every N weeks / months / years (default 1) */
  interval?: number;
  /** 0=Sun … 6=Sat (weekly, monthly) */
  dayOfWeek?: number | null;
  /** Monthly: 1-4, or -1 for the last one */
  weekOfMonth?: number | null;
  /** Series can't occur before this date (YYYY-MM-DD) */
  startDate?: string | null;
  /** Last possible date, inclusive (YYYY-MM-DD) */
  endDate?: string | null;
  /** Skipped dates (YYYY-MM-DD) */
  exceptions?: string[];
  /** Older shape, accepted on input only: "weekly" | "monthly-last" */
  type?: string | null;
}

/** SermonOverride */
export interface SermonOverride {
  /** Title */
  title?: string | null;
  /** Speaker */
  speaker?: string | null;
  /** Description */
  description?: string | null;
  /** Scripture */
  scripture?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type AdminLoginData = AdminLoginResponse;

export type AdminLoginError = HTTPValidationError;

export type AdminVerifyData = AdminVerifyResponse;

export type AdminVerifyError = HTTPValidationError;

/** Response Admin Logout */
export type AdminLogoutData = Record<string, any>;

export type AdminLogoutError = HTTPValidationError;

export interface GetSermonsParams {
  /** Playlistid */
  playlistId: string;
}

export type GetSermonsData = any;

export type GetSermonsError = HTTPValidationError;

export interface GetTranscriptRouteParams {
  /** Video Id */
  videoId: string;
}

export type GetTranscriptRouteData = any;

export type GetTranscriptRouteError = HTTPValidationError;

export type DownloadAudioData = any;

export type DownloadAudioError = HTTPValidationError;

export type GetAllOverridesData = any;

export interface GetOverrideParams {
  /** Video Id */
  videoId: string;
}

export type GetOverrideData = any;

export type GetOverrideError = HTTPValidationError;

export interface SaveOverrideParams {
  /** Video Id */
  videoId: string;
}

export type SaveOverrideData = any;

export type SaveOverrideError = HTTPValidationError;

export interface DeleteOverrideParams {
  /** Video Id */
  videoId: string;
}

export type DeleteOverrideData = any;

export type DeleteOverrideError = HTTPValidationError;

export type GetEventsData = EventsResponse;

export type CreateEventData = ChurchEvent;

export type CreateEventError = HTTPValidationError;

export interface UpdateEventParams {
  /** Event Id */
  eventId: number;
}

export type UpdateEventData = ChurchEvent;

export type UpdateEventError = HTTPValidationError;

export interface DeleteEventParams {
  /** Event Id */
  eventId: number;
}

export type DeleteEventData = DeleteResponse;

export type DeleteEventError = HTTPValidationError;
