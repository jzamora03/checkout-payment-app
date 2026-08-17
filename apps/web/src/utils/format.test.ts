import { formatCurrency, formatStock } from './format';

describe('formatCurrency', () => {
  it('formatea centavos a pesos colombianos', () => {
    expect(formatCurrency(108000)).toContain('1.080');
    expect(formatCurrency(249900)).toContain('2.499');
    expect(formatCurrency(108000)).toContain('$');
  });

  it('formatea cero', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});

describe('formatStock', () => {
  it('indica sin stock', () => {
    expect(formatStock(0)).toBe('Sin stock');
  });

  it('alerta con poco stock', () => {
    expect(formatStock(3)).toBe('¡Solo quedan 3!');
  });

  it('indica stock disponible', () => {
    expect(formatStock(12)).toBe('12 disponibles');
  });
});