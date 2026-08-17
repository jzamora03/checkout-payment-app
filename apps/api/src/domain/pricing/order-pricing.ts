import { err, ok, Result } from 'neverthrow';

export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAmountError';
  }
}

export interface OrderPricingProps {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
}

export class OrderPricing {
  private constructor(private readonly props: OrderPricingProps) {}

  static build(
    productAmountInCents: number,
    baseFeeInCents: number,
    deliveryFeeInCents: number,
  ): Result<OrderPricing, InvalidAmountError> {
    if (!Number.isInteger(productAmountInCents) || productAmountInCents <= 0) {
      return err(new InvalidAmountError('El monto del producto debe ser un entero positivo'));
    }
    if (!Number.isInteger(baseFeeInCents) || baseFeeInCents < 0) {
      return err(new InvalidAmountError('La tarifa base debe ser un entero no negativo'));
    }
    if (!Number.isInteger(deliveryFeeInCents) || deliveryFeeInCents < 0) {
      return err(new InvalidAmountError('La tarifa de entrega debe ser un entero no negativo'));
    }

    const totalInCents = productAmountInCents + baseFeeInCents + deliveryFeeInCents;
    return ok(new OrderPricing({ productAmountInCents, baseFeeInCents, deliveryFeeInCents, totalInCents }));
  }

  get productAmountInCents(): number {
    return this.props.productAmountInCents;
  }

  get baseFeeInCents(): number {
    return this.props.baseFeeInCents;
  }

  get deliveryFeeInCents(): number {
    return this.props.deliveryFeeInCents;
  }

  get totalInCents(): number {
    return this.props.totalInCents;
  }

  toDTO(): OrderPricingProps {
    return { ...this.props };
  }
}