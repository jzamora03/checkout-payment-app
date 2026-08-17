import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Backdrop from '@mui/material/Backdrop';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import type { AppDispatch, RootState } from '../../app/store';
import {
  goToPayment,
  goToProduct,
  setCard,
  setCardToken,
  submitPayment,
} from '../checkout/checkoutSlice';
import { tokenizeCard, TokenizationError } from '../../services/wompi';
import type { CardForm as CardData } from '../../types';
import { formatCurrency } from '../../utils/format';
import CardForm from '../payment/CardForm';

function SummaryBackdrop() {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector((state: RootState) => state.checkout);
  const product = useSelector((state: RootState) =>
    state.products.products.find((item) => item.id === state.checkout.selectedProductId),
  );

  const [card] = useState<CardData>(() => ({
    number: '',
    holder: checkout.card?.holder ?? '',
    expiry: checkout.card?.expiry ?? '',
    cvc: '',
  }));
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!product || !checkout.customer || !checkout.delivery) {
    return null;
  }

  const baseFee = 3000;
  const deliveryFee = 5000;
  const total = product.priceInCents + baseFee + deliveryFee;

  const handlePay = async (validCard: CardData) => {
    setPaymentError(null);
    setSubmitting(true);
    try {
      const token = await tokenizeCard(validCard);
      dispatch(setCard({ brand: token.brand, lastFour: token.lastFour, holder: validCard.holder, expiry: validCard.expiry }));
      dispatch(setCardToken(token.id));
      void dispatch(submitPayment({ cardToken: token.id }));
    } catch (error) {
      if (error instanceof TokenizationError) {
        setPaymentError(error.message);
      } else {
        setPaymentError('No fue posible validar la tarjeta. Intenta de nuevo.');
      }
      setSubmitting(false);
    }
  };

  return (
    <Backdrop
      open
      sx={{ zIndex: 50, backdropFilter: 'blur(4px)', alignItems: 'flex-end', justifyContent: 'center' }}
      role="dialog"
      aria-modal="true"
      aria-label="Resumen y pago"
      data-testid="summary-backdrop"
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px 18px 0 0',
          '@media (min-width: 600px)': { borderRadius: '18px' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="h6">Resumen y pago</Typography>
            <Typography variant="body2" color="text.secondary">
              Revisa tu compra y completa la tarjeta
            </Typography>
          </Box>
          <IconButton
            aria-label="Cerrar"
            onClick={() => dispatch(goToProduct())}
            data-testid="summary-close"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 2.5, pt: 1, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {product.name}
              </Typography>
              <Box
                component="span"
                sx={{
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  bgcolor: 'rgba(79, 70, 229, 0.1)',
                  px: 1,
                  py: 0.25,
                  borderRadius: 999,
                }}
              >
                ×1
              </Box>
            </Box>
            <Typography variant="body1">{formatCurrency(product.priceInCents)}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tarifa base
            </Typography>
            <Typography variant="body2">{formatCurrency(baseFee)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Envío
            </Typography>
            <Typography variant="body2">{formatCurrency(deliveryFee)}</Typography>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6" data-testid="summary-total">
              {formatCurrency(total)}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ py: 1.25 }}>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              <LocalShippingIcon fontSize="small" /> Entrega a
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {checkout.delivery.addressLine1}, {checkout.delivery.city},{' '}
              {checkout.delivery.state}
            </Typography>
          </Box>

          <Divider />

          {!checkout.cardToken && (
            <Alert severity="info" icon={false} sx={{ mt: 1, fontSize: '0.8rem' }} data-testid="summary-reentry">
              Ingresa los datos de tu tarjeta para pagar.
            </Alert>
          )}

          {paymentError && (
            <Alert severity="error" sx={{ mt: 1, fontSize: '0.85rem' }} data-testid="summary-error">
              {paymentError}
            </Alert>
          )}

          {checkout.error && (
            <Alert severity="error" sx={{ mt: 1, fontSize: '0.85rem' }} data-testid="checkout-error">
              {checkout.error}
            </Alert>
          )}

          <CardForm
            initial={card}
            onValid={handlePay}
            submitLabel={`Pagar ${formatCurrency(total)}`}
            disabled={submitting}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1 }}>
            <LockIcon fontSize="small" color="disabled" />
            <Typography variant="caption" color="text.secondary">
              Pago seguro en ambiente de pruebas (sandbox)
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
          <Button variant="text" color="inherit" onClick={() => dispatch(goToPayment())}>
            Editar datos
          </Button>
        </Box>
      </Paper>
    </Backdrop>
  );
}

export default SummaryBackdrop;