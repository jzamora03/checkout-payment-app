import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import {
  goToPayment,
  goToProduct,
  submitPayment,
} from '../checkout/checkoutSlice';
import { formatCurrency } from '../../utils/format';

function SummaryBackdrop() {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector((state: RootState) => state.checkout);
  const product = useSelector((state: RootState) =>
    state.products.products.find((item) => item.id === state.checkout.selectedProductId),
  );

  if (!product || !checkout.customer || !checkout.delivery || !checkout.card) {
    return null;
  }

  const baseFee = 3000;
  const deliveryFee = 5000;
  const total = product.priceInCents + baseFee + deliveryFee;

  const handlePay = () => {
    if (!checkout.cardToken) {
      dispatch(goToPayment());
      return;
    }
    void dispatch(submitPayment({ cardToken: checkout.cardToken }));
  };

  return (
    <div className="backdrop" role="dialog" aria-modal="true" aria-label="Resumen del pago">
      <div className="backdrop__panel">
        <header className="backdrop__header">
          <h2 className="backdrop__title">Resumen de tu compra</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => dispatch(goToProduct())}
            aria-label="Cerrar"
            data-testid="summary-close"
          >
            ×
          </button>
        </header>

        <div className="summary">
          <div className="summary__product">
            <div className="summary__product-name">
              {product.name}
              <span className="summary__product-qty">×1</span>
            </div>
            <span>{formatCurrency(product.priceInCents)}</span>
          </div>

          <div className="summary__line">
            <span>Tarifa base</span>
            <span>{formatCurrency(baseFee)}</span>
          </div>
          <div className="summary__line">
            <span>Envío</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>

          <div className="summary__total">
            <strong>Total</strong>
            <strong data-testid="summary-total">{formatCurrency(total)}</strong>
          </div>

          <div className="summary__section">
            <span className="summary__label">Entrega a</span>
            <p className="summary__value">
              {checkout.delivery.addressLine1}, {checkout.delivery.city},{' '}
              {checkout.delivery.state}
            </p>
          </div>

          <div className="summary__section">
            <span className="summary__label">Tarjeta</span>
            <p className="summary__value" data-testid="summary-card">
              {checkout.card.brand.toUpperCase()} •••• {checkout.card.lastFour}
            </p>
          </div>

          {checkout.error && (
            <div className="alert alert--error" role="alert" data-testid="summary-error">
              {checkout.error}
            </div>
          )}

          {!checkout.cardToken && (
            <div className="alert" role="status" data-testid="summary-reentry">
              Tu tarjeta se invalidó al recargar. Vuelve a ingresarla para continuar.
            </div>
          )}
        </div>

        <div className="backdrop__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => dispatch(goToPayment())}
          >
            Editar datos
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePay}
            disabled={!checkout.cardToken || checkout.processing}
            data-testid="summary-pay"
          >
            Pagar {formatCurrency(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SummaryBackdrop;