import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { goToProduct, resetCheckout } from '../checkout/checkoutSlice';
import { formatCurrency } from '../../utils/format';

function ResultView() {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector((state: RootState) => state.checkout);

  const handleBack = () => {
    dispatch(resetCheckout());
    dispatch(goToProduct());
  };

  const response = checkout.lastResponse;

  const getHeading = () => {
    switch (checkout.transactionStatus) {
      case 'APPROVED':
        return '¡Pago exitoso!';
      case 'DECLINED':
        return 'Pago rechazado';
      case 'ERROR':
      case 'VOIDED':
        return 'Ocurrió un error';
      default:
        return 'Procesando pago...';
    }
  };

  const getMessage = () => {
    if (checkout.transactionStatus === 'APPROVED') {
      return 'Tu compra fue confirmada y tu producto ya está reservado para envío.';
    }
    if (checkout.transactionStatus === 'DECLINED') {
      return 'La pasarela rechazó el pago. Verifica tu tarjeta o intenta con otra.';
    }
    if (checkout.transactionStatus === 'ERROR' || checkout.transactionStatus === 'VOIDED') {
      return 'No fue posible completar el pago. Intenta de nuevo en unos minutos.';
    }
    return 'Estamos confirmando tu pago con la pasarela...';
  };

  const isProcessing = checkout.processing || !checkout.transactionStatus;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Resultado del pago">
      <div className={`result ${isProcessing ? 'result--processing' : ''}`}>
        {isProcessing ? (
          <>
            <div className="spinner" aria-hidden="true" />
            <h2 className="result__title">{getHeading()}</h2>
            <p className="result__message">{getMessage()}</p>
          </>
        ) : (
          <>
            <div
              className={`result__icon result__icon--${checkout.transactionStatus?.toLowerCase()}`}
              aria-hidden="true"
            >
              {checkout.transactionStatus === 'APPROVED' ? '✓' : '✕'}
            </div>
            <h2 className="result__title">{getHeading()}</h2>
            <p className="result__message">{getMessage()}</p>

            {response && (
              <dl className="result__details">
                <div>
                  <dt>Referencia</dt>
                  <dd data-testid="result-reference">{response.transaction.reference}</dd>
                </div>
                <div>
                  <dt>Total pagado</dt>
                  <dd>{formatCurrency(response.transaction.totalInCents)}</dd>
                </div>
                {checkout.transactionStatus !== 'APPROVED' &&
                  response.transaction.statusMessage && (
                    <div>
                      <dt>Motivo</dt>
                      <dd>{response.transaction.statusMessage}</dd>
                    </div>
                  )}
              </dl>
            )}

            {checkout.error && (
              <div className="alert alert--error" role="alert">
                {checkout.error}
              </div>
            )}

            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={handleBack}
              data-testid="result-back"
            >
              Volver a la tienda
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ResultView;