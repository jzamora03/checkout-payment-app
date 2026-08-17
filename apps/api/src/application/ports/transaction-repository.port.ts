import { Transaction } from '../../domain/transaction/transaction.entity';

export interface SaveTransactionInput {
  reference: string;
  productId: string;
  customerId: string;
  deliveryId: string;
  amountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  currency: string;
  customerEmail: string;
  paymentMethodType: string;
  ipAddress: string | null;
}

export abstract class TransactionRepositoryPort {
  abstract create(input: SaveTransactionInput): Promise<Transaction>;
  abstract findByReference(reference: string): Promise<Transaction | null>;
  abstract findByGatewayTransactionId(gatewayTransactionId: string): Promise<Transaction | null>;
  abstract update(transaction: Transaction): Promise<Transaction>;
}