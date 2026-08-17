import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
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
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(15, 23, 42, 0.65)',
        p: 2.5,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Resultado del pago"
    >
      <Paper
        elevation={0}
        sx={{ width: '100%', maxWidth: 400, p: 3, textAlign: 'center', borderRadius: '18px' }}
      >
        {isProcessing ? (
          <>
            <CircularProgress size={44} sx={{ mb: 2 }} />
            <Typography variant="h5">{getHeading()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getMessage()}
            </Typography>
          </>
        ) : (
          <>
            {checkout.transactionStatus === 'APPROVED' ? (
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 1 }} />
            ) : (
              <CancelIcon color="error" sx={{ fontSize: 64, mb: 1 }} />
            )}
            <Typography variant="h5">{getHeading()}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {getMessage()}
            </Typography>

            {response && (
              <Box sx={{ mt: 2, textAlign: 'left', display: 'grid', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'background.default', borderRadius: 2, px: 1.5, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Referencia
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, overflowWrap: 'anywhere', textAlign: 'right' }}
                  >
                    <span data-testid="result-reference">{response.transaction.reference}</span>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'background.default', borderRadius: 2, px: 1.5, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total pagado
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {formatCurrency(response.transaction.totalInCents)}
                  </Typography>
                </Box>
                {checkout.transactionStatus !== 'APPROVED' && response.transaction.statusMessage && (
                  <Alert severity="info" icon={false} sx={{ fontSize: '0.85rem' }}>
                    {response.transaction.statusMessage}
                  </Alert>
                )}
              </Box>
            )}

            {checkout.error && (
              <Alert severity="error" sx={{ mt: 1.5, fontSize: '0.85rem' }}>
                {checkout.error}
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2 }}
              onClick={handleBack}
              data-testid="result-back"
            >
              Volver a la tienda
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default ResultView;