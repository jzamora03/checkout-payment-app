import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { AppDispatch, RootState } from '../../app/store';
import { goToProduct, goToSummary, setCustomer, setDelivery } from '../checkout/checkoutSlice';
import type {
  CustomerForm as CustomerData,
  DeliveryForm as DeliveryData,
} from '../../types';
import { formatCurrency } from '../../utils/format';
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

const STEPS = ['Datos del cliente', 'Datos de entrega'];

function PaymentModal() {
  const dispatch = useDispatch<AppDispatch>();
  const product = useSelector((state: RootState) => {
    const selectedId = state.checkout.selectedProductId;
    return state.products.products.find((item) => item.id === selectedId) ?? null;
  });
  const persisted = useSelector((state: RootState) => state.checkout);

  const [wizardStep, setWizardStep] = useState(0);
  const [customer, setCustomerLocal] = useState<CustomerData>(
    persisted.customer ?? emptyCustomer(),
  );
  const [delivery, setDeliveryLocal] = useState<DeliveryData>(
    persisted.delivery ?? emptyDelivery(),
  );
  const [generalError, setGeneralError] = useState<string | null>(null);

  if (!product) {
    return null;
  }

  const handleCancel = () => {
    dispatch(goToProduct());
  };

  const handleNextCustomer = () => {
    setGeneralError(null);
    if (!isCustomerValid(customer)) {
      setGeneralError('Revisa los datos del cliente para continuar.');
      return;
    }
    dispatch(setCustomer(customer));
    setWizardStep(1);
  };

  const handleNextDelivery = () => {
    setGeneralError(null);
    if (!isDeliveryValid(delivery)) {
      setGeneralError('Revisa los datos de la entrega para continuar.');
      return;
    }
    dispatch(setDelivery(delivery));
    dispatch(goToSummary());
  };

  const handleBack = () => {
    setGeneralError(null);
    setWizardStep(0);
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout paso a paso"
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
            {product.name} · {formatCurrency(product.priceInCents + 3000 + 5000)}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={handleCancel} data-testid="modal-close">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, pb: 1 }}>
        <Stepper activeStep={wizardStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {generalError && (
        <Box sx={{ px: 2.5 }}>
          <Alert severity="error" data-testid="modal-error">
            {generalError}
          </Alert>
        </Box>
      )}

      <DialogContent dividers sx={{ pt: 1.5 }}>
        {wizardStep === 0 ? (
          <Box data-testid="step-customer">
            <CustomerForm initial={customer} onChange={setCustomerLocal} />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 1 }}
              startIcon={<PersonIcon />}
              onClick={handleNextCustomer}
              data-testid="step-customer-next"
            >
              Continuar
            </Button>
          </Box>
        ) : (
          <Box data-testid="step-delivery">
            <DeliveryForm initial={delivery} onChange={setDeliveryLocal} />
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleBack}
                data-testid="step-delivery-back"
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<LocalShippingIcon />}
                onClick={handleNextDelivery}
                data-testid="step-delivery-next"
              >
                Continuar al resumen
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;