import { configureStore } from '@reduxjs/toolkit';
import productsReducer, { fetchProducts, setProducts } from './productsSlice';
import type { Product } from '../../types';

jest.mock('../../services/api', () => ({
  api: { listProducts: jest.fn() },
}));

import { api } from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

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

function makeStore() {
  return configureStore({
    reducer: { products: productsReducer },
  });
}

describe('productsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tiene estado inicial idle', () => {
    const state = makeStore().getState().products;
    expect(state.status).toBe('idle');
    expect(state.products).toEqual([]);
  });

  it('setProducts actualiza la lista', () => {
    const store = makeStore();
    store.dispatch(setProducts([product]));
    const state = store.getState().products;
    expect(state.status).toBe('succeeded');
    expect(state.products).toHaveLength(1);
  });

  it('fetchProducts carga los productos', async () => {
    mockApi.listProducts.mockResolvedValue([product]);
    const store = makeStore();
    await store.dispatch(fetchProducts());
    const state = store.getState().products;
    expect(state.status).toBe('succeeded');
    expect(state.products[0].id).toBe('p1');
  });

  it('fetchProducts maneja errores', async () => {
    mockApi.listProducts.mockRejectedValue(new Error('red caída'));
    const store = makeStore();
    await store.dispatch(fetchProducts());
    const state = store.getState().products;
    expect(state.status).toBe('failed');
    expect(state.error).toBeTruthy();
  });
});