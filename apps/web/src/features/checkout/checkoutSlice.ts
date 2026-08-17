import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import type {
  CheckoutResponse,
  CheckoutTransactionPayload,
  CustomerForm,
  DeliveryForm,
  TransactionStatus,
} from './checkoutTypes';

export type CheckoutStep = 'product' | 'payment' | 'summary' | 'processing' | 'result';

export interface MaskedCard {
  brand: string;
  lastFour: string;
  holder: string;
  expiry: string;
}

export interface CheckoutPersistState {
  step: CheckoutStep;
  selectedProductId: string | null;
  customer: CustomerForm | null;
  delivery: DeliveryForm | null;
  card: MaskedCard | null;
  transactionReference: string | null;
  transactionStatus: TransactionStatus | null;
  requiresSync: boolean;
}

export interface CheckoutState extends CheckoutPersistState {
  processing: boolean;
  error: string | null;
  lastResponse: CheckoutResponse | null;
}

const initialState: CheckoutState = {
  step: 'product',
  selectedProductId: null,
  customer: null,
  delivery: null,
  card: null,
  transactionReference: null,
  transactionStatus: null,
  requiresSync: false,
  processing: false,
  error: null,
  lastResponse: null,
};

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollUntilFinal(reference: string): Promise<CheckoutResponse> {
  let response = await api.getTransactionStatus(reference);
  let attempts = 0;
  while (response.requiresSync && attempts < MAX_POLL_ATTEMPTS) {
    await sleep(POLL_INTERVAL_MS);
    response = await api.getTransactionStatus(reference);
    attempts += 1;
  }
  return response;
}

export const submitPayment = createAsyncThunk<
  CheckoutResponse,
  { cardToken: string },
  { state: { checkout: CheckoutState } }
>('checkout/submitPayment', async ({ cardToken }, { getState }) => {
  const state = getState().checkout;
  if (!state.selectedProductId || !state.customer || !state.delivery) {
    throw new Error('Faltan datos del checkout');
  }
  const payload: CheckoutTransactionPayload = {
    productId: state.selectedProductId,
    cardToken,
    customer: state.customer,
    delivery: state.delivery,
  };
  const response = await api.createCheckout(payload);
  if (response.requiresSync) {
    return pollUntilFinal(response.transaction.reference);
  }
  return response;
});

export const refreshTransactionStatus = createAsyncThunk<CheckoutResponse, string>(
  'checkout/refreshStatus',
  async (reference) => {
    return pollUntilFinal(reference);
  },
);

export function persistCheckoutState(state: CheckoutPersistState): void {
  window.localStorage.setItem('checkout-state-v1', JSON.stringify(state));
}

export function loadCheckoutState(): CheckoutState {
  try {
    const raw = window.localStorage.getItem('checkout-state-v1');
    if (!raw) {
      return initialState;
    }
    return { ...initialState, ...(JSON.parse(raw) as Partial<CheckoutState>) };
  } catch {
    return initialState;
  }
}

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    startCheckout: (state, action: PayloadAction<string>) => {
      state.selectedProductId = action.payload;
      state.step = 'payment';
      state.customer = null;
      state.delivery = null;
      state.card = null;
      state.transactionReference = null;
      state.transactionStatus = null;
      state.requiresSync = false;
      state.error = null;
      state.lastResponse = null;
    },
    setCustomer: (state, action: PayloadAction<CustomerForm>) => {
      state.customer = action.payload;
    },
    setDelivery: (state, action: PayloadAction<DeliveryForm>) => {
      state.delivery = action.payload;
    },
    setCard: (state, action: PayloadAction<MaskedCard>) => {
      state.card = action.payload;
    },
    goToSummary: (state) => {
      if (state.selectedProductId && state.customer && state.delivery && state.card) {
        state.step = 'summary';
      }
    },
    goToPayment: (state) => {
      state.step = 'payment';
    },
    goToProduct: (state) => {
      state.step = 'product';
    },
    resetCheckout: () => {
      return { ...initialState };
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.processing = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPayment.pending, (state) => {
        state.step = 'processing';
        state.processing = true;
        state.error = null;
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.processing = false;
        state.lastResponse = action.payload;
        state.transactionReference = action.payload.transaction.reference;
        state.transactionStatus = action.payload.transaction.status;
        state.requiresSync = false;
        state.step = 'result';
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.processing = false;
        state.step = 'summary';
        state.error = action.error.message ?? 'No fue posible procesar el pago';
      })
      .addCase(refreshTransactionStatus.pending, (state) => {
        state.processing = true;
      })
      .addCase(refreshTransactionStatus.fulfilled, (state, action) => {
        state.processing = false;
        state.lastResponse = action.payload;
        state.transactionReference = action.payload.transaction.reference;
        state.transactionStatus = action.payload.transaction.status;
        state.requiresSync = false;
        state.step = 'result';
      })
      .addCase(refreshTransactionStatus.rejected, (state, action) => {
        state.processing = false;
        state.error = action.error.message ?? 'No fue posible consultar el estado';
      });
  },
});

export const {
  startCheckout,
  setCustomer,
  setDelivery,
  setCard,
  goToSummary,
  goToPayment,
  goToProduct,
  resetCheckout,
  setProcessing,
  setError,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;