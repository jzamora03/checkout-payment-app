export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Producto con id ${id} no encontrado`);
    this.name = 'ProductNotFoundError';
  }
}

export class ProductNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProductNotAvailableError';
  }
}

export class TransactionNotFoundError extends Error {
  constructor(reference: string) {
    super(`Transacción con referencia ${reference} no encontrada`);
    this.name = 'TransactionNotFoundError';
  }
}

export class PaymentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentProcessingError';
  }
}

export type UseCaseError =
  | ProductNotFoundError
  | ProductNotAvailableError
  | TransactionNotFoundError
  | PaymentProcessingError;