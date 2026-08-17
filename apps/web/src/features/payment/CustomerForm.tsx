import { useState } from 'react';
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
    <div className="customer-form">
      <span className="form-section__title">Datos del cliente</span>

      <label className="field">
        <span className="field__label">Correo electrónico</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="cliente@correo.com"
          value={customer.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          aria-invalid={touched.email && Boolean(errors.email)}
          data-testid="customer-email"
        />
        {touched.email && errors.email && (
          <span className="field__error">{errors.email}</span>
        )}
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Nombre</span>
          <input
            type="text"
            autoComplete="given-name"
            placeholder="Juan"
            value={customer.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            data-testid="customer-firstName"
          />
          {touched.firstName && errors.firstName && (
            <span className="field__error">{errors.firstName}</span>
          )}
        </label>

        <label className="field">
          <span className="field__label">Apellido</span>
          <input
            type="text"
            autoComplete="family-name"
            placeholder="Pérez"
            value={customer.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            data-testid="customer-lastName"
          />
          {touched.lastName && errors.lastName && (
            <span className="field__error">{errors.lastName}</span>
          )}
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field__label">Tipo de documento</span>
          <select
            value={customer.documentType}
            onChange={(e) => handleChange('documentType', e.target.value)}
            data-testid="customer-documentType"
          >
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="PASS">Pasaporte</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">Número de documento</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="1067981234"
            value={customer.documentNumber}
            onChange={(e) => handleChange('documentNumber', e.target.value.replace(/\D/g, ''))}
            onBlur={() => handleBlur('documentNumber')}
            data-testid="customer-documentNumber"
          />
          {touched.documentNumber && errors.documentNumber && (
            <span className="field__error">{errors.documentNumber}</span>
          )}
        </label>
      </div>

      <label className="field">
        <span className="field__label">Teléfono</span>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="300 123 4567"
          value={customer.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => handleBlur('phone')}
          data-testid="customer-phone"
        />
        {touched.phone && errors.phone && (
          <span className="field__error">{errors.phone}</span>
        )}
      </label>
    </div>
  );
}

export default CustomerForm;