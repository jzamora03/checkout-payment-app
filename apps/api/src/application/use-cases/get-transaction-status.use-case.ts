import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { PaymentGatewayPort } from '../ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../ports/transaction-repository.port';
import { PaymentOutcomeApplier } from '../services/payment-outcome.applier';
import { TransactionNotFoundError, UseCaseError } from './use-case.errors';

export interface TransactionStatusResult {
  transaction: Transaction;
  requiresSync: boolean;
}

@Injectable()
export class GetTransactionStatusUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly paymentGateway: PaymentGatewayPort,
    private readonly outcomeApplier: PaymentOutcomeApplier,
  ) {}

  async execute(
    reference: string,
  ): Promise<Result<TransactionStatusResult, UseCaseError>> {
    const transaction = await this.transactionRepository.findByReference(reference);
    if (!transaction) {
      return err(new TransactionNotFoundError(reference));
    }

    if (transaction.isFinalized || !transaction.wompiTransactionId) {
      return ok({ transaction, requiresSync: false });
    }

    const gatewayResult = await this.paymentGateway.getTransaction(
      transaction.wompiTransactionId,
    );
    if (gatewayResult.isErr()) {
      return ok({ transaction, requiresSync: true });
    }

    const status = gatewayResult.value.status;
    if (status === 'PENDING') {
      return ok({ transaction, requiresSync: true });
    }

    const applied = await this.outcomeApplier.apply(transaction, gatewayResult.value);
    if (applied.isErr()) {
      return err(applied.error);
    }

    return ok({ transaction: applied.value, requiresSync: false });
  }
}