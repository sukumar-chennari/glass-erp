import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

export interface SendWhatsAppLinkPayload {
  phone: string;
  customerName: string;
  branchId: string;
}

// 200 — link delivered
export interface SendWhatsAppLinkResponse {
  sent: boolean;
  medium?: string;   // e.g. "MSG91"
}

// Endpoint is PUBLIC — no auth token required.
// baseApi.prepareHeaders only attaches a Bearer token when getToken() is non-null,
// so unauthenticated callers (Entry Page visitors) are handled automatically.
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
