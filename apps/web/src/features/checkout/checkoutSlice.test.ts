import { configureStore } from '@reduxjs/toolkit';
import checkoutReducer, {
  goToProduct,
  goToSummary,
  resetCheckout,
  setCard,
  setCardToken,
  setCustomer,
  setDelivery,
  startCheckout,
  submitPayment,
} from './checkoutSlice';

jest.mock('../../services/api', () => ({
  api: {
    createCheckout: jest.fn(),
    getTransactionStatus: jest.fn(),
  },
}));

import { api } from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

function makeStore() {
  return configureStore({
    reducer: {
      checkout: checkoutReducer,
    },
  });
}

const customer = {
  email: 'cliente@test.com',
  firstName: 'Juan',
  lastName: 'Perez',
  documentType: 'CC' as const,
  documentNumber: '1067981234',
  phone: '3001234567',
};

const delivery = {
  addressLine1: 'Calle 123 # 45-67',
  addressLine2: '',
  city: 'Bogota',
  state: 'Cundinamarca',
  postalCode: '110111',
  country: 'CO',
  notes: '',
};

const checkoutResponse = {
  transaction: {
    id: 'tx-1',
    reference: 'REF-1',
    wompiTransactionId: 'wompi-1',
    status: 'APPROVED' as const,
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
  product: {
    id: 'product-1',
    sku: 'SKU',
    name: 'Producto',
    description: 'Desc',
    priceInCents: 100000,
    currency: 'COP',
    stock: 4,
    imageUrl: null,
    isPurchasable: true,
  },
  customer: { id: 'c-1', ...customer },
  delivery: { id: 'd-1', status: 'ASSIGNED', ...delivery },
  requiresSync: false,
};

describe('checkoutSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('inicia el checkout desde el paso de pago', () => {
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    const state = store.getState().checkout;
    expect(state.step).toBe('payment');
    expect(state.selectedProductId).toBe('product-1');
  });

  it('guarda cliente, entrega y tarjeta', () => {
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    store.dispatch(setCustomer(customer));
    store.dispatch(setDelivery(delivery));
    store.dispatch(
      setCard({ brand: 'visa', lastFour: '4242', holder: 'Juan Perez', expiry: '12/99' }),
    );
    store.dispatch(setCardToken('tok_123'));

    const state = store.getState().checkout;
    expect(state.customer?.email).toBe('cliente@test.com');
    expect(state.cardToken).toBe('tok_123');
    expect(state.card?.lastFour).toBe('4242');
  });

  it('va al resumen con cliente y entrega (la tarjeta se ingresa en el resumen)', () => {
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    store.dispatch(goToSummary());
    expect(store.getState().checkout.step).toBe('payment');

    store.dispatch(setCustomer(customer));
    store.dispatch(goToSummary());
    expect(store.getState().checkout.step).toBe('payment');

    store.dispatch(setDelivery(delivery));
    store.dispatch(goToSummary());
    expect(store.getState().checkout.step).toBe('summary');
  });

  it('vuelve a la página de producto', () => {
    const store = makeStore();
    store.dispatch(goToProduct());
    expect(store.getState().checkout.step).toBe('product');
  });

  it('resetea el checkout', () => {
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    store.dispatch(resetCheckout());
    const state = store.getState().checkout;
    expect(state.step).toBe('product');
    expect(state.selectedProductId).toBeNull();
    expect(state.lastResponse).toBeNull();
  });

  it('envía el pago y guarda el resultado', async () => {
    mockApi.createCheckout.mockResolvedValue(checkoutResponse);
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    store.dispatch(setCustomer(customer));
    store.dispatch(setDelivery(delivery));

    await store.dispatch(submitPayment({ cardToken: 'tok_123' }));

    const state = store.getState().checkout;
    expect(state.step).toBe('result');
    expect(state.transactionStatus).toBe('APPROVED');
    expect(state.transactionReference).toBe('REF-1');
    expect(state.lastResponse).toEqual(checkoutResponse);
  });

  it('vuelve al resumen si el pago falla', async () => {
    mockApi.createCheckout.mockRejectedValue(new Error('Sin stock'));
    const store = makeStore();
    store.dispatch(startCheckout('product-1'));
    store.dispatch(setCustomer(customer));
    store.dispatch(setDelivery(delivery));

    await store.dispatch(submitPayment({ cardToken: 'tok_123' }));

    const state = store.getState().checkout;
    expect(state.step).toBe('summary');
    expect(state.error).toContain('Sin stock');
    expect(state.processing).toBe(false);
  });
});