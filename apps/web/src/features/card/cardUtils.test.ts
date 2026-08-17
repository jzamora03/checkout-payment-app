import {
  formatCardNumber,
  formatExpiry,
  getCardBrand,
  isValidCvc,
  isValidExpiry,
  luhnCheck,
  validateCard,
} from './cardUtils';

describe('getCardBrand', () => {
  it('detecta VISA', () => {
    expect(getCardBrand('4242 4242 4242 4242')).toBe('visa');
    expect(getCardBrand('4111 1111 1111 1111')).toBe('visa');
  });

  it('detecta Mastercard', () => {
    expect(getCardBrand('5111 1111 1111 1111')).toBe('mastercard');
    expect(getCardBrand('2221 0000 0000 0009')).toBe('mastercard');
  });

  it('detecta Amex', () => {
    expect(getCardBrand('3782 822463 10005')).toBe('amex');
  });

  it('retorna unknown para números desconocidos', () => {
    expect(getCardBrand('6011 0000 0000 0004')).toBe('unknown');
  });
});

describe('luhnCheck', () => {
  it('valida números válidos', () => {
    expect(luhnCheck('4242424242424242')).toBe(true);
    expect(luhnCheck('4111111111111111')).toBe(true);
  });

  it('rechaza números inválidos o de longitud incorrecta', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
    expect(luhnCheck('1234')).toBe(false);
    expect(luhnCheck('abcdefghijklmnop')).toBe(false);
  });
});

describe('formato', () => {
  it('formatea el número en grupos de 4', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242 4242 4242424')).toBe('4242 4242 4242 424');
  });

  it('formatea la expiración como MM/AA', () => {
    expect(formatExpiry('1228')).toBe('12/28');
    expect(formatExpiry('1')).toBe('1');
  });

  it('valida expiraciones futuras', () => {
    expect(isValidExpiry('12/99')).toBe(true);
    expect(isValidExpiry('01/20')).toBe(false);
    expect(isValidExpiry('13/28')).toBe(false);
    expect(isValidExpiry('abc')).toBe(false);
  });

  it('valida CVC según la franquicia', () => {
    expect(isValidCvc('123', 'visa')).toBe(true);
    expect(isValidCvc('12', 'visa')).toBe(false);
    expect(isValidCvc('1234', 'amex')).toBe(true);
    expect(isValidCvc('1234', 'visa')).toBe(false);
  });
});

describe('validateCard', () => {
  const valid = {
    number: '4242 4242 4242 4242',
    holder: 'Juan Perez',
    expiry: '12/99',
    cvc: '123',
  };

  it('valida una tarjeta correcta', () => {
    const result = validateCard(valid);
    expect(result.valid).toBe(true);
  });

  it('detecta número inválido', () => {
    const result = validateCard({ ...valid, number: '4242 4242 4242 4241' });
    expect(result.valid).toBe(false);
    expect(result.errors.number).toBeTruthy();
  });

  it('detecta titular corto', () => {
    const result = validateCard({ ...valid, holder: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.holder).toBeTruthy();
  });

  it('detecta expiración inválida', () => {
    const result = validateCard({ ...valid, expiry: '01/20' });
    expect(result.valid).toBe(false);
    expect(result.errors.expiry).toBeTruthy();
  });

  it('detecta CVC inválido', () => {
    const result = validateCard({ ...valid, cvc: '12' });
    expect(result.valid).toBe(false);
    expect(result.errors.cvc).toBeTruthy();
  });
});