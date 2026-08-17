import { Result } from 'neverthrow';

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export interface PaymentCardMethod {
  type: 'CARD';
  token: string;
  installments?: number;
}

export interface CreateGatewayTransactionInput {
  reference: string;
  amountInCents: number;
  currency: string;
  customerEmail: string;
  paymentMethod: PaymentCardMethod;
  acceptanceToken: string;
  signature: string;
  ipAddress?: string | null;
}

export type GatewayTransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export interface GatewayTransactionResult {
  id: string;
  status: GatewayTransactionStatus;
  statusMessage: string | null;
  cardBrand?: string | null;
  cardLastFour?: string | null;
}

export abstract class PaymentGatewayPort {
  abstract getAcceptanceToken(): Promise<Result<{ acceptanceToken: string }, GatewayError>>;
  abstract createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<Result<GatewayTransactionResult, GatewayError>>;
  abstract getTransaction(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayTransactionResult, GatewayError>>;
}