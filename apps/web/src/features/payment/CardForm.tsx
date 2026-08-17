import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import type { CardBrand, CardForm as CardFormData } from '../../types';
import {
  formatCardNumber,
  formatExpiry,
  getCardBrand,
  validateCard,
} from '../card/cardUtils';

interface CardFormProps {
  initial: CardFormData;
  onValid: (card: CardFormData) => void;
  onInvalid?: () => void;
}

function CardForm({ initial, onValid }: CardFormProps) {
  const [card, setCard] = useState<CardFormData>(initial);
  const [errors, setErrors] = useState<Record<string, string | null>>({
    number: null,
    holder: null,
    expiry: null,
    cvc: null,
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const brand: CardBrand = useMemo(() => getCardBrand(card.number), [card.number]);

  const handleChange = (field: keyof CardFormData, value: string) => {
    const next = { ...card };
    if (field === 'number') {
      next.number = formatCardNumber(value);
    } else if (field === 'expiry') {
      next.expiry = formatExpiry(value);
    } else if (field === 'cvc') {
      next.cvc = value.replace(/\D/g, '').slice(0, 4);
    } else {
      next[field] = value;
    }
    setCard(next);

    if (touched[field]) {
      const result = validateCard(next);
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleBlur = (field: keyof CardFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const result = validateCard(card);
    setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
  };

  const validation = validateCard(card);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ number: true, holder: true, expiry: true, cvc: true });
    setErrors(validation.errors);
    if (validation.valid) {
      onValid(card);
    }
  };

  const field = (key: keyof CardFormData) => ({
    error: touched[key] && Boolean(errors[key]),
    helperText: touched[key] && errors[key] ? errors[key] : ' ',
  });

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }} noValidate>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <CreditCardIcon fontSize="small" /> Datos de la tarjeta
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }} aria-label="Tarjetas aceptadas">
          <Box
            data-testid="brand-visa"
            className={`brand-logo brand-logo--visa ${brand === 'visa' ? 'is-active' : ''}`}
          >
            VISA
          </Box>
          <Box
            data-testid="brand-mastercard"
            className={`brand-logo brand-logo--mc ${brand === 'mastercard' ? 'is-active' : ''}`}
          >
            Mastercard
          </Box>
        </Box>
      </Box>

      <TextField
        fullWidth
        margin="dense"
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        label="Número de tarjeta"
        placeholder="1234 5678 9012 3456"
        value={card.number}
        onChange={(e) => handleChange('number', e.target.value)}
        onBlur={() => handleBlur('number')}
        {...field('number')}
        slotProps={{
          htmlInput: {
            'data-testid': 'card-number',
            'aria-invalid': touched.number && Boolean(errors.number),
          },
        }}
      />

      <TextField
        fullWidth
        margin="dense"
        label="Titular de la tarjeta"
        placeholder="Nombre y apellido"
        autoComplete="cc-name"
        value={card.holder}
        onChange={(e) => handleChange('holder', e.target.value)}
        onBlur={() => handleBlur('holder')}
        {...field('holder')}
        slotProps={{
          htmlInput: {
            'data-testid': 'card-holder',
            'aria-invalid': touched.holder && Boolean(errors.holder),
          },
        }}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <TextField
          fullWidth
          margin="dense"
          type="text"
          inputMode="numeric"
          label="Vencimiento"
          placeholder="MM/AA"
          value={card.expiry}
          onChange={(e) => handleChange('expiry', e.target.value)}
          onBlur={() => handleBlur('expiry')}
          {...field('expiry')}
          slotProps={{
            htmlInput: {
              'data-testid': 'card-expiry',
              'aria-invalid': touched.expiry && Boolean(errors.expiry),
            },
          }}
        />
        <TextField
          fullWidth
          margin="dense"
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          label="CVC"
          placeholder="123"
          value={card.cvc}
          onChange={(e) => handleChange('cvc', e.target.value)}
          onBlur={() => handleBlur('cvc')}
          {...field('cvc')}
          slotProps={{
            htmlInput: {
              'data-testid': 'card-cvc',
              'aria-invalid': touched.cvc && Boolean(errors.cvc),
            },
            input: {
              endAdornment: (
                <InputAdornment position="end">🔒</InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, mb: 2 }}>
        Solo usamos datos de prueba. Nada se cobra de verdad.
      </Typography>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        data-testid="card-continue"
      >
        Continuar al resumen
      </Button>
    </Box>
  );
}

export default CardForm;