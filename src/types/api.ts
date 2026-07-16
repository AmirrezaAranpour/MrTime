// Types mirroring the Django REST backend contracts.

export type Role = 'admin' | 'barber' | 'customer';

export interface AuthUser {
  id: number;
  phone_number: string;
  role: Role;
  name: string;
}

/** GET/PATCH /auth/customer/profile/ — the customer panel. */
export interface CustomerProfile {
  id: number;
  name: string;
  phone_number: string;
}

export interface AuthTokenResponse {
  message: string;
  refresh: string;
  access: string;
  user: AuthUser;
}

export interface BarberRegisterResponse {
  message: string;
  user: {
    phone_number: string;
    role: string;
    name: string;
  };
}

export interface OTPRequestResponse {
  message: string;
  code: string; // returned by the backend in dev mode
}

/** GET /api/barbers/ — only id + name are real. */
export interface ActiveBarber {
  id: number;
  name: string;
}

/** GET /api/barbers/<id>/ — full barber profile. Optional fields are empty string / null when unset. */
export interface BarberDetail {
  id: number;
  name: string;
  is_active: boolean;
  bio: string;
  phone: string;
  address: string;
  specialty: string;
  instagram_handle: string;
  experience_years: number | null;
}

/** Barber-owned service (GET/POST /api/services/barber/). */
export interface Service {
  id: number;
  name: string;
  description: string;
  price: string; // DecimalField is serialized as a string
  duration_minutes: number;
  is_active: boolean;
}

/** Public service list (GET /api/services/barber-services/<id>/). */
export interface PublicService {
  id: number;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
}

export interface AvailableSlot {
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export interface AvailableSlotsResponse {
  barber_id: number;
  service_id: number;
  date: string; // "YYYY-MM-DD"
  duration_minutes: number;
  slots: AvailableSlot[];
}

export type AppointmentStatus = 'p' | 'r' | 'c' | 'f';

export interface Appointment {
  id: number;
  customer: number;
  barber: number;
  service: number;
  service_price: string;
  appointment_time: string; // ISO datetime
  finish_time: string;
  is_paid: boolean;
  last_status: AppointmentStatus;
}

/** GET /api/reservations/my-appointments/ and the cancel response. */
export interface CustomerAppointment {
  id: number;
  barber: number;
  barber_name: string;
  service: number;
  service_name: string;
  service_price: string;
  appointment_time: string; // ISO datetime
  finish_time: string;
  is_paid: boolean;
  last_status: AppointmentStatus;
  status_label: string;
  can_cancel: boolean;
}

export interface WeeklyAvailability {
  id: number;
  weekday: number; // 0 = Saturday ... 6 = Friday
  weekday_label: string;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;
  is_active: boolean;
}

export interface WeeklyInterval {
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export interface WeeklyDayPayload {
  weekday: number;
  intervals: WeeklyInterval[];
}

export interface WeeklyBulkPayload {
  days: WeeklyDayPayload[];
}

export type DateRuleType = 'open' | 'closed';

export interface DateAvailability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  rule_type: DateRuleType;
  /** Free-text note shown to customers on closed days; empty for open overrides. */
  reason: string;
  is_active: boolean;
}

export interface DateAvailabilityPayload {
  date: string;
  start_time: string;
  end_time: string;
  rule_type: DateRuleType;
  reason?: string;
}
