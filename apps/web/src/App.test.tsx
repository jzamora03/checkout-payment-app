import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import productsReducer from './features/products/productsSlice';
import checkoutReducer from './features/checkout/checkoutSlice';
import type { RootState } from './app/store';

jest.mock('./services/api', () => ({
  api: {
    listProducts: jest.fn(),
    createCheckout: jest.fn(),
    getTransactionStatus: jest.fn(),
  },
}));

import { api } from './services/api';

const mockApi = api as jest.Mocked<typeof api>;

function makeStore(preloadedCheckout: Partial<RootState['checkout']> = {}) {
  const defaultCheckout: RootState['checkout'] = {
    step: 'product',
    selectedProductId: null,
    customer: null,
    delivery: null,
    card: null,
    cardToken: null,
    transactionReference: null,
    transactionStatus: null,
    requiresSync: false,
    processing: false,
    error: null,
    lastResponse: null,
  };

  return configureStore({
    reducer: {
      products: productsReducer,
      checkout: checkoutReducer,
    },
    preloadedState: {
      checkout: { ...defaultCheckout, ...preloadedCheckout },
    },
  });
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.listProducts.mockResolvedValue([
      {
        id: 'p1',
        sku: 'SKU',
        name: 'Auriculares',
        description: 'Desc',
        priceInCents: 100000,
        currency: 'COP',
        stock: 3,
        imageUrl: null,
        isPurchasable: true,
      },
    ]);
  });

  it('muestra la página de producto y el modal al iniciar checkout', async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    expect(await screen.findByText('Auriculares')).toBeInTheDocument();
  });

  it('recupera el estado de pago tras un refresh (resiliencia)', async () => {
    mockApi.getTransactionStatus.mockResolvedValue({
      transaction: {
        id: 'tx-1',
        reference: 'REF-1',
        wompiTransactionId: 'wompi-1',
        status: 'APPROVED',
        statusMessage: 'ok',
        amountInCents: 100000,
        baseFeeInCents: 3000,
        deliveryFeeInCents: 5000,
        totalInCents: 108000,
        currency: 'COP',
        paymentMethodType: 'CARD',
        cardBrand: 'VISA',
        cardLastFour: '4242',
        customerEmail: 'c@test.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      product: {
        id: 'p1',
        sku: 'SKU',
        name: 'Auriculares',
        description: 'Desc',
        priceInCents: 100000,
        currency: 'COP',
        stock: 3,
        imageUrl: null,
        isPurchasable: true,
      },
      customer: {
        id: 'c-1',
        email: 'c@test.com',
        firstName: 'Juan',
        lastName: 'Perez',
        documentType: 'CC',
        documentNumber: '1067981234',
        phone: null,
      },
      delivery: {
        id: 'd-1',
        status: 'ASSIGNED',
        addressLine1: 'Calle 1',
        addressLine2: null,
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'CO',
      },
      requiresSync: false,
    });

    const store = makeStore({
      step: 'result',
      transactionReference: 'REF-1',
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockApi.getTransactionStatus).toHaveBeenCalledWith('REF-1');
    });
    expect(await screen.findByText('¡Pago exitoso!')).toBeInTheDocument();
  });
});