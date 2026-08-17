import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { err, ok, Result } from 'neverthrow';
import { OrderPricing } from '../../domain/pricing/order-pricing';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { CustomerRepositoryPort } from '../ports/customer-repository.port';
import { DeliveryRepositoryPort } from '../ports/delivery-repository.port';
import {
  GatewayTransactionResult,
  PaymentGatewayPort,
} from '../ports/payment-gateway.port';
import { ProductRepositoryPort } from '../ports/product-repository.port';
import { TransactionRepositoryPort } from '../ports/transaction-repository.port';
import { PaymentOutcomeApplier } from '../services/payment-outcome.applier';
import {
  PaymentProcessingError,
  ProductNotAvailableError,
  ProductNotFoundError,
  UseCaseError,
} from './use-case.errors';

export interface CustomerInput {
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export interface DeliveryInput {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string | null;
}

export interface CreateCheckoutTransactionInput {
  productId: string;
  cardToken: string;
  customer: CustomerInput;
  delivery: DeliveryInput;
  ipAddress?: string | null;
}

export interface CheckoutResult {
  transaction: Transaction;
  requiresSync: boolean;
}

const DEFAULT_MAX_POLLING_ATTEMPTS = 8;
const DEFAULT_POLLING_INTERVAL_MS = 400;

function buildReference(): string {
  return `REF-${Date.now().toString(36)}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function buildSignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integrityKey: string,
): string {
  return createHash('sha256')
    .update(`${reference}${amountInCents}${currency}${integrityKey}`)
    .digest('hex');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class CreateCheckoutTransactionUseCase {
  private readonly maxPollingAttempts: number;
  private readonly pollingIntervalMs: number;
  private readonly baseFeeCents: number;
  private readonly deliveryFeeCents: number;
  private readonly integrityKey: string;

  constructor(
    private readonly productRepository: ProductRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly deliveryRepository: DeliveryRepositoryPort,
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly outcomeApplier: PaymentOutcomeApplier,
    configService: ConfigService,
  ) {
    this.maxPollingAttempts =
      configService.get<number>('PAYMENT_POLL_ATTEMPTS') ?? DEFAULT_MAX_POLLING_ATTEMPTS;
    this.pollingIntervalMs =
      configService.get<number>('PAYMENT_POLL_INTERVAL_MS') ?? DEFAULT_POLLING_INTERVAL_MS;
    this.baseFeeCents = this.nonNegativeInt(configService, 'BASE_FEE_CENTS');
    this.deliveryFeeCents = this.nonNegativeInt(configService, 'DELIVERY_FEE_CENTS');
    this.integrityKey = configService.get<string>('PAYMENT_INTEGRITY_KEY') ?? '';
  }

  async execute(
    input: CreateCheckoutTransactionInput,
  ): Promise<Result<CheckoutResult, UseCaseError>> {
    const product = await this.productRepository.findPurchasableById(input.productId);
    if (!product) {
      const exists = await this.productRepository.findById(input.productId);
      return err(
        exists
          ? new ProductNotAvailableError('El producto no tiene stock disponible')
          : new ProductNotFoundError(input.productId),
      );
    }

    const baseFee = this.baseFeeCents;
    const deliveryFee = this.deliveryFeeCents;
    const pricing = OrderPricing.build(product.priceInCents, baseFee, deliveryFee);
    if (pricing.isErr()) {
      return err(new PaymentProcessingError(pricing.error.message));
    }

    const reference = buildReference();
    const customer = await this.customerRepository.upsertByEmail({
      ...input.customer,
    });
    const delivery = await this.deliveryRepository.create({
      customerId: customer.id,
      ...input.delivery,
    });

    let transaction = await this.transactionRepository.create({
      reference,
      productId: product.id,
      customerId: customer.id,
      deliveryId: delivery.id,
      amountInCents: pricing.value.productAmountInCents,
      baseFeeInCents: pricing.value.baseFeeInCents,
      deliveryFeeInCents: pricing.value.deliveryFeeInCents,
      totalInCents: pricing.value.totalInCents,
      currency: product.currency,
      customerEmail: input.customer.email,
      paymentMethodType: 'CARD',
      ipAddress: input.ipAddress ?? null,
    });

    const acceptanceResult = await this.paymentGateway.getAcceptanceToken();
    if (acceptanceResult.isErr()) {
      transaction = await this.transactionRepository.update(
        transaction.markError(acceptanceResult.error.message),
      );
      return err(
        new PaymentProcessingError('No fue posible obtener el token de aceptación'),
      );
    }

    const signature = buildSignature(
      reference,
      pricing.value.totalInCents,
      product.currency,
      this.integrityKey,
    );

    const gatewayResult = await this.paymentGateway.createTransaction({
      reference,
      amountInCents: pricing.value.totalInCents,
      currency: product.currency,
      customerEmail: input.customer.email,
      paymentMethod: { type: 'CARD', token: input.cardToken, installments: 1 },
      acceptanceToken: acceptanceResult.value.acceptanceToken,
      signature,
      ipAddress: input.ipAddress ?? null,
    });

    if (gatewayResult.isErr()) {
      transaction = await this.transactionRepository.update(
        transaction.markError(gatewayResult.error.message),
      );
      return err(new PaymentProcessingError(gatewayResult.error.message));
    }

    transaction = await this.transactionRepository.update(
      transaction.withGatewayTransactionId(gatewayResult.value.id),
    );

    return this.resolveOutcome(transaction, gatewayResult.value);
  }

  private nonNegativeInt(configService: ConfigService, key: string): number {
    const value = configService.get<number>(key);
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  }

  private async resolveOutcome(
    transaction: Transaction,
    initialResult: GatewayTransactionResult,
  ): Promise<Result<CheckoutResult, UseCaseError>> {
    let result = initialResult;
    let attempts = 0;

    while (result.status === 'PENDING' && attempts < this.maxPollingAttempts) {
      await delay(this.pollingIntervalMs);
      const fetched = await this.paymentGateway.getTransaction(transaction.gatewayTransactionId ?? '');
      if (fetched.isOk()) {
        result = fetched.value;
      }
      attempts += 1;
    }

    if (result.status === 'PENDING') {
      return ok({ transaction, requiresSync: true });
    }

    const applied = await this.outcomeApplier.apply(transaction, result);
    if (applied.isErr()) {
      return err(applied.error);
    }

    return ok({ transaction: applied.value, requiresSync: false });
  }
}