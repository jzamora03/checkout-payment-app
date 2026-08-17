import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PersonIcon from '@mui/icons-material/Person';
import type { CustomerForm as CustomerData } from '../../types';

interface CustomerFormProps {
  initial: CustomerData;
  onChange: (customer: CustomerData) => void;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digitsPattern = /^[0-9]{4,20}$/;
const phonePattern = /^\+?[0-9]{7,15}$/;

export function validateCustomer(customer: CustomerData): Record<string, string | null> {
  return {
    email: emailPattern.test(customer.email)
      ? null
      : 'Ingresa un correo válido',
    firstName: customer.firstName.trim().length >= 2
      ? null
      : 'Ingresa el nombre',
    lastName: customer.lastName.trim().length >= 2
      ? null
      : 'Ingresa el apellido',
    documentNumber: digitsPattern.test(customer.documentNumber)
      ? null
      : 'El documento debe tener entre 4 y 20 dígitos',
    phone: customer.phone === '' || phonePattern.test(customer.phone)
      ? null
      : 'Teléfono no válido',
  };
}

export function isCustomerValid(customer: CustomerData): boolean {
  return Object.values(validateCustomer(customer)).every((value) => value === null);
}

function CustomerForm({ initial, onChange }: CustomerFormProps) {
  const [customer, setCustomer] = useState<CustomerData>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = <K extends keyof CustomerData>(field: K, value: CustomerData[K]) => {
    const next = { ...customer, [field]: value };
    setCustomer(next);
    onChange(next);
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateCustomer(next)[field] }));
    }
  };

  const handleBlur = (field: keyof CustomerData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateCustomer(customer)[field] }));
  };

  return (
    <Box component="section" sx={{ my: 1 }}>
      <Typography
        variant="overline"
        sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <PersonIcon fontSize="small" /> Datos del cliente
      </Typography>

      <TextField
        fullWidth
        margin="dense"
        type="email"
        label="Correo electrónico"
        placeholder="cliente@correo.com"
        autoComplete="email"
        value={customer.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        error={touched.email && Boolean(errors.email)}
        helperText={touched.email && errors.email ? errors.email : ' '}
        slotProps={{
          htmlInput: {
            'data-testid': 'customer-email',
            'aria-invalid': touched.email && Boolean(errors.email),
          },
        }}
      />

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Nombre"
            placeholder="Juan"
            autoComplete="given-name"
            value={customer.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={touched.firstName && Boolean(errors.firstName)}
            helperText={touched.firstName && errors.firstName ? errors.firstName : ' '}
            slotProps={{
              htmlInput: { 'data-testid': 'customer-firstName' },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Apellido"
            placeholder="Pérez"
            autoComplete="family-name"
            value={customer.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={touched.lastName && Boolean(errors.lastName)}
            helperText={touched.lastName && errors.lastName ? errors.lastName : ' '}
            slotProps={{
              htmlInput: { 'data-testid': 'customer-lastName' },
            }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            select
            label="Tipo de documento"
            value={customer.documentType}
            onChange={(e) => handleChange('documentType', e.target.value)}
          >
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="PASS">Pasaporte</option>
          </TextField>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            fullWidth
            margin="dense"
            label="Número de documento"
            placeholder="1067981234"
            inputMode="numeric"
            value={customer.documentNumber}
            onChange={(e) => handleChange('documentNumber', e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('documentNumber')}
            error={touched.documentNumber && Boolean(errors.documentNumber)}
            helperText={
              touched.documentNumber && errors.documentNumber ? errors.documentNumber : ' '
            }
            slotProps={{
              htmlInput: { 'data-testid': 'customer-documentNumber' },
            }}
          />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        margin="dense"
        type="tel"
        label="Teléfono"
        placeholder="300 123 4567"
        autoComplete="tel"
        value={customer.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        onBlur={() => handleBlur('phone')}
        error={touched.phone && Boolean(errors.phone)}
        helperText={touched.phone && errors.phone ? errors.phone : ' '}
        slotProps={{
          htmlInput: { 'data-testid': 'customer-phone' },
        }}
      />
    </Box>
  );
}

export default CustomerForm;