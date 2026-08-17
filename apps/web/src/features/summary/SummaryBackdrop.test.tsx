import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SummaryBackdrop from './SummaryBackdrop';
import productsReducer, { ProductsState } from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { RootState } from '../../app/store';
import { TokenizationError } from '../../services/payment';

jest.mock('../../services/payment', () => ({
  tokenizeCard: jest.fn(),
  TokenizationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TokenizationError';
    }
  },
}));

jest.mock('../../services/api', () => ({
  api: {
    createCheckout: jest.fn(),
    getTransactionStatus: jest.fn(),
  },
}));

import { tokenizeCard } from '../../services/payment';
import { api } from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

const product = {
  id: 'product-1',
  sku: 'SKU',
  name: 'Auriculares Pro',
  description: 'Desc',
  priceInCents: 249900,
  currency: 'COP',
  stock: 4,
  imageUrl: null,
  isPurchasable: true,
};

function makeStore() {
  const defaultProducts: ProductsState = {
    products: [product],
    status: 'succeeded',
    error: null,
  };
  const defaultCheckout: RootState['checkout'] = {
    step: 'summary',
    selectedProductId: 'product-1',
    customer: {
      email: 'cliente@test.com',
      firstName: 'Juan',
      lastName: 'Perez',
      documentType: 'CC',
      documentNumber: '1067981234',
      phone: '3001234567',
    },
    delivery: {
      addressLine1: 'Calle 123 # 45-67',
      addressLine2: '',
      city: 'Bogota',
      state: 'Cundinamarca',
      postalCode: '110111',
      country: 'CO',
      notes: '',
    },
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
      products: defaultProducts,
      checkout: defaultCheckout,
    },
  });
}

function fillCard() {
  fireEvent.change(screen.getByTestId('card-number'), { target: { value: '4242424242424242' } });
  fireEvent.change(screen.getByTestId('card-holder'), { target: { value: 'Juan Perez' } });
  fireEvent.change(screen.getByTestId('card-expiry'), { target: { value: '12/99' } });
  fireEvent.change(screen.getByTestId('card-cvc'), { target: { value: '123' } });
}

describe('SummaryBackdrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenizeCard as jest.Mock).mockResolvedValue({
      id: 'tok_123',
      brand: 'VISA',
      lastFour: '4242',
    });
    mockApi.createCheckout.mockResolvedValue({
      transaction: {
        id: 'tx-1',
        reference: 'REF-1',
        gatewayTransactionId: 'gateway-1',
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
        customerEmail: 'cliente@test.com',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      product,
      customer: {
        id: 'c-1',
        email: 'cliente@test.com',
        firstName: 'Juan',
        lastName: 'Perez',
        documentType: 'CC',
        documentNumber: '1067981234',
        phone: null,
      },
      delivery: {
        id: 'd-1',
        status: 'ASSIGNED',
        addressLine1: 'Calle 123 # 45-67',
        addressLine2: null,
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        country: 'CO',
      },
      requiresSync: false,
    });
  });

  it('muestra el desglose del total y la entrega', () => {
    render(
      <Provider store={makeStore()}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText('Resumen y pago')).toBeInTheDocument();
    expect(screen.getByText(/2\.499/)).toBeInTheDocument();
    expect(screen.getByTestId('summary-total').textContent).toContain('2.579');
    expect(screen.getByText(/Calle 123 # 45-67/)).toBeInTheDocument();
  });

  it('ingresa la tarjeta, tokeniza y envía el pago', async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    fillCard();
    fireEvent.click(screen.getByTestId('card-continue'));

    await waitFor(() => {
      expect(tokenizeCard).toHaveBeenCalledTimes(1);
    });
    expect(mockApi.createCheckout).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(store.getState().checkout.step).toBe('result');
    });
    expect(store.getState().checkout.card?.lastFour).toBe('4242');
  });

  it('muestra un error si la tokenización falla', async () => {
    (tokenizeCard as jest.Mock).mockRejectedValue(
      new TokenizationError('La tarjeta fue rechazada'),
    );
    render(
      <Provider store={makeStore()}>
        <SummaryBackdrop />
      </Provider>,
    );

    fillCard();
    fireEvent.click(screen.getByTestId('card-continue'));

    expect(
      await screen.findByText('La tarjeta fue rechazada'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('summary-error')).toBeInTheDocument();
    expect(mockApi.createCheckout).not.toHaveBeenCalled();
  });

  it('permite volver a editar los datos', async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar datos' }));
    expect(store.getState().checkout.step).toBe('payment');
  });

  it('muestra errores del pago provenientes del backend', () => {
    const store = makeStore();
    store.dispatch({
      type: 'checkout/setError',
      payload: 'Sin stock disponible',
    });
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByTestId('checkout-error').textContent).toContain('Sin stock');
  });

  it('no renderiza si falta el producto o datos', () => {
    const store = makeStore();
    store.dispatch({ type: 'checkout/startCheckout', payload: 'no-existe' });
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.queryByTestId('summary-backdrop')).not.toBeInTheDocument();
  });
});