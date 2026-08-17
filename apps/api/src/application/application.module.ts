import { Global, Module } from '@nestjs/common';
import { PaymentOutcomeApplier } from './services/payment-outcome.applier';
import { CreateCheckoutTransactionUseCase } from './use-cases/create-checkout-transaction.use-case';
import { GetCheckoutDetailUseCase } from './use-cases/get-checkout-detail.use-case';
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
    GetCheckoutDetailUseCase,
    GetTransactionStatusUseCase,
  ],
  exports: [
    PaymentOutcomeApplier,
    ListProductsUseCase,
    GetProductUseCase,
    CreateCheckoutTransactionUseCase,
    GetCheckoutDetailUseCase,
    GetTransactionStatusUseCase,
  ],
})
export class ApplicationModule {}