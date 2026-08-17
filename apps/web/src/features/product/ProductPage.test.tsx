import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProductPage from './ProductPage';
import productsReducer from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { Product } from '../../types';

jest.mock('../../services/api', () => ({
  api: { listProducts: jest.fn() },
}));

import { api } from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

const products: Product[] = [
  {
    id: 'p1',
    sku: 'SKU1',
    name: 'Auriculares',
    description: 'Desc',
    priceInCents: 100000,
    currency: 'COP',
    stock: 3,
    imageUrl: null,
    isPurchasable: true,
  },
  {
    id: 'p2',
    sku: 'SKU2',
    name: 'Teclado',
    description: 'Desc',
    priceInCents: 50000,
    currency: 'COP',
    stock: 0,
    imageUrl: null,
    isPurchasable: false,
  },
];

function makeStore() {
  return configureStore({
    reducer: {
      products: productsReducer,
      checkout: checkoutReducer,
    },
  });
}

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.listProducts.mockResolvedValue(products);
  });

  it('carga y muestra los productos', async () => {
    render(
      <Provider store={makeStore()}>
        <ProductPage />
      </Provider>,
    );

    expect(await screen.findByText('Auriculares')).toBeInTheDocument();
    expect(screen.getByText('Teclado')).toBeInTheDocument();
  });

  it('muestra un estado de carga y luego el catálogo', async () => {
    let resolveFn: (value: Product[]) => void;
    mockApi.listProducts.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }),
    );

    render(
      <Provider store={makeStore()}>
        <ProductPage />
      </Provider>,
    );

    expect(screen.getByText('Cargando productos...')).toBeInTheDocument();
    resolveFn!(products);
    expect(await screen.findByText('Auriculares')).toBeInTheDocument();
  });

  it('muestra un error y permite reintentar', async () => {
    mockApi.listProducts.mockRejectedValue(new Error('red caída'));
    render(
      <Provider store={makeStore()}>
        <ProductPage />
      </Provider>,
    );

    expect(
      await screen.findByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();

    mockApi.listProducts.mockResolvedValue(products);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Auriculares')).toBeInTheDocument();
  });

  it('inicia el checkout al pulsar comprar', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    render(
      <Provider store={store}>
        <ProductPage />
      </Provider>,
    );

    await screen.findByText('Auriculares');
    await user.click(screen.getAllByRole('button', { name: 'Pagar con tarjeta' })[0]);

    const state = store.getState().checkout;
    expect(state.selectedProductId).toBe('p1');
    expect(state.step).toBe('payment');
  });
});