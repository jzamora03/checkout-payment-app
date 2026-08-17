import { Global, Module } from '@nestjs/common';
import { PaymentGatewayPort } from '../../application/ports/payment-gateway.port';
import { WebhookSignatureService } from './webhook-signature.service';
import { WompiPaymentGateway } from './wompi-payment.gateway';

@Global()
@Module({
  providers: [
    { provide: PaymentGatewayPort, useClass: WompiPaymentGateway },
    WebhookSignatureService,
  ],
  exports: [PaymentGatewayPort, WebhookSignatureService],
})
export class PaymentModule {}