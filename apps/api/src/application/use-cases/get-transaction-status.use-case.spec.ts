import { err, ok } from 'neverthrow';
import { TransactionStatus } from '../../domain/transaction/transaction.entity';
import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';
import { makeTransaction } from '../../test/helpers';

describe('GetTransactionStatusUseCase', () => {
  const transactionRepository = {
    findByReference: jest.fn(),
    create: jest.fn(),
    findByWompiId: jest.fn(),
    update: jest.fn(),
  };
  const paymentGateway = {
    getAcceptanceToken: jest.fn(),
    createTransaction: jest.fn(),
    getTransaction: jest.fn(),
  };
  const outcomeApplier = {
    apply: jest.fn(),
  };

  let useCase: GetTransactionStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetTransactionStatusUseCase(
      transactionRepository as never,
      paymentGateway as never,
      outcomeApplier as never,
    );
  });

  it('retorna error si la transacción no existe', async () => {
    transactionRepository.findByReference.mockResolvedValue(null);
    const result = await useCase.execute('REF-X');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('TransactionNotFoundError');
  });

  it('no consulta la pasarela si la transacción ya está finalizada', async () => {
    transactionRepository.findByReference.mockResolvedValue(
      makeTransaction({ status: TransactionStatus.APPROVED }),
    );
    const result = await useCase.execute('REF-1');
    expect(result.isOk()).toBe(true);
    expect(paymentGateway.getTransaction).not.toHaveBeenCalled();
    expect(result._unsafeUnwrap().requiresSync).toBe(false);
  });

  it('sincroniza y aplica un APPROVED desde la pasarela', async () => {
    const pending = makeTransaction({ wompiTransactionId: 'wompi-1' });
    transactionRepository.findByReference.mockResolvedValue(pending);
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'wompi-1', status: 'APPROVED', statusMessage: 'ok' }),
    );
    outcomeApplier.apply.mockResolvedValue(
      ok(makeTransaction({ status: TransactionStatus.APPROVED })),
    );

    const result = await useCase.execute('REF-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().requiresSync).toBe(false);
    expect(outcomeApplier.apply).toHaveBeenCalled();
  });

  it('devuelve requiresSync=true si sigue PENDING', async () => {
    transactionRepository.findByReference.mockResolvedValue(
      makeTransaction({ wompiTransactionId: 'wompi-1' }),
    );
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'wompi-1', status: 'PENDING', statusMessage: null }),
    );

    const result = await useCase.execute('REF-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().requiresSync).toBe(true);
    expect(outcomeApplier.apply).not.toHaveBeenCalled();
  });

  it('devuelve requiresSync=true si la pasarela falla', async () => {
    transactionRepository.findByReference.mockResolvedValue(
      makeTransaction({ wompiTransactionId: 'wompi-1' }),
    );
    paymentGateway.getTransaction.mockResolvedValue(
      err(new Error('timeout') as never),
    );

    const result = await useCase.execute('REF-1');

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().requiresSync).toBe(true);
  });
});