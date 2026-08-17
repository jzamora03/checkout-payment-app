import { useState } from 'react';
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
    <div className="delivery-form">
      <span className="form-section__title">Datos de entrega</span>

      <label className="field">
        <span className="field__label">Dirección</span>
        <input
          type="text"
          autoComplete="street-address"
          placeholder="Calle 123 # 45-67"
          value={delivery.addressLine1}
          onChange={(e) => handleChange('addressLine1', e.target.value)}
          onBlur={() => handleBlur('addressLine1')}
          data-testid="delivery-address"
        />
        {touched.addressLine1 && errors.addressLine1 && (
          <span className="field__error">{errors.addressLine1}</span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Complemento (opcional)</span>
        <input
          type="text"
          placeholder="Apto 301, torre B"
          value={delivery.addressLine2}
          onChange={(e) => handleChange('addressLine2', e.target.value)}
          data-testid="delivery-address2"
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Ciudad</span>
          <input
            type="text"
            placeholder="Bogotá"
            value={delivery.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            data-testid="delivery-city"
          />
          {touched.city && errors.city && (
            <span className="field__error">{errors.city}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Departamento</span>
          <input
            type="text"
            placeholder="Cundinamarca"
            value={delivery.state}
            onChange={(e) => handleChange('state', e.target.value)}
            onBlur={() => handleBlur('state')}
            data-testid="delivery-state"
          />
          {touched.state && errors.state && (
            <span className="field__error">{errors.state}</span>
          )}
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Código postal</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="110111"
            value={delivery.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            onBlur={() => handleBlur('postalCode')}
            data-testid="delivery-postal"
          />
          {touched.postalCode && errors.postalCode && (
            <span className="field__error">{errors.postalCode}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">País</span>
          <select
            value={delivery.country}
            onChange={(e) => handleChange('country', e.target.value)}
            data-testid="delivery-country"
          >
            <option value="CO">Colombia</option>
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field__label">Notas (opcional)</span>
        <textarea
          rows={2}
          placeholder="Instrucciones de entrega"
          value={delivery.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          data-testid="delivery-notes"
        />
      </label>
    </div>
  );
}

export default DeliveryForm;