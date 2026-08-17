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

export interface TransactionRepositoryPort {
  create(input: SaveTransactionInput): Promise<Transaction>;
  findByReference(reference: string): Promise<Transaction | null>;
  findByWompiId(wompiTransactionId: string): Promise<Transaction | null>;
  update(transaction: Transaction): Promise<Transaction>;
}