import { Module } from '@nestjs/common';
import { CheckoutController } from './controllers/checkout.controller';
import { ProductsController } from './controllers/products.controller';
import { WebhooksController } from './controllers/webhooks.controller';

@Module({
  controllers: [CheckoutController, ProductsController, WebhooksController],
})
export class ApiModule {}