import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SummaryBackdrop from './SummaryBackdrop';
import productsReducer, { ProductsState } from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { RootState } from '../../app/store';

jest.mock('../../services/api', () => ({
  api: {
    createCheckout: jest.fn(),
    getTransactionStatus: jest.fn(),
  },
}));

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

function makeStore(overrides: Partial<RootState['checkout']> = {}) {
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
    card: { brand: 'visa', lastFour: '4242', holder: 'Juan Perez', expiry: '12/99' },
    cardToken: 'tok_123',
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
      checkout: { ...defaultCheckout, ...overrides },
    },
  });
}

describe('SummaryBackdrop', () => {
  it('muestra el desglose del total', () => {
    render(
      <Provider store={makeStore()}>
        <SummaryBackdrop />
      </Provider>,
    );

    expect(screen.getByText('Resumen de tu compra')).toBeInTheDocument();
    expect(screen.getByText(/2\.499/)).toBeInTheDocument();
    expect(screen.getByTestId('summary-total').textContent).toContain('2.579');
    expect(screen.getByTestId('summary-card').textContent).toContain('4242');
  });

  it('deshabilita el botón de pagar sin token de tarjeta', () => {
    render(
      <Provider store={makeStore({ cardToken: null })}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByTestId('summary-pay')).toBeDisabled();
    expect(screen.getByTestId('summary-reentry')).toBeInTheDocument();
  });

  it('permite volver a editar los datos', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    render(
      <Provider store={store}>
        <SummaryBackdrop />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Editar datos' }));
    expect(store.getState().checkout.step).toBe('payment');
  });

  it('muestra errores del pago', () => {
    render(
      <Provider store={makeStore({ error: 'Sin stock disponible' })}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(screen.getByTestId('summary-error').textContent).toContain('Sin stock');
  });

  it('no renderiza si falta el producto o datos', () => {
    const { container } = render(
      <Provider store={makeStore({ selectedProductId: 'no-existe' })}>
        <SummaryBackdrop />
      </Provider>,
    );
    expect(container.firstChild).toBeNull();
  });
});