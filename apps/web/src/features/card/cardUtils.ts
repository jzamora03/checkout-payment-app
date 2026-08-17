import type { CardBrand } from '../../types';

/** Detecta la franquicia de la tarjeta a partir del BIN. */
export function getCardBrand(number: string): CardBrand {
  const digits = number.replace(/[\s-]/g, '');
  if (/^4/.test(digits)) {
    return 'visa';
  }
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(digits)) {
    return 'mastercard';
  }
  if (/^3[47]/.test(digits)) {
    return 'amex';
  }
  return 'unknown';
}

/** Valida el número con el algoritmo de Luhn. */
export function luhnCheck(number: string): boolean {
  const digits = number.replace(/\s/g, '');
  if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/** Formatea el número en grupos de 4 (16) o 4-6-5 (amex). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  const brand = getCardBrand(digits);
  if (brand === 'amex') {
    return digits
      .replace(/(\d{4})(\d{6})?(\d{5})?/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(' '),
      )
      .slice(0, 17);
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
}

/** Formatea la expiración como MM/AA. */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Valida la expiración (mes 01-12, fecha futura). */
export function isValidExpiry(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= now.getTime();
}

export function isValidCvc(cvc: string, brand: CardBrand): boolean {
  const length = brand === 'amex' ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(cvc);
}

export interface CardValidation {
  valid: boolean;
  errors: Record<string, string | null>;
}

export function validateCard(card: {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}): CardValidation {
  const brand = getCardBrand(card.number);
  const errors: Record<string, string | null> = {
    number: null,
    holder: null,
    expiry: null,
    cvc: null,
  };

  if (!card.number.trim()) {
    errors.number = 'Ingresa el número de la tarjeta';
  } else if (!luhnCheck(card.number)) {
    errors.number = 'El número de la tarjeta no es válido';
  }

  if (card.holder.trim().length < 3) {
    errors.holder = 'Ingresa el nombre del titular';
  }

  if (!isValidExpiry(card.expiry)) {
    errors.expiry = 'La fecha de expiración no es válida';
  }

  if (!isValidCvc(card.cvc, brand)) {
    errors.cvc = 'El código de seguridad no es válido';
  }

  return {
    valid: Object.values(errors).every((value) => value === null),
    errors,
  };
}