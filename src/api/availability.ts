import { request } from './client';
import type {
  DateAvailability,
  DateAvailabilityPayload,
  WeeklyAvailability,
  WeeklyBulkPayload,
} from '@/types/api';

export const availabilityApi = {
  getWeekly() {
    return request<WeeklyAvailability[]>('/api/availability/barber/weekly/', { auth: true });
  },

  saveWeekly(payload: WeeklyBulkPayload) {
    return request<WeeklyAvailability[]>('/api/availability/barber/weekly/', {
      method: 'PATCH',
      body: payload,
      auth: true,
    });
  },

  listDates() {
    return request<DateAvailability[]>('/api/availability/barber/date/', { auth: true });
  },

  createDate(data: DateAvailabilityPayload) {
    return request<DateAvailability>('/api/availability/barber/date/', {
      method: 'POST',
      body: data,
      auth: true,
    });
  },

  deleteDate(id: number) {
    return request<void>(`/api/availability/barber/date/${id}/`, {
      method: 'DELETE',
      auth: true,
    });
  },
};
