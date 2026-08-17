import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import type { DeliveryForm as DeliveryData } from '../../types';

interface DeliveryFormProps {
  initial: DeliveryData;
  onChange: (delivery: DeliveryData) => void;
}

const postalPattern = /^[0-9A-Za-z-]{3,10}$/;

export function validateDelivery(delivery: DeliveryData): Record<string, string | null> {
  return {
    addressLine1: delivery.addressLine1.trim().length >= 5
      ? null
      : 'Ingresa la dirección (mínimo 5 caracteres)',
    city: delivery.city.trim().length >= 2 ? null : 'Ingresa la ciudad',
    state: delivery.state.trim().length >= 2 ? null : 'Ingresa el departamento',
    postalCode: postalPattern.test(delivery.postalCode)
      ? null
      : 'Código postal no válido',
  };
}

export function isDeliveryValid(delivery: DeliveryData): boolean {
  return Object.values(validateDelivery(delivery)).every((value) => value === null);
}

function DeliveryForm({ initial, onChange }: DeliveryFormProps) {
  const [delivery, setDelivery] = useState<DeliveryData>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = <K extends keyof DeliveryData>(field: K, value: DeliveryData[K]) => {
    const next = { ...delivery, [field]: value };
    setDelivery(next);
    onChange(next);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateDelivery(next)[field] }));
    }
  };

  const handleBlur = (field: keyof DeliveryData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateDelivery(delivery)[field] }));
  };

  return (
    <Box component="section" sx={{ my: 1 }}>
      <Typography
        variant="overline"
        sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <LocalShippingIcon fontSize="small" /> Datos de entrega
      </Typography>

      <TextField
        fullWidth
        margin="dense"
        label="Dirección"
        placeholder="Calle 123 # 45-67"
        autoComplete="street-address"
        value={delivery.addressLine1}
        onChange={(e) => handleChange('addressLine1', e.target.value)}
        onBlur={() => handleBlur('addressLine1')}
        error={touched.addressLine1 && Boolean(errors.addressLine1)}
        helperText={
          touched.addressLine1 && errors.addressLine1 ? errors.addressLine1 : ' '
        }
        slotProps={{
          htmlInput: { 'data-testid': 'delivery-address' },
        }}
      />

      <TextField
        fullWidth
        margin="dense"
        label="Complemento (opcional)"
        placeholder="Apto 301, torre B"
        value={delivery.addressLine2}
        onChange={(e) => handleChange('addressLine2', e.target.value)}
        slotProps={{
          htmlInput: { 'data-testid': 'delivery-address2' },
        }}
      />

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Ciudad"
            placeholder="Bogotá"
            value={delivery.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            error={touched.city && Boolean(errors.city)}
            helperText={touched.city && errors.city ? errors.city : ' '}
            slotProps={{
              htmlInput: { 'data-testid': 'delivery-city' },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Departamento"
            placeholder="Cundinamarca"
            value={delivery.state}
            onChange={(e) => handleChange('state', e.target.value)}
            onBlur={() => handleBlur('state')}
            error={touched.state && Boolean(errors.state)}
            helperText={touched.state && errors.state ? errors.state : ' '}
            slotProps={{
              htmlInput: { 'data-testid': 'delivery-state' },
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Código postal"
            placeholder="110111"
            inputMode="numeric"
            value={delivery.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            error={touched.postalCode && Boolean(errors.postalCode)}
            helperText={
              touched.postalCode && errors.postalCode ? errors.postalCode : ' '
            }
            slotProps={{
              htmlInput: { 'data-testid': 'delivery-postal' },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            select
            label="País"
            value={delivery.country}
            onChange={(e) => handleChange('country', e.target.value)}
          >
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
          </TextField>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        margin="dense"
        multiline
        minRows={2}
        label="Notas (opcional)"
        placeholder="Instrucciones de entrega"
        value={delivery.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        slotProps={{
          htmlInput: { 'data-testid': 'delivery-notes' },
        }}
      />
    </Box>
  );
}

export default DeliveryForm;