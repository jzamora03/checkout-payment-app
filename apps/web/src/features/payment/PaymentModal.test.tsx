import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PaymentModal from './PaymentModal';
import productsReducer, { ProductsState } from '../products/productsSlice';
import checkoutReducer from '../checkout/checkoutSlice';
import type { RootState } from '../../app/store';

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

function fillCustomer() {
  fireEvent.change(screen.getByTestId('customer-email'), { target: { value: 'cliente@test.com' } });
  fireEvent.change(screen.getByTestId('customer-firstName'), { target: { value: 'Juan' } });
  fireEvent.change(screen.getByTestId('customer-lastName'), { target: { value: 'Perez' } });
  fireEvent.change(screen.getByTestId('customer-documentNumber'), { target: { value: '1067981234' } });
  fireEvent.change(screen.getByTestId('customer-phone'), { target: { value: '3001234567' } });
}

function fillDelivery() {
  fireEvent.change(screen.getByTestId('delivery-address'), { target: { value: 'Calle 123 # 45-67' } });
  fireEvent.change(screen.getByTestId('delivery-city'), { target: { value: 'Bogota' } });
  fireEvent.change(screen.getByTestId('delivery-state'), { target: { value: 'Cundinamarca' } });
  fireEvent.change(screen.getByTestId('delivery-postal'), { target: { value: '110111' } });
}

describe('PaymentModal (wizard)', () => {
  it('muestra el producto seleccionado y el primer paso', () => {
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );
    expect(screen.getByText('Pagar con tarjeta')).toBeInTheDocument();
    expect(screen.getByText(/Auriculares Pro/)).toBeInTheDocument();
    expect(screen.getByTestId('step-customer')).toBeInTheDocument();
  });

  it('muestra error si faltan datos del cliente', () => {
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );
    fireEvent.click(screen.getByTestId('step-customer-next'));
    expect(screen.getByTestId('modal-error')).toHaveTextContent(
      'Revisa los datos del cliente para continuar.',
    );
    expect(screen.getByTestId('step-customer')).toBeInTheDocument();
  });

  it('navega al paso de entrega y permite volver atrás', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <PaymentModal />
      </Provider>,
    );
    fillCustomer();
    fireEvent.click(screen.getByTestId('step-customer-next'));

    expect(screen.getByTestId('step-delivery')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('step-delivery-back'));
    expect(screen.getByTestId('step-customer')).toBeInTheDocument();
  });

  it('guarda cliente y entrega y avanza al resumen', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <PaymentModal />
      </Provider>,
    );
    fillCustomer();
    fireEvent.click(screen.getByTestId('step-customer-next'));

    fillDelivery();
    fireEvent.click(screen.getByTestId('step-delivery-next'));

    const state = store.getState().checkout;
    expect(state.step).toBe('summary');
    expect(state.customer?.email).toBe('cliente@test.com');
    expect(state.delivery?.city).toBe('Bogota');
  });

  it('muestra error si faltan datos de entrega', () => {
    render(
      <Provider store={makeStore()}>
        <PaymentModal />
      </Provider>,
    );
    fillCustomer();
    fireEvent.click(screen.getByTestId('step-customer-next'));

    fireEvent.click(screen.getByTestId('step-delivery-next'));
    expect(screen.getByTestId('modal-error')).toHaveTextContent(
      'Revisa los datos de la entrega para continuar.',
    );
  });

  it('cierra el modal y vuelve al catálogo', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <PaymentModal />
      </Provider>,
    );

    fireEvent.click(screen.getByTestId('modal-close'));
    expect(store.getState().checkout.step).toBe('product');
  });
});