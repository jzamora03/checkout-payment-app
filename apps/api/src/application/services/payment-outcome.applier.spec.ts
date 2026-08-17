import { DeliveryStatus } from '../../domain/delivery/delivery.entity';
import { TransactionStatus } from '../../domain/transaction/transaction.entity';
import { PaymentOutcomeApplier } from './payment-outcome.applier';
import {
  makeDelivery,
  makeProduct,
  makeTransaction,
} from '../../test/helpers';

describe('PaymentOutcomeApplier', () => {
  const transactionRepository = {
    update: jest.fn(),
  };
  const productRepository = {
    findById: jest.fn(),
    decrementStock: jest.fn(),
  };
  const deliveryRepository = {
    assignTransaction: jest.fn(),
    updateStatus: jest.fn(),
  };

  let applier: PaymentOutcomeApplier;

  beforeEach(() => {
    jest.clearAllMocks();
    applier = new PaymentOutcomeApplier(
      transactionRepository as never,
      productRepository as never,
      deliveryRepository as never,
    );
    transactionRepository.update.mockImplementation((tx) => Promise.resolve(tx));
    productRepository.findById.mockResolvedValue(makeProduct());
    productRepository.decrementStock.mockResolvedValue(true);
    deliveryRepository.assignTransaction.mockResolvedValue(
      makeDelivery({ transactionId: 'transaction-1' }),
    );
    deliveryRepository.updateStatus.mockResolvedValue(
      makeDelivery({ status: DeliveryStatus.ASSIGNED }),
    );
  });

  it('aprueba la transacción, descuenta stock y asigna la entrega', async () => {
    const tx = makeTransaction();
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe(TransactionStatus.APPROVED);
    expect(productRepository.decrementStock).toHaveBeenCalledWith('product-1', 1, 1);
    expect(deliveryRepository.assignTransaction).toHaveBeenCalledWith(
      'delivery-1',
      'transaction-1',
    );
    expect(deliveryRepository.updateStatus).toHaveBeenCalledWith(
      'delivery-1',
      DeliveryStatus.ASSIGNED,
    );
  });

  it('es idempotente: no descuenta stock dos veces si ya está aprobada', async () => {
    const tx = makeTransaction({ status: TransactionStatus.APPROVED });
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });

    expect(result.isOk()).toBe(true);
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
    expect(deliveryRepository.assignTransaction).not.toHaveBeenCalled();
  });

  it('marca la transacción como declinada', async () => {
    const tx = makeTransaction();
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'DECLINED',
      statusMessage: 'Fondos insuficientes',
    });

    expect(result._unsafeUnwrap().status).toBe(TransactionStatus.DECLINED);
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });

  it('marca la transacción como error para estados ERROR y VOIDED', async () => {
    const tx = makeTransaction();
    const errorResult = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'ERROR',
      statusMessage: 'fallo',
    });
    expect(errorResult._unsafeUnwrap().status).toBe(TransactionStatus.ERROR);

    const tx2 = makeTransaction({ id: 'tx-2', reference: 'REF-2' });
    const voidedResult = await applier.apply(tx2, {
      id: 'wompi-2',
      status: 'VOIDED',
      statusMessage: 'anulada',
    });
    expect(voidedResult._unsafeUnwrap().status).toBe(TransactionStatus.ERROR);
  });

  it('deja la transacción sin cambios si sigue PENDING', async () => {
    const tx = makeTransaction();
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'PENDING',
      statusMessage: null,
    });
    expect(result._unsafeUnwrap().status).toBe(TransactionStatus.PENDING);
  });

  it('retorna error si no hay stock disponible (sobreventa)', async () => {
    productRepository.decrementStock.mockResolvedValue(false);
    const tx = makeTransaction();
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toContain('Sin stock');
    expect(transactionRepository.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: TransactionStatus.ERROR }),
    );
  });

  it('retorna error y marca la transacción si el producto desaparece', async () => {
    productRepository.findById.mockResolvedValue(null);
    const tx = makeTransaction();
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });
    expect(result.isErr()).toBe(true);
  });

  it('aprueba sin entrega asociada (deliveryId nulo)', async () => {
    const tx = makeTransaction({ deliveryId: null });
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'APPROVED',
      statusMessage: 'ok',
    });
    expect(result.isOk()).toBe(true);
    expect(deliveryRepository.assignTransaction).not.toHaveBeenCalled();
  });

  it('no modifica una transacción finalizada ante un DECLINED posterior', async () => {
    const tx = makeTransaction({ status: TransactionStatus.APPROVED });
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'DECLINED',
      statusMessage: 'tarde',
    });
    expect(result._unsafeUnwrap().status).toBe(TransactionStatus.APPROVED);
  });

  it('no modifica una transacción finalizada ante un ERROR posterior', async () => {
    const tx = makeTransaction({ status: TransactionStatus.DECLINED });
    const result = await applier.apply(tx, {
      id: 'wompi-1',
      status: 'ERROR',
      statusMessage: 'tarde',
    });
    expect(result._unsafeUnwrap().status).toBe(TransactionStatus.DECLINED);
  });
});