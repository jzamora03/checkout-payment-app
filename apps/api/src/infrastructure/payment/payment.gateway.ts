import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { err, ok, Result } from 'neverthrow';
import {
  CreateGatewayTransactionInput,
  GatewayError,
  GatewayTransactionResult,
  PaymentGatewayPort,
} from '../../application/ports/payment-gateway.port';

interface GatewayTransactionResponse {
  id: string;
  status: string;
  status_message?: string | null;
  payment_method?: {
    brand?: string | null;
    last_four?: string | null;
  };
}

@Injectable()
export class PaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly http: AxiosInstance;
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('PAYMENT_API_URL');
    this.publicKey = this.configService.getOrThrow<string>('PAYMENT_PUBLIC_KEY');
    this.privateKey = this.configService.getOrThrow<string>('PAYMENT_PRIVATE_KEY');

    this.http = axios.create({
      baseURL: this.apiUrl,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getAcceptanceToken(): Promise<
    Result<{ acceptanceToken: string }, GatewayError>
  > {
    try {
      const { data } = await this.http.get(`/merchants/${this.publicKey}`, {
        headers: { Authorization: `Bearer ${this.publicKey}` },
      });
      const token = data?.data?.presigned_acceptance?.acceptance_token;
      if (!token) {
        return err(
          new GatewayError('No se recibió el token de aceptación', 'NO_ACCEPTANCE_TOKEN'),
        );
      }
      return ok({ acceptanceToken: token });
    } catch (error) {
      return err(this.mapHttpError(error));
    }
  }

  async createTransaction(
    input: CreateGatewayTransactionInput,
  ): Promise<Result<GatewayTransactionResult, GatewayError>> {
    try {
      const { data } = await this.http.post(
        '/transactions',
        {
          acceptance_token: input.acceptanceToken,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          customer_email: input.customerEmail,
          payment_method: {
            type: input.paymentMethod.type,
            token: input.paymentMethod.token,
            installments: input.paymentMethod.installments ?? 1,
          },
          reference: input.reference,
          signature: input.signature,
          ...(input.ipAddress ? { ip: input.ipAddress } : {}),
        },
        {
          headers: { Authorization: `Bearer ${this.privateKey}` },
        },
      );
      return ok(this.mapTransaction(data?.data));
    } catch (error) {
      return err(this.mapHttpError(error));
    }
  }

  async getTransaction(
    gatewayTransactionId: string,
  ): Promise<Result<GatewayTransactionResult, GatewayError>> {
    try {
      const { data } = await this.http.get(`/transactions/${gatewayTransactionId}`, {
        headers: { Authorization: `Bearer ${this.publicKey}` },
      });
      return ok(this.mapTransaction(data?.data));
    } catch (error) {
      return err(this.mapHttpError(error));
    }
  }

  private mapTransaction(tx: GatewayTransactionResponse): GatewayTransactionResult {
    return {
      id: tx.id,
      status: this.normalizeStatus(tx.status),
      statusMessage: tx.status_message ?? null,
      cardBrand: tx.payment_method?.brand ?? null,
      cardLastFour: tx.payment_method?.last_four ?? null,
    };
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

  private mapHttpError(error: unknown): GatewayError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as {
        error?: { type?: string; reason?: string };
        message?: string;
      };
      const reason = body?.error?.reason ?? body?.message ?? error.message;
      const code = body?.error?.type ?? 'GATEWAY_ERROR';
      Logger.warn(`Error con la pasarela [${status}]: ${reason}`, 'PaymentGatewayAdapter');
      return new GatewayError(reason, code, status);
    }
    return new GatewayError(
      error instanceof Error ? error.message : 'Error desconocido de la pasarela',
      'GATEWAY_ERROR',
    );
  }
}