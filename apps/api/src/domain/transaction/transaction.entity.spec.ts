import { Transaction, TransactionStatus } from './transaction.entity';
import { makeTransaction } from '../../test/helpers';

describe('Transaction (dominio)', () => {
  it('crea una transacción PENDING', () => {
    const tx = makeTransaction();
    expect(tx.status).toBe(TransactionStatus.PENDING);
    expect(tx.isFinalized).toBe(false);
  });

  it('marca como APPROVED y es final', () => {
    const tx = makeTransaction();
    const approved = tx.markApproved('Transacción aprobada');
    expect(approved.status).toBe(TransactionStatus.APPROVED);
    expect(approved.isFinalized).toBe(true);
    expect(approved.isApproved).toBe(true);
    expect(approved.statusMessage).toBe('Transacción aprobada');
  });

  it('marca como DECLINED', () => {
    const tx = makeTransaction();
    const declined = tx.markDeclined('Fondos insuficientes');
    expect(declined.status).toBe(TransactionStatus.DECLINED);
    expect(declined.isFinalized).toBe(true);
  });

  it('marca como ERROR', () => {
    const tx = makeTransaction();
    const errored = tx.markError('Procesador no disponible');
    expect(errored.status).toBe(TransactionStatus.ERROR);
    expect(errored.isFinalized).toBe(true);
  });

  it('no modifica una transacción ya finalizada', () => {
    const tx = makeTransaction({ status: TransactionStatus.APPROVED });
    const after = tx.markDeclined('intento inválido');
    expect(after.status).toBe(TransactionStatus.APPROVED);
  });

  it('asigna el id de la pasarela sin mutar el original', () => {
    const tx = makeTransaction();
    const updated = tx.withWompiId('wompi-123');
    expect(updated.wompiTransactionId).toBe('wompi-123');
    expect(tx.wompiTransactionId).toBeNull();
  });

  it('usa mensajes por defecto cuando no se provee uno', () => {
    const approved = makeTransaction().markApproved();
    expect(approved.statusMessage).toBe('Transacción aprobada');

    const declined = makeTransaction().markDeclined();
    expect(declined.statusMessage).toBe('Transacción declinada');

    const errored = makeTransaction().markError();
    expect(errored.statusMessage).toContain('Error');
  });

  it('considera finales los estados APPROVED, DECLINED, ERROR y VOIDED', () => {
    for (const status of [
      TransactionStatus.APPROVED,
      TransactionStatus.DECLINED,
      TransactionStatus.ERROR,
      TransactionStatus.VOIDED,
    ]) {
      const tx = makeTransaction({ status });
      expect(tx.isFinalized).toBe(true);
    }
    expect(makeTransaction().isFinalized).toBe(false);
  });

  it('expone el DTO completo', () => {
    const tx = makeTransaction({ totalInCents: 108000 });
    expect(tx.toDTO()).toMatchObject({
      reference: 'REF-1',
      totalInCents: 108000,
      currency: 'COP',
    });
  });
});