import { InvalidAmountError, OrderPricing } from './order-pricing';

describe('OrderPricing (dominio)', () => {
  it('calcula el total con las tarifas', () => {
    const result = OrderPricing.build(100000, 3000, 5000);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().toDTO()).toEqual({
      productAmountInCents: 100000,
      baseFeeInCents: 3000,
      deliveryFeeInCents: 5000,
      totalInCents: 108000,
    });
  });

  it('permite tarifas en cero', () => {
    const result = OrderPricing.build(50000, 0, 0);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().totalInCents).toBe(50000);
  });

  it('rechaza monto de producto no positivo', () => {
    const result = OrderPricing.build(0, 3000, 5000);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidAmountError);
  });

  it('rechaza montos no enteros', () => {
    const result = OrderPricing.build(100.5, 3000, 5000);
    expect(result.isErr()).toBe(true);
  });

  it('rechaza tarifas negativas', () => {
    const result = OrderPricing.build(100000, -1, 0);
    expect(result.isErr()).toBe(true);
    const result2 = OrderPricing.build(100000, 0, -1);
    expect(result2.isErr()).toBe(true);
  });
});