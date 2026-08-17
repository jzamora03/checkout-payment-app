import { BadRequestException } from '@nestjs/common';
import { err, ok } from 'neverthrow';
import { WebhooksController } from './webhooks.controller';
import { makeTransaction } from '../../test/helpers';
import { TransactionStatus } from '../../domain/transaction/transaction.entity';

describe('WebhooksController', () => {
  const transactionRepository = { findByGatewayTransactionId: jest.fn() };
  const outcomeApplier = { apply: jest.fn() };
  const signatureService = { verify: jest.fn() };

  let controller: WebhooksController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new WebhooksController(
      transactionRepository as never,
      outcomeApplier as never,
      signatureService as never,
    );
  });

  const reqWithBody = (rawBody: Buffer) =>
    ({ rawBody, headers: {} }) as never;

  it('rechaza eventos con firma inválida', async () => {
    signatureService.verify.mockReturnValue(false);
    await expect(
      controller.handlePaymentEvent(
        reqWithBody(Buffer.from('{}')),
        {},
        'bad-signature',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('procesa un evento válido de transacción aprobada', async () => {
    signatureService.verify.mockReturnValue(true);
    transactionRepository.findByGatewayTransactionId.mockResolvedValue(
      makeTransaction({ gatewayTransactionId: 'gateway-1' }),
    );
    outcomeApplier.apply.mockResolvedValue(
      ok(makeTransaction({ status: TransactionStatus.APPROVED })),
    );

    const response = await controller.handlePaymentEvent(
      reqWithBody(
        Buffer.from(
          JSON.stringify({
            event: 'transaction.updated',
            data: {
              transaction: { id: 'gateway-1', status: 'APPROVED', status_message: 'ok' },
            },
          }),
        ),
      ),
      {
        data: {
          transaction: { id: 'gateway-1', status: 'APPROVED', status_message: 'ok' },
        },
      },
      'valid-signature',
    );

    expect(response).toEqual({ received: true });
    expect(outcomeApplier.apply).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayTransactionId: 'gateway-1' }),
      expect.objectContaining({ id: 'gateway-1', status: 'APPROVED' }),
    );
  });

  it('ignora eventos sin transacción', async () => {
    signatureService.verify.mockReturnValue(true);
    const response = await controller.handlePaymentEvent(
      reqWithBody(Buffer.from('{}')),
      {},
      'valid-signature',
    );
    expect(response).toEqual({ received: true });
    expect(transactionRepository.findByGatewayTransactionId).not.toHaveBeenCalled();
  });
});