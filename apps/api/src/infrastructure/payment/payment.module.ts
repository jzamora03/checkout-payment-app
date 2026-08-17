import { Global, Module } from '@nestjs/common';
import { PaymentGatewayPort } from '../../application/ports/payment-gateway.port';
import { WompiPaymentGateway } from './wompi-payment.gateway';

@Global()
@Module({
  providers: [
    { provide: PaymentGatewayPort, useClass: WompiPaymentGateway },
  ],
  exports: [PaymentGatewayPort],
})
export class PaymentModule {}