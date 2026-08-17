import { useDispatch, useSelector } from 'react-redux';
import Backdrop from '@mui/material/Backdrop';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
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
    <Backdrop
      open
      sx={{ zIndex: 50, backdropFilter: 'blur(4px)', alignItems: 'flex-end', justifyContent: 'center' }}
      role="dialog"
      aria-modal="true"
      aria-label="Resumen del pago"
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
          <Typography variant="h6">Resumen de tu compra</Typography>
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
                sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'rgba(79, 70, 229, 0.1)', px: 1, py: 0.25, borderRadius: 999 }}
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

          <Box sx={{ py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Tarjeta
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }} data-testid="summary-card">
              {checkout.card.brand.toUpperCase()} •••• {checkout.card.lastFour}
            </Typography>
          </Box>

          {checkout.error && (
            <Box sx={{ py: 1 }} data-testid="summary-error">
              <Typography variant="body2" color="error">
                {checkout.error}
              </Typography>
            </Box>
          )}

          {!checkout.cardToken && (
            <Box sx={{ py: 1 }} data-testid="summary-reentry">
              <Typography variant="body2" color="text.secondary">
                Tu tarjeta se invalidó al recargar. Vuelve a ingresarla para continuar.
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button variant="outlined" color="inherit" onClick={() => dispatch(goToPayment())}>
            Editar datos
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            disabled={!checkout.cardToken || checkout.processing}
            onClick={handlePay}
            data-testid="summary-pay"
          >
            Pagar {formatCurrency(total)}
          </Button>
        </Box>
      </Paper>
    </Backdrop>
  );
}

export default SummaryBackdrop;