import { Customer } from '../../domain/customer/customer.entity';
import { Delivery } from '../../domain/delivery/delivery.entity';
import { Product } from '../../domain/product/product.entity';
import { Transaction } from '../../domain/transaction/transaction.entity';

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: string;
  stock: number;
  imageUrl: string | null;
  isPurchasable: boolean;
}

export interface CustomerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export interface DeliveryResponse {
  id: string;
  status: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TransactionResponse {
  id: string;
  reference: string;
  wompiTransactionId: string | null;
  status: string;
  statusMessage: string | null;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  currency: string;
  paymentMethodType: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  customerEmail: string;
  createdAt: string;
}

export interface CheckoutResponse {
  transaction: TransactionResponse;
  product: ProductResponse;
  customer: CustomerResponse;
  delivery: DeliveryResponse;
  requiresSync: boolean;
}

export const productToResponse = (product: Product): ProductResponse => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  description: product.description,
  priceInCents: product.priceInCents,
  currency: product.currency,
  stock: product.stock,
  imageUrl: product.imageUrl,
  isPurchasable: product.isPurchasable,
});

export const customerToResponse = (customer: Customer): CustomerResponse => ({
  id: customer.id,
  email: customer.email,
  firstName: customer.firstName,
  lastName: customer.lastName,
  documentType: customer.documentType,
  documentNumber: customer.documentNumber,
  phone: customer.phone,
});

export const deliveryToResponse = (delivery: Delivery): DeliveryResponse => ({
  id: delivery.id,
  status: delivery.status,
  addressLine1: delivery.toDTO().addressLine1,
  addressLine2: delivery.toDTO().addressLine2,
  city: delivery.toDTO().city,
  state: delivery.toDTO().state,
  postalCode: delivery.toDTO().postalCode,
  country: delivery.toDTO().country,
});

export const transactionToResponse = (
  transaction: Transaction,
): TransactionResponse => {
  const props = transaction.toDTO();
  return {
    id: props.id,
    reference: props.reference,
    wompiTransactionId: props.wompiTransactionId,
    status: props.status,
    statusMessage: props.statusMessage,
    amountInCents: props.amountInCents,
    baseFeeInCents: props.baseFeeInCents,
    deliveryFeeInCents: props.deliveryFeeInCents,
    totalInCents: props.totalInCents,
    currency: props.currency,
    paymentMethodType: props.paymentMethodType,
    cardBrand: props.cardBrand,
    cardLastFour: props.cardLastFour,
    customerEmail: props.customerEmail,
    createdAt: transaction.createdAt,
  };
};