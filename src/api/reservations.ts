import { request } from './client';
import type { Appointment, AvailableSlotsResponse, CustomerAppointment } from '@/types/api';

export const reservationsApi = {
  availableSlots(params: { barber_id: number; service_id: number; date: string }) {
    return request<AvailableSlotsResponse>('/api/reservations/available-slots/', { query: params });
  },

  createAppointment(data: { service_id: number; date: string; start_time: string; name: string }) {
    return request<Appointment>('/api/reservations/appointments/', {
      method: 'POST',
      body: data,
      auth: true,
    });
  },

  /** List the authenticated customer's own appointments (newest first). */
  myAppointments() {
    return request<CustomerAppointment[]>('/api/reservations/my-appointments/', { auth: true });
  },

  /**
   * Cancel an upcoming appointment. The backend frees the slot (the cancelled
   * appointment no longer blocks the barber's availability) and returns the
   * updated record. Rejects with 400 if it is too late to cancel (less than an
   * hour before the start, already started, finished, or already cancelled).
   */
  cancelAppointment(id: number) {
    return request<CustomerAppointment>(`/api/reservations/my-appointments/${id}/cancel/`, {
      method: 'POST',
      auth: true,
    });
  },
};
