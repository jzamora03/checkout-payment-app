export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1',
  paymentApiUrl: import.meta.env.VITE_PAYMENT_API_URL as string | undefined,
  paymentPublicKey: import.meta.env.VITE_PAYMENT_PUBLIC_KEY as string | undefined,
};