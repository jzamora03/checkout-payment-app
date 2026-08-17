import { api, ApiError } from './api';
import type { Product } from '../types';

const product: Product = {
  id: 'p1',
  sku: 'SKU',
  name: 'Producto',
  description: 'Desc',
  priceInCents: 100000,
  currency: 'COP',
  stock: 3,
  imageUrl: null,
  isPurchasable: true,
};

describe('api', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lista productos', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([product]),
    } as Response);

    const result = await api.listProducts();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('lanza ApiError con el mensaje del servidor', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'Sin stock' }),
    } as Response);

    await expect(api.listProducts()).rejects.toThrow(ApiError);
    await expect(api.listProducts()).rejects.toThrow('Sin stock');
  });

  it('lanza ApiError con mensaje por defecto si el cuerpo no es JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('no json')),
    } as Response);

    await expect(api.listProducts()).rejects.toThrow('Error al comunicarse con el servidor');
  });

  it('crea un checkout enviando el payload', async () => {
    const payload = { productId: 'p1', cardToken: 'tok' };
    const response = {
      transaction: { reference: 'REF-1', status: 'APPROVED' },
      requiresSync: false,
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await api.createCheckout(payload);
    expect(result.transaction.reference).toBe('REF-1');
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('consulta el estado de una transacción', async () => {
    const response = { transaction: { reference: 'REF-1' }, requiresSync: false };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await api.getTransactionStatus('REF-1');
    expect(result.transaction.reference).toBe('REF-1');
  });
});