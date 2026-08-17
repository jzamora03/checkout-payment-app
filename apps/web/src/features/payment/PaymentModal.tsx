import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import {
  goToProduct,
  goToSummary,
  setCard,
  setCardToken,
  setCustomer,
  setDelivery,
} from '../checkout/checkoutSlice';
import { tokenizeCard, TokenizationError } from '../../services/wompi';
import type {
  CardForm as CardData,
  CustomerForm as CustomerData,
  DeliveryForm as DeliveryData,
} from '../../types';
import { formatCurrency } from '../../utils/format';
import CardForm from './CardForm';
import CustomerForm, { isCustomerValid } from './CustomerForm';
import DeliveryForm, { isDeliveryValid } from './DeliveryForm';

function emptyCustomer(): CustomerData {
  return {
    email: '',
    firstName: '',
    lastName: '',
    documentType: 'CC',
    documentNumber: '',
    phone: '',
  };
}

function emptyDelivery(): DeliveryData {
  return {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'CO',
    notes: '',
  };
}

function PaymentModal() {
  const dispatch = useDispatch<AppDispatch>();
  const product = useSelector((state: RootState) => {
    const selectedId = state.checkout.selectedProductId;
    return state.products.products.find((item) => item.id === selectedId) ?? null;
  });
  const persisted = useSelector((state: RootState) => state.checkout);

  const [customer, setCustomerLocal] = useState<CustomerData>(
    persisted.customer ?? emptyCustomer(),
  );
  const [delivery, setDeliveryLocal] = useState<DeliveryData>(
    persisted.delivery ?? emptyDelivery(),
  );
  const [card] = useState<CardData>(() => ({
    number: '',
    holder: persisted.card?.holder ?? '',
    expiry: persisted.card?.expiry ?? '',
    cvc: '',
  }));
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalInCents = useMemo(
    () => (product ? product.priceInCents + 3000 + 5000 : 0),
    [product],
  );

  if (!product) {
    return null;
  }

  const handleCancel = () => {
    dispatch(goToProduct());
  };

  const handleValidCard = async (validCard: CardData) => {
    setGeneralError(null);
    const customerValid = isCustomerValid(customer);
    const deliveryValid = isDeliveryValid(delivery);

    if (!customerValid || !deliveryValid) {
      setGeneralError(
        'Revisa los datos del cliente y de la entrega para continuar.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await tokenizeCard(validCard);
      dispatch(setCustomer(customer));
      dispatch(setDelivery(delivery));
      dispatch(
        setCard({
          brand: token.brand,
          lastFour: token.lastFour,
          holder: validCard.holder,
          expiry: validCard.expiry,
        }),
      );
      dispatch(setCardToken(token.id));
      dispatch(goToSummary());
    } catch (error) {
      if (error instanceof TokenizationError) {
        setGeneralError(error.message);
      } else {
        setGeneralError('No fue posible validar la tarjeta. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Pago con tarjeta">
      <div className="modal-sheet">
        <header className="modal-sheet__header">
          <div>
            <h2 className="modal-sheet__title">Pagar con tarjeta</h2>
            <p className="modal-sheet__product">
              {product.name} · {formatCurrency(totalInCents)}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={handleCancel}
            aria-label="Cerrar"
            data-testid="modal-close"
          >
            ×
          </button>
        </header>

        <div className="modal-sheet__body">
          {generalError && (
            <div className="alert alert--error" role="alert" data-testid="modal-error">
              {generalError}
            </div>
          )}

          <CustomerForm initial={customer} onChange={setCustomerLocal} />
          <CardForm initial={card} onValid={handleValidCard} onInvalid={() => setGeneralError(null)} />
          <DeliveryForm initial={delivery} onChange={setDeliveryLocal} />

          {submitting && (
            <div className="modal-sheet__loading" role="status">
              Validando tarjeta...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;