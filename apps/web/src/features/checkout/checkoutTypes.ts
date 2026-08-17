import type {
  CheckoutResponse,
  CustomerForm,
  DeliveryForm,
  TransactionStatus,
} from '../../types';

export type { CheckoutResponse, CustomerForm, DeliveryForm, TransactionStatus };

export interface CheckoutTransactionPayload {
  productId: string;
  cardToken: string;
  customer: CustomerForm;
  delivery: DeliveryForm;
}