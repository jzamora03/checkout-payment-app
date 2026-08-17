import { env } from '../env';
import type { CheckoutResponse, Product } from '../types';

const BASE_URL = env.apiUrl;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let message = 'Error al comunicarse con el servidor';
    try {
      const body = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message ?? message;
    } catch {
      // mantener mensaje por defecto
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  listProducts: () => request<Product[]>('/products'),

  createCheckout: (payload: unknown) =>
    request<CheckoutResponse>('/checkout/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTransactionStatus: (reference: string) =>
    request<CheckoutResponse>(`/checkout/transactions/${encodeURIComponent(reference)}`),
};