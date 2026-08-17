import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { Customer } from '../../domain/customer/customer.entity';
import { Delivery } from '../../domain/delivery/delivery.entity';
import { Product } from '../../domain/product/product.entity';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { CustomerRepositoryPort } from '../ports/customer-repository.port';
import { DeliveryRepositoryPort } from '../ports/delivery-repository.port';
import { ProductRepositoryPort } from '../ports/product-repository.port';
import { TransactionRepositoryPort } from '../ports/transaction-repository.port';
import {
  PaymentProcessingError,
  TransactionNotFoundError,
  UseCaseError,
} from './use-case.errors';

export interface CheckoutDetail {
  transaction: Transaction;
  product: Product;
  customer: Customer;
  delivery: Delivery;
}

@Injectable()
export class GetCheckoutDetailUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly productRepository: ProductRepositoryPort,
    private readonly customerRepository: CustomerRepositoryPort,
    private readonly deliveryRepository: DeliveryRepositoryPort,
  ) {}

  async execute(reference: string): Promise<Result<CheckoutDetail, UseCaseError>> {
    const transaction = await this.transactionRepository.findByReference(reference);
    if (!transaction) {
      return err(new TransactionNotFoundError(reference));
    }

    const product = await this.productRepository.findById(transaction.productId);
    const customer = await this.customerRepository.findByEmail(transaction.customerEmail);
    const delivery = transaction.deliveryId
      ? await this.deliveryRepository.findById(transaction.deliveryId)
      : null;

    if (!product || !customer || !delivery) {
      return err(new PaymentProcessingError('No fue posible cargar el detalle del checkout'));
    }

    return ok({ transaction, product, customer, delivery });
  }
}