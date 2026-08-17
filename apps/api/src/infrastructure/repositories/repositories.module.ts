import { Global, Module } from '@nestjs/common';
import { CustomerRepositoryPort } from '../../application/ports/customer-repository.port';
import { DeliveryRepositoryPort } from '../../application/ports/delivery-repository.port';
import { ProductRepositoryPort } from '../../application/ports/product-repository.port';
import { TransactionRepositoryPort } from '../../application/ports/transaction-repository.port';
import { PrismaCustomerRepository } from './prisma-customer.repository';
import { PrismaDeliveryRepository } from './prisma-delivery.repository';
import { PrismaProductRepository } from './prisma-product.repository';
import { PrismaTransactionRepository } from './prisma-transaction.repository';

@Global()
@Module({
  providers: [
    { provide: ProductRepositoryPort, useClass: PrismaProductRepository },
    { provide: CustomerRepositoryPort, useClass: PrismaCustomerRepository },
    { provide: DeliveryRepositoryPort, useClass: PrismaDeliveryRepository },
    { provide: TransactionRepositoryPort, useClass: PrismaTransactionRepository },
  ],
  exports: [
    ProductRepositoryPort,
    CustomerRepositoryPort,
    DeliveryRepositoryPort,
    TransactionRepositoryPort,
  ],
})
export class RepositoriesModule {}