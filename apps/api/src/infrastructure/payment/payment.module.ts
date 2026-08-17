import { Global, Module } from '@nestjs/common';
import { PaymentGatewayPort } from '../../application/ports/payment-gateway.port';
import { WebhookSignatureService } from './webhook-signature.service';
import { PaymentGatewayAdapter } from './payment.gateway';

@Global()
@Module({
  providers: [
    { provide: PaymentGatewayPort, useClass: PaymentGatewayAdapter },
    WebhookSignatureService,
  ],
  exports: [PaymentGatewayPort, WebhookSignatureService],
})
export class PaymentModule {}