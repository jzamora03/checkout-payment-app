import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateCheckoutTransactionUseCase } from '../../application/use-cases/create-checkout-transaction.use-case';
import { CheckoutDetail } from '../../application/use-cases/get-checkout-detail.use-case';
import { GetCheckoutDetailUseCase } from '../../application/use-cases/get-checkout-detail.use-case';
import { GetTransactionStatusUseCase } from '../../application/use-cases/get-transaction-status.use-case';
import { mapUseCaseError } from '../errors/http-error.mapper';
import { CreateCheckoutTransactionDto } from '../dto/create-checkout-transaction.dto';
import {
  CheckoutResponse,
  customerToResponse,
  deliveryToResponse,
  productToResponse,
  transactionToResponse,
} from '../presenters/responses';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly createCheckoutTransactionUseCase: CreateCheckoutTransactionUseCase,
    private readonly getTransactionStatusUseCase: GetTransactionStatusUseCase,
    private readonly getCheckoutDetailUseCase: GetCheckoutDetailUseCase,
  ) {}

  @Post('transactions')
  @ApiOperation({
    summary:
      'Crea una transacción PENDING, procesa el pago con la pasarela y aplica el resultado',
  })
  @ApiResponse({ status: 201, description: 'Checkout procesado' })
  @ApiResponse({ status: 409, description: 'Sin stock o pago rechazado' })
  async create(
    @Body() dto: CreateCheckoutTransactionDto,
    @Req() req: Request,
  ): Promise<CheckoutResponse> {
    const ip = this.extractIp(req);
    const result = await this.createCheckoutTransactionUseCase.execute({
      productId: dto.productId,
      cardToken: dto.cardToken,
      customer: {
        email: dto.customer.email,
        firstName: dto.customer.firstName,
        lastName: dto.customer.lastName,
        documentType: dto.customer.documentType,
        documentNumber: dto.customer.documentNumber,
        phone: dto.customer.phone ?? null,
      },
      delivery: {
        addressLine1: dto.delivery.addressLine1,
        addressLine2: dto.delivery.addressLine2 ?? null,
        city: dto.delivery.city,
        state: dto.delivery.state,
        postalCode: dto.delivery.postalCode,
        country: dto.delivery.country ?? 'CO',
        notes: dto.delivery.notes ?? null,
      },
      ipAddress: ip,
    });

    if (result.isErr()) {
      throw mapUseCaseError(result.error);
    }

    const detail = await this.getCheckoutDetailUseCase.execute(
      result.value.transaction.reference,
    );
    if (detail.isErr()) {
      throw mapUseCaseError(detail.error);
    }

    return this.toResponse(detail.value, result.value.requiresSync);
  }

  @Get('transactions/:reference')
  @ApiOperation({
    summary: 'Consulta el estado de una transacción y lo sincroniza con la pasarela',
  })
  @ApiResponse({ status: 200, description: 'Estado de la transacción' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async status(@Param('reference') reference: string): Promise<CheckoutResponse> {
    const result = await this.getTransactionStatusUseCase.execute(reference);
    if (result.isErr()) {
      throw mapUseCaseError(result.error);
    }

    const detail = await this.getCheckoutDetailUseCase.execute(reference);
    if (detail.isErr()) {
      throw mapUseCaseError(detail.error);
    }

    return this.toResponse(detail.value, result.value.requiresSync);
  }

  private extractIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? null;
  }

  private toResponse(detail: CheckoutDetail, requiresSync: boolean): CheckoutResponse {
    return {
      transaction: transactionToResponse(detail.transaction),
      product: productToResponse(detail.product),
      customer: customerToResponse(detail.customer),
      delivery: deliveryToResponse(detail.delivery),
      requiresSync,
    };
  }
}