import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentModal from './PaymentModal';
import productsReducer, { ProductsState } from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { RootState } from '../../app/store';
import { TokenizationError } from '../../services/wompi';

jest.mock('../../services/wompi', () => ({
  tokenizeCard: jest.fn(),
  TokenizationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TokenizationError';
    }
  },
}));

import { tokenizeCard } from '../../services/wompi';

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
  const defaultCheckout: RootState['checkout'] = {
    step: 'payment',
    selectedProductId: 'product-1',
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
  const defaultProducts: ProductsState = {
    products: [product],
    status: 'succeeded',
    error: null,
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

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('customer-email'), 'cliente@test.com');
  await user.type(screen.getByTestId('customer-firstName'), 'Juan');
  await user.type(screen.getByTestId('customer-lastName'), 'Perez');
  await user.type(screen.getByTestId('customer-documentNumber'), '1067981234');
  await user.type(screen.getByTestId('customer-phone'), '3001234567');

  await user.type(screen.getByTestId('card-number'), '4242424242424242');
  await user.type(screen.getByTestId('card-holder'), 'Juan Perez');
  await user.type(screen.getByTestId('card-expiry'), '12/99');
  await user.type(screen.getByTestId('card-cvc'), '123');

  await user.type(screen.getByTestId('delivery-address'), 'Calle 123 # 45-67');
  await user.type(screen.getByTestId('delivery-city'), 'Bogota');
  await user.type(screen.getByTestId('delivery-state'), 'Cundinamarca');
  await user.type(screen.getByTestId('delivery-postal'), '110111');
}

describe('PaymentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenizeCard as jest.Mock).mockResolvedValue({
      id: 'tok_123',
      brand: 'VISA',
      lastFour: '4242',
    });
  });

  it('muestra el producto seleccionado', () => {
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );
    expect(screen.getByText('Pagar con tarjeta')).toBeInTheDocument();
    expect(screen.getByText(/Auriculares Pro/)).toBeInTheDocument();
  });

  it('muestra error si faltan datos de cliente o entrega', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );

    await user.type(screen.getByTestId('card-number'), '4242424242424242');
    await user.type(screen.getByTestId('card-holder'), 'Juan Perez');
    await user.type(screen.getByTestId('card-expiry'), '12/99');
    await user.type(screen.getByTestId('card-cvc'), '123');
    await user.click(screen.getByTestId('card-continue'));

    expect(
      await screen.findByText('Revisa los datos del cliente y de la entrega para continuar.'),
    ).toBeInTheDocument();
    expect(tokenizeCard).not.toHaveBeenCalled();
  });

  it('tokeniza la tarjeta y avanza al resumen con datos válidos', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    render(
      <Provider store={store}>
        <PaymentModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.click(screen.getByTestId('card-continue'));

    await waitFor(() => {
      expect(tokenizeCard).toHaveBeenCalledTimes(1);
    });
    const state = store.getState().checkout;
    expect(state.step).toBe('summary');
    expect(state.cardToken).toBe('tok_123');
    expect(state.card?.lastFour).toBe('4242');
    expect(state.customer?.email).toBe('cliente@test.com');
  });

  it('muestra un error si la tokenización falla', async () => {
    (tokenizeCard as jest.Mock).mockRejectedValue(
      new TokenizationError('La tarjeta fue rechazada'),
    );
    const user = userEvent.setup();
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );

    await fillValidForm(user);
    await user.click(screen.getByTestId('card-continue'));

    expect(
      await screen.findByText('La tarjeta fue rechazada'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('modal-error')).toBeInTheDocument();
  });

  it('cierra el modal y vuelve al catálogo', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    render(
      <Provider store={store}>
        <PaymentModal />
      </Provider>,
    );

    await user.click(screen.getByTestId('modal-close'));
    expect(store.getState().checkout.step).toBe('product');
  });
});