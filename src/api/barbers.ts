import { request } from './client';
import type { ActiveBarber, BarberDetail, PublicService } from '@/types/api';

export const barbersApi = {
  listActive() {
    return request<ActiveBarber[]>('/api/barbers/');
  },

  getBarber(barberId: number) {
    return request<BarberDetail>(`/api/barbers/${barberId}/`);
  },

  publicServices(barberId: number) {
    return request<PublicService[]>(`/api/services/barber-services/${barberId}/`);
  },
};
