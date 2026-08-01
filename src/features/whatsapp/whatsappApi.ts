import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

export interface SendWhatsAppLinkPayload {
  phone: string;
  customerName: string;
}

export interface SendWhatsAppLinkResponse {
  sent: boolean;
  fallbackLink?: string;
  message?: string;
}

export const whatsappApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendWhatsAppLink: builder.mutation<SendWhatsAppLinkResponse, SendWhatsAppLinkPayload>({
      query: (body) => ({
        url: ENDPOINTS.enquiries.sendWhatsAppLink,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSendWhatsAppLinkMutation } = whatsappApi;
