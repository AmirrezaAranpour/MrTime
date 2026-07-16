// The backend exposes appointment creation but no "list my appointments"
// endpoint, so we cache created appointments locally to power the
// "my appointments" screen. Records are enriched at booking time.

import type { AppointmentStatus } from '@/types/api';

export interface StoredAppointment {
  id: number;
  barberId: number;
  barberName: string;
  barberInitial: string;
  barberColor: string;
  salon: string;
  serviceName: string;
  price: string;
  durationMinutes: number;
  dateIso: string;
  startTime: string; // "HH:MM"
  dateLabel: string;
  status: AppointmentStatus;
  customerName: string;
  customerPhone: string;
  note?: string;
  createdAt: string;
}

const KEY = 'nobat.appointments';

export function getAppointments(): StoredAppointment[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredAppointment[]) : [];
  } catch {
    return [];
  }
}

function save(list: StoredAppointment[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addAppointment(appointment: StoredAppointment): void {
  const list = getAppointments();
  list.unshift(appointment);
  save(list);
}

export function updateStatus(id: number, status: AppointmentStatus): void {
  const list = getAppointments().map((a) => (a.id === id ? { ...a, status } : a));
  save(list);
}

export function appointmentsForPhone(phone: string): StoredAppointment[] {
  return getAppointments().filter((a) => a.customerPhone === phone);
}
