import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ResultView from './ResultView';
import productsReducer, { ProductsState } from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { RootState } from '../../app/store';

jest.mock('../../services/api', () => ({
  api: {
    createCheckout: jest.fn(),
    getTransactionStatus: jest.fn(),
  },
}));

const response = {
  transaction: {
    id: 'tx-1',
    reference: 'REF-123',
    gatewayTransactionId: 'gateway-1',
    status: 'APPROVED' as const,
    statusMessage: null,
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
    name: 'Producto',
    description: 'Desc',
    priceInCents: 100000,
    currency: 'COP',
    stock: 4,
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
};

function makeStore(overrides: Partial<RootState['checkout']> = {}) {
  const defaultProducts: ProductsState = {
    products: [],
    status: 'idle',
    error: null,
  };
  const defaultCheckout: RootState['checkout'] = {
    step: 'result',
    selectedProductId: null,
    customer: null,
    delivery: null,
    card: null,
    cardToken: null,
    transactionReference: 'REF-123',
    transactionStatus: 'APPROVED',
    requiresSync: false,
    processing: false,
    error: null,
    lastResponse: response,
  };

  return configureStore({
    reducer: {
      products: productsReducer,
      checkout: checkoutReducer,
    },
    preloadedState: {
      products: defaultProducts,
      checkout: { ...defaultCheckout, ...overrides },
    },
  });
}

describe('ResultView', () => {
  it('muestra el resultado aprobado con la referencia', () => {
    render(
      <Provider store={makeStore()}>
        <ResultView />
      </Provider>,
    );

    expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    expect(screen.getByTestId('result-reference').textContent).toBe('REF-123');
    expect(screen.getByRole('button', { name: 'Volver a la tienda' })).toBeInTheDocument();
  });

  it('muestra el resultado declinado', () => {
    render(
      <Provider store={makeStore({ transactionStatus: 'DECLINED' })}>
        <ResultView />
      </Provider>,
    );

    expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
    expect(screen.getByTestId('result-reference').textContent).toBe('REF-123');
  });

  it('muestra el estado de procesamiento', () => {
    render(
      <Provider store={makeStore({ transactionStatus: null, processing: true })}>
        <ResultView />
      </Provider>,
    );

    expect(screen.getByText('Procesando pago...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Volver a la tienda' })).not.toBeInTheDocument();
  });

  it('al volver, resetea el checkout y regresa al catálogo', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    render(
      <Provider store={store}>
        <ResultView />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Volver a la tienda' }));

    const state = store.getState().checkout;
    expect(state.step).toBe('product');
    expect(state.lastResponse).toBeNull();
  });
});