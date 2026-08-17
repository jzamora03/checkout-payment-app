import { Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionStatus,
} from '../../domain/transaction/transaction.entity';
import {
  SaveTransactionInput,
  TransactionRepositoryPort,
} from '../../application/ports/transaction-repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SaveTransactionInput): Promise<Transaction> {
    const transaction = await this.prisma.transaction.create({
      data: {
        reference: input.reference,
        productId: input.productId,
        customerId: input.customerId,
        deliveryId: input.deliveryId,
        amountInCents: input.amountInCents,
        baseFeeInCents: input.baseFeeInCents,
        deliveryFeeInCents: input.deliveryFeeInCents,
        totalInCents: input.totalInCents,
        currency: input.currency,
        customerEmail: input.customerEmail,
        paymentMethodType: input.paymentMethodType,
        ipAddress: input.ipAddress,
        status: TransactionStatus.PENDING,
      },
    });
    return this.toDomain(transaction);
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    return transaction ? this.toDomain(transaction) : null;
  }

  async findByWompiId(wompiTransactionId: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { wompiTransactionId },
    });
    return transaction ? this.toDomain(transaction) : null;
  }

  async update(transaction: Transaction): Promise<Transaction> {
    const props = transaction.toDTO();
    const updated = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        wompiTransactionId: props.wompiTransactionId,
        status: props.status,
        statusMessage: props.statusMessage,
        cardBrand: props.cardBrand,
        cardLastFour: props.cardLastFour,
      },
    });
    return this.toDomain(updated);
  }

  private toDomain(model: {
    id: string;
    reference: string;
    wompiTransactionId: string | null;
    productId: string;
    customerId: string;
    deliveryId: string | null;
    amountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalInCents: number;
    currency: string;
    statusMessage: string | null;
    paymentMethodType: string | null;
    cardBrand: string | null;
    cardLastFour: string | null;
    customerEmail: string;
    ipAddress: string | null;
    status: string;
    createdAt: Date;
  }): Transaction {
    return Transaction.create({
      id: model.id,
      reference: model.reference,
      wompiTransactionId: model.wompiTransactionId,
      productId: model.productId,
      customerId: model.customerId,
      deliveryId: model.deliveryId,
      amountInCents: model.amountInCents,
      baseFeeInCents: model.baseFeeInCents,
      deliveryFeeInCents: model.deliveryFeeInCents,
      totalInCents: model.totalInCents,
      currency: model.currency,
      status: model.status as TransactionStatus,
      statusMessage: model.statusMessage,
      paymentMethodType: model.paymentMethodType,
      cardBrand: model.cardBrand,
      cardLastFour: model.cardLastFour,
customerEmail: model.customerEmail,
      ipAddress: model.ipAddress,
      createdAt: model.createdAt.toISOString(),
    });
  }
}