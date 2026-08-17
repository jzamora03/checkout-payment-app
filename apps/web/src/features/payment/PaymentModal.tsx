import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
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
      setGeneralError('Revisa los datos del cliente y de la entrega para continuar.');
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
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Pago con tarjeta"
      slotProps={{
        paper: {
          sx: {
            m: 0,
            maxHeight: '92dvh',
            borderRadius: '18px 18px 0 0',
            '@media (min-width: 600px)': { borderRadius: '18px' },
          },
        },
      }}
    >
      <Box sx={{ pt: 0.75, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'grey.300' }} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          px: 2.5,
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6">Pagar con tarjeta</Typography>
          <Typography variant="body2" color="text.secondary">
            {product.name} · {formatCurrency(totalInCents)}
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar"
          onClick={handleCancel}
          data-testid="modal-close"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {generalError && (
        <Box sx={{ px: 2.5 }}>
          <Alert severity="error" data-testid="modal-error">
            {generalError}
          </Alert>
        </Box>
      )}

      <DialogContent dividers sx={{ pt: 1.5 }}>
        <CustomerForm initial={customer} onChange={setCustomerLocal} />
        <CardForm initial={card} onValid={handleValidCard} />
        <DeliveryForm initial={delivery} onChange={setDeliveryLocal} />
      </DialogContent>

      {submitting && <LinearProgress />}
    </Dialog>
  );
}

export default PaymentModal;