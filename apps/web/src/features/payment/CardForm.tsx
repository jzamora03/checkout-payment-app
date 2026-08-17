import { useMemo, useState } from 'react';
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

  return (
    <form onSubmit={handleSubmit} className="card-form" noValidate>
      <div className="card-form__header">
        <span className="card-form__title">Datos de la tarjeta</span>
        <div className="card-brand-icons" aria-label="Tarjetas aceptadas">
          <span
            className={`card-brand card-brand--visa ${brand === 'visa' ? 'is-active' : ''}`}
            data-testid="brand-visa"
          >
            VISA
          </span>
          <span
            className={`card-brand card-brand--mc ${brand === 'mastercard' ? 'is-active' : ''}`}
            data-testid="brand-mastercard"
          >
            Mastercard
          </span>
        </div>
      </div>

      <label className="field">
        <span className="field__label">Número de tarjeta</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={(e) => handleChange('number', e.target.value)}
          onBlur={() => handleBlur('number')}
          aria-invalid={touched.number && Boolean(errors.number)}
          data-testid="card-number"
        />
        {touched.number && errors.number && (
          <span className="field__error">{errors.number}</span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Titular de la tarjeta</span>
        <input
          type="text"
          autoComplete="cc-name"
          placeholder="Nombre y apellido"
          value={card.holder}
          onChange={(e) => handleChange('holder', e.target.value)}
          onBlur={() => handleBlur('holder')}
          aria-invalid={touched.holder && Boolean(errors.holder)}
          data-testid="card-holder"
        />
        {touched.holder && errors.holder && (
          <span className="field__error">{errors.holder}</span>
        )}
      </label>

      <div className="card-form__row">
        <label className="field">
          <span className="field__label">Vencimiento</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={card.expiry}
            onChange={(e) => handleChange('expiry', e.target.value)}
            onBlur={() => handleBlur('expiry')}
            aria-invalid={touched.expiry && Boolean(errors.expiry)}
            data-testid="card-expiry"
          />
          {touched.expiry && errors.expiry && (
            <span className="field__error">{errors.expiry}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">CVC</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={card.cvc}
            onChange={(e) => handleChange('cvc', e.target.value)}
            onBlur={() => handleBlur('cvc')}
            aria-invalid={touched.cvc && Boolean(errors.cvc)}
            data-testid="card-cvc"
          />
          {touched.cvc && errors.cvc && (
            <span className="field__error">{errors.cvc}</span>
          )}
        </label>
      </div>

      <p className="card-form__note">
        Solo usamos datos de prueba. Nada se cobra de verdad.
      </p>

      <button type="submit" className="btn btn--primary btn--block" data-testid="card-continue">
        Continuar al resumen
      </button>
    </form>
  );
}

export default CardForm;