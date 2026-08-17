export interface Product {
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

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string | null;
}

export interface Delivery {
  id: string;
  status: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'ERROR'
  | 'VOIDED';

export interface Transaction {
  id: string;
  reference: string;
  wompiTransactionId: string | null;
  status: TransactionStatus;
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
  transaction: Transaction;
  product: Product;
  customer: Customer;
  delivery: Delivery;
  requiresSync: boolean;
}

export interface CustomerForm {
  email: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
}

export interface DeliveryForm {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

export interface CardForm {
  number: string;
  holder: string;
  expiry: string;
  cvc: string;
}

export interface TokenizedCard {
  id: string;
  brand: string;
  lastFour: string;
}