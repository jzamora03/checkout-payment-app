import { Customer } from '../domain/customer/customer.entity';
import {
  Delivery,
  DeliveryStatus,
} from '../domain/delivery/delivery.entity';
import { Product } from '../domain/product/product.entity';
import {
  Transaction,
  TransactionStatus,
} from '../domain/transaction/transaction.entity';

export function makeProduct(overrides: Partial<Parameters<typeof Product.create>[0]> = {}): Product {
  return Product.create({
    id: 'product-1',
    sku: 'SKU-001',
    name: 'Producto de prueba',
    description: 'Descripción',
    priceInCents: 100000,
    currency: 'COP',
    stock: 5,
    imageUrl: null,
    isActive: true,
    version: 1,
    ...overrides,
  });
}

export function makeCustomer(overrides: Partial<Parameters<typeof Customer.create>[0]> = {}): Customer {
  return Customer.create({
    id: 'customer-1',
    email: 'cliente@test.com',
    firstName: 'Juan',
    lastName: 'Perez',
    documentType: 'CC',
    documentNumber: '1067981234',
    phone: null,
    ...overrides,
  });
}

export function makeDelivery(overrides: Partial<Parameters<typeof Delivery.create>[0]> = {}): Delivery {
  return Delivery.create({
    id: 'delivery-1',
    customerId: 'customer-1',
    transactionId: null,
    addressLine1: 'Calle 123 # 45-67',
    addressLine2: null,
    city: 'Bogota',
    state: 'Cundinamarca',
    postalCode: '110111',
    country: 'CO',
    notes: null,
    status: DeliveryStatus.PENDING,
    ...overrides,
  });
}

export function makeTransaction(
  overrides: Partial<Parameters<typeof Transaction.create>[0]> = {},
): Transaction {
  return Transaction.create({
    id: 'transaction-1',
    reference: 'REF-1',
    wompiTransactionId: null,
    productId: 'product-1',
    customerId: 'customer-1',
    deliveryId: 'delivery-1',
    amountInCents: 100000,
    baseFeeInCents: 3000,
    deliveryFeeInCents: 5000,
    totalInCents: 108000,
    currency: 'COP',
    status: TransactionStatus.PENDING,
    statusMessage: null,
    paymentMethodType: 'CARD',
    cardBrand: null,
    cardLastFour: null,
    customerEmail: 'cliente@test.com',
    ipAddress: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeConfigService(values: Record<string, unknown> = {}): any {
  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in values)) {
        throw new Error(`Falta la variable ${key}`);
      }
      return values[key];
    }),
  };
}