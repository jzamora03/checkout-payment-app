import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentOutcomeApplier } from '../../application/services/payment-outcome.applier';
import { GatewayTransactionResult } from '../../application/ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../../application/ports/transaction-repository.port';
import { WebhookSignatureService } from '../../infrastructure/payment/webhook-signature.service';

interface WompiEventPayload {
  event?: string;
  data?: {
    transaction?: {
      id?: string;
      reference?: string;
      status?: string;
      status_message?: string | null;
    };
  };
}

@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly transactionRepository: TransactionRepositoryPort,
    private readonly outcomeApplier: PaymentOutcomeApplier,
    private readonly signatureService: WebhookSignatureService,
  ) {}

  @Post('payments')
  @HttpCode(200)
  async handlePaymentEvent(
    @Req() req: Request,
    @Body() body: WompiEventPayload,
    @Headers('x-signature') signature?: string,
  ): Promise<{ received: boolean }> {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const payload = rawBody ?? Buffer.from(JSON.stringify(body ?? {}));

    if (!this.signatureService.verify(payload, signature)) {
      throw new BadRequestException('Firma de webhook inválida');
    }

    const gatewayTx = body?.data?.transaction;
    if (!gatewayTx?.id || !gatewayTx?.status) {
      return { received: true };
    }

    const transaction = await this.transactionRepository.findByWompiId(gatewayTx.id);
    if (!transaction) {
      return { received: true };
    }

    const result: GatewayTransactionResult = {
      id: gatewayTx.id,
      status: this.normalizeStatus(gatewayTx.status),
      statusMessage: gatewayTx.status_message ?? null,
    };

    await this.outcomeApplier.apply(transaction, result);
    return { received: true };
  }

  private normalizeStatus(status: string): GatewayTransactionResult['status'] {
    const normalized = status?.toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'DECLINED' || normalized === 'VOIDED') {
      return normalized;
    }
    if (normalized === 'PENDING') {
      return 'PENDING';
    }
    return 'ERROR';
  }
}