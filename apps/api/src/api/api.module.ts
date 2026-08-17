import { Module } from '@nestjs/common';
import { CheckoutController } from './controllers/checkout.controller';
import { ProductsController } from './controllers/products.controller';

@Module({
  controllers: [CheckoutController, ProductsController],
})
export class ApiModule {}