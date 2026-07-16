import { request } from './client';
import type { Service } from '@/types/api';

export interface ServiceInput {
  name: string;
  description?: string;
  price: string | number;
  duration_minutes: number;
  is_active?: boolean;
}

export const servicesApi = {
  list() {
    return request<Service[]>('/api/services/barber/', { auth: true });
  },

  create(data: ServiceInput) {
    return request<Service>('/api/services/barber/', { method: 'POST', body: data, auth: true });
  },

  update(id: number, data: Partial<ServiceInput>) {
    return request<Service>(`/api/services/barber/${id}/`, { method: 'PATCH', body: data, auth: true });
  },

  remove(id: number) {
    return request<void>(`/api/services/barber/${id}/`, { method: 'DELETE', auth: true });
  },
};
