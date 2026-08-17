import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { DeliveryStatus } from '../../domain/delivery/delivery.entity';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { DeliveryRepositoryPort } from '../ports/delivery-repository.port';
import {
  GatewayTransactionResult,
} from '../ports/payment-gateway.port';
import { ProductRepositoryPort } from '../ports/product-repository.port';
import { TransactionRepositoryPort } from '../ports/transaction-repository.port';
import { PaymentProcessingError } from '../use-cases/use-case.errors';

/**
 * Aplica el resultado final de la pasarela sobre la transacción local.
 * Es idempotente: si la transacción ya está en estado final no vuelve a
 * descontar stock ni a re-asignar la entrega.
 */
@Injectable()
export class PaymentOutcomeApplier {
  constructor(
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly productRepository: ProductRepositoryPort,
    private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  async apply(
    transaction: Transaction,
    gatewayResult: GatewayTransactionResult,
  ): Promise<Result<Transaction, PaymentProcessingError>> {
    switch (gatewayResult.status) {
      case 'APPROVED': {
        return this.applyApproved(transaction, gatewayResult);
      }
      case 'DECLINED': {
        if (transaction.isFinalized) {
          return ok(transaction);
        }
        const updated = transaction.markDeclined(gatewayResult.statusMessage);
        return ok(await this.transactionRepository.update(updated));
      }
      case 'VOIDED':
      case 'ERROR': {
        if (transaction.isFinalized) {
          return ok(transaction);
        }
        const updated = transaction.markError(gatewayResult.statusMessage);
        return ok(await this.transactionRepository.update(updated));
      }
      default:
        return ok(transaction);
    }
  }

  private async applyApproved(
    transaction: Transaction,
    gatewayResult: GatewayTransactionResult,
  ): Promise<Result<Transaction, PaymentProcessingError>> {
    if (transaction.isApproved) {
      return ok(transaction);
    }

    const approved = transaction.markApproved(gatewayResult.statusMessage);
    const saved = await this.transactionRepository.update(approved);

    const product = await this.productRepository.findById(saved.productId);
    if (!product) {
      const failed = saved.markError('Producto no encontrado al finalizar el pago');
      await this.transactionRepository.update(failed);
      return err(new PaymentProcessingError('Producto no encontrado al finalizar el pago'));
    }

    const decremented = await this.productRepository.decrementStock(
      product.id,
      product.version,
      1,
    );
    if (!decremented) {
      const failed = saved.markError('Sin stock disponible para completar la compra');
      await this.transactionRepository.update(failed);
      return err(new PaymentProcessingError('Sin stock disponible para completar la compra'));
    }

    if (saved.deliveryId) {
      const delivery = await this.deliveryRepository.assignTransaction(
        saved.deliveryId,
        saved.id,
      );
      await this.deliveryRepository.updateStatus(delivery.id, DeliveryStatus.ASSIGNED);
    }

    return ok(saved);
  }
}