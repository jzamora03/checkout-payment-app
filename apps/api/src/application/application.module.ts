import { Global, Module } from '@nestjs/common';
import { PaymentOutcomeApplier } from './services/payment-outcome.applier';
import { CreateCheckoutTransactionUseCase } from './use-cases/create-checkout-transaction.use-case';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { GetTransactionStatusUseCase } from './use-cases/get-transaction-status.use-case';
import { ListProductsUseCase } from './use-cases/list-products.use-case';

@Global()
@Module({
  providers: [
    PaymentOutcomeApplier,
    ListProductsUseCase,
    GetProductUseCase,
    CreateCheckoutTransactionUseCase,
    GetTransactionStatusUseCase,
  ],
  exports: [
    ListProductsUseCase,
    GetProductUseCase,
    CreateCheckoutTransactionUseCase,
    GetTransactionStatusUseCase,
  ],
})
export class ApplicationModule {}