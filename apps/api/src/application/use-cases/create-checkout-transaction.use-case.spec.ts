import { err, ok } from 'neverthrow';
import { TransactionStatus } from '../../domain/transaction/transaction.entity';
import { CreateCheckoutTransactionUseCase } from './create-checkout-transaction.use-case';
import {
  makeConfigService,
  makeCustomer,
  makeDelivery,
  makeProduct,
  makeTransaction,
} from '../../test/helpers';

describe('CreateCheckoutTransactionUseCase', () => {
  const productRepository = {
    findPurchasableById: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    decrementStock: jest.fn(),
  };
  const customerRepository = {
    findByEmail: jest.fn(),
    upsertByEmail: jest.fn(),
  };
  const deliveryRepository = {
    create: jest.fn(),
    assignTransaction: jest.fn(),
    updateStatus: jest.fn(),
    findById: jest.fn(),
  };
  const transactionRepository = {
    create: jest.fn(),
    findByReference: jest.fn(),
    findByGatewayTransactionId: jest.fn(),
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

  const configService = makeConfigService({
    BASE_FEE_CENTS: 3000,
    DELIVERY_FEE_CENTS: 5000,
    PAYMENT_INTEGRITY_KEY: 'integrity-key',
    PAYMENT_POLL_ATTEMPTS: 2,
    PAYMENT_POLL_INTERVAL_MS: 1,
  });

  let useCase: CreateCheckoutTransactionUseCase;

  const input = {
    productId: 'product-1',
    cardToken: 'tok_test_1234567890',
    customer: {
      email: 'cliente@test.com',
      firstName: 'Juan',
      lastName: 'Perez',
      documentType: 'CC',
      documentNumber: '1067981234',
      phone: null,
    },
    delivery: {
      addressLine1: 'Calle 123 # 45-67',
      addressLine2: null,
      city: 'Bogota',
      state: 'Cundinamarca',
      postalCode: '110111',
      country: 'CO',
      notes: null,
    },
    ipAddress: '127.0.0.1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateCheckoutTransactionUseCase(
      productRepository as never,
      customerRepository as never,
      deliveryRepository as never,
      transactionRepository as never,
      paymentGateway as never,
      outcomeApplier as never,
      configService,
    );

    productRepository.findPurchasableById.mockResolvedValue(makeProduct());
    customerRepository.upsertByEmail.mockResolvedValue(makeCustomer());
    deliveryRepository.create.mockResolvedValue(makeDelivery());
    transactionRepository.create.mockImplementation((data) =>
      Promise.resolve(makeTransaction({ reference: data.reference })),
    );
    transactionRepository.update.mockImplementation((tx) => Promise.resolve(tx));
    paymentGateway.getAcceptanceToken.mockResolvedValue(
      ok({ acceptanceToken: 'acceptance-token' }),
    );
    paymentGateway.createTransaction.mockResolvedValue(
      ok({
        id: 'gateway-1',
        status: 'PENDING',
        statusMessage: null,
      }),
    );
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-1', status: 'PENDING', statusMessage: null }),
    );
    outcomeApplier.apply.mockResolvedValue(ok(makeTransaction()));
  });

  it('crea la transacción PENDING y llama a la pasarela con la firma correcta', async () => {
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-1', status: 'APPROVED', statusMessage: 'ok' }),
    );
    outcomeApplier.apply.mockResolvedValue(
      ok(makeTransaction({ status: TransactionStatus.APPROVED })),
    );

    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().requiresSync).toBe(false);
    expect(paymentGateway.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: expect.stringMatching(/^REF-/),
        amountInCents: 108000,
        currency: 'COP',
        paymentMethod: { type: 'CARD', token: 'tok_test_1234567890', installments: 1 },
        signature: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amountInCents: 100000,
        baseFeeInCents: 3000,
        deliveryFeeInCents: 5000,
        totalInCents: 108000,
      }),
    );
  });

  it('retorna error si el producto no existe', async () => {
    productRepository.findPurchasableById.mockResolvedValue(null);
    productRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('ProductNotFoundError');
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('retorna error si el producto no tiene stock', async () => {
    productRepository.findPurchasableById.mockResolvedValue(null);
    productRepository.findById.mockResolvedValue(makeProduct({ stock: 0 }));

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('ProductNotAvailableError');
  });

  it('marca ERROR y retorna error si no obtiene el token de aceptación', async () => {
    paymentGateway.getAcceptanceToken.mockResolvedValue(
      err(new Error('no token') as never),
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('aceptación');
    expect(transactionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('marca ERROR y retorna error si la creación en la pasarela falla', async () => {
    paymentGateway.createTransaction.mockResolvedValue(
      err(new Error('rechazado por la pasarela') as never),
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(transactionRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('aplica el resultado DECLINED de la pasarela', async () => {
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-1', status: 'DECLINED', statusMessage: 'Fondos' }),
    );
    outcomeApplier.apply.mockResolvedValue(
      ok(makeTransaction({ status: TransactionStatus.DECLINED })),
    );

    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    expect(outcomeApplier.apply).toHaveBeenCalled();
  });

  it('devuelve requiresSync=true si la pasarela sigue en PENDING', async () => {
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-1', status: 'PENDING', statusMessage: null }),
    );

    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().requiresSync).toBe(true);
    expect(outcomeApplier.apply).not.toHaveBeenCalled();
  });

  it('propaga el error del aplicador de resultado', async () => {
    paymentGateway.getTransaction.mockResolvedValue(
      ok({ id: 'gateway-1', status: 'APPROVED', statusMessage: 'ok' }),
    );
    outcomeApplier.apply.mockResolvedValue(err(new Error('Sin stock') as never));

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Sin stock');
  });
});