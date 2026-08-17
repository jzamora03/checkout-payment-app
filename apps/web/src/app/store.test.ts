import { configureStore } from '@reduxjs/toolkit';
import { store as appStore } from './store';
import checkoutReducer, {
  CheckoutPersistState,
  loadCheckoutState,
  persistCheckoutState,
  startCheckout,
} from '../features/checkout/checkoutSlice';

describe('store / persistencia', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persiste el estado del checkout en localStorage', () => {
    const store = appStore;
    jest.useFakeTimers();
    store.dispatch(startCheckout('product-1'));
    jest.runAllTimers();
    jest.useRealTimers();

    const raw = window.localStorage.getItem('checkout-state-v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toMatchObject({
      step: 'payment',
      selectedProductId: 'product-1',
    });
  });

  it('recupera el estado guardado al rehidratar', () => {
    const persisted: CheckoutPersistState = {
      step: 'summary',
      selectedProductId: 'product-1',
      customer: null,
      delivery: null,
      card: { brand: 'visa', lastFour: '4242', holder: 'Juan', expiry: '12/99' },
      transactionReference: null,
      transactionStatus: null,
      requiresSync: false,
    };
    persistCheckoutState(persisted);

    const restored = loadCheckoutState();
    expect(restored.step).toBe('summary');
    expect(restored.card?.lastFour).toBe('4242');
    expect(restored.processing).toBe(false);
  });

  it('ignora datos corruptos y devuelve el estado inicial', () => {
    window.localStorage.setItem('checkout-state-v1', '{no-json');
    const restored = loadCheckoutState();
    expect(restored.step).toBe('product');
  });

  it('el store combina los reducers', () => {
    const store = configureStore({
      reducer: {
        checkout: checkoutReducer,
      },
    });
    expect(store.getState().checkout.step).toBe('product');
  });
});