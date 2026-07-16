import { request } from './client';
import type {
  AuthTokenResponse,
  BarberRegisterResponse,
  CustomerProfile,
  OTPRequestResponse,
} from '@/types/api';

export const authApi = {
  barberRegister(data: { phone_number: string; password: string; name?: string }) {
    return request<BarberRegisterResponse>('/auth/barber/register/', { method: 'POST', body: data });
  },

  barberLogin(data: { phone_number: string; password: string }) {
    return request<AuthTokenResponse>('/auth/barber/login/', { method: 'POST', body: data });
  },

  customerRequestOtp(phone_number: string) {
    return request<OTPRequestResponse>('/auth/customer/request-otp/', {
      method: 'POST',
      body: { phone_number },
    });
  },

  // Name is optional here: customers log in / register with just their phone number.
  customerVerifyOtp(data: { phone_number: string; code: string; name?: string }) {
    return request<AuthTokenResponse>('/auth/customer/verify-otp/', { method: 'POST', body: data });
  },

  // Blacklists the refresh token server-side. Works for customers and barbers.
  logout(refresh: string) {
    return request<void>('/auth/logout/', { method: 'POST', body: { refresh }, auth: true });
  },

  getCustomerProfile() {
    return request<CustomerProfile>('/auth/customer/profile/', { auth: true });
  },

  updateCustomerProfile(data: { name: string }) {
    return request<CustomerProfile>('/auth/customer/profile/', {
      method: 'PATCH',
      body: data,
      auth: true,
    });
  },
};
