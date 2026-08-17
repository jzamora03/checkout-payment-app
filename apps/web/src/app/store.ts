import { configureStore } from '@reduxjs/toolkit';
import productsReducer from '../features/products/productsSlice';
import checkoutReducer, {
  loadCheckoutState,
  persistCheckoutState,
} from '../features/checkout/checkoutSlice';

export const store = configureStore({
  reducer: {
    products: productsReducer,
    checkout: checkoutReducer,
  },
  preloadedState: {
    checkout: loadCheckoutState(),
  },
});

let persistenceTimer: ReturnType<typeof setTimeout> | undefined;

store.subscribe(() => {
  const state = store.getState().checkout;
  if (persistenceTimer) {
    clearTimeout(persistenceTimer);
  }
  persistenceTimer = setTimeout(() => {
    persistCheckoutState({
      step: state.step,
      selectedProductId: state.selectedProductId,
      customer: state.customer,
      delivery: state.delivery,
      card: state.card,
      transactionReference: state.transactionReference,
      transactionStatus: state.transactionStatus,
      requiresSync: state.requiresSync,
    });
  }, 200);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;