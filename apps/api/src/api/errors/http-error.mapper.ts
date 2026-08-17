import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentProcessingError,
  ProductNotAvailableError,
  ProductNotFoundError,
  TransactionNotFoundError,
} from '../../application/use-cases/use-case.errors';

export function mapUseCaseError(error: unknown): HttpException {
  if (error instanceof ProductNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof TransactionNotFoundError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof ProductNotAvailableError) {
    return new ConflictException(error.message);
  }
  if (error instanceof PaymentProcessingError) {
    return new ConflictException(error.message);
  }
  return new InternalServerErrorException('Error interno procesando la solicitud');
}