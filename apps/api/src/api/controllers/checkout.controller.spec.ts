import { err, ok } from 'neverthrow';
import { CheckoutController } from './checkout.controller';
import {
  makeCustomer,
  makeDelivery,
  makeProduct,
  makeTransaction,
} from '../../test/helpers';
import { ProductNotAvailableError } from '../../application/use-cases/use-case.errors';

describe('CheckoutController', () => {
  const createUseCase = { execute: jest.fn() };
  const statusUseCase = { execute: jest.fn() };
  const detailUseCase = { execute: jest.fn() };

  let controller: CheckoutController;

  const detail = {
    transaction: makeTransaction(),
    product: makeProduct(),
    customer: makeCustomer(),
    delivery: makeDelivery(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new CheckoutController(
      createUseCase as never,
      statusUseCase as never,
      detailUseCase as never,
    );
    createUseCase.execute.mockResolvedValue(
      ok({ transaction: makeTransaction(), requiresSync: false }),
    );
    statusUseCase.execute.mockResolvedValue(
      ok({ transaction: makeTransaction(), requiresSync: false }),
    );
    detailUseCase.execute.mockResolvedValue(ok(detail));
  });

  it('crea un checkout y arma la respuesta completa', async () => {
    const response = await controller.create(
      {
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
      },
      { headers: {}, ip: '127.0.0.1' } as never,
    );

    expect(response.transaction.reference).toBe('REF-1');
    expect(response.product.id).toBe('product-1');
    expect(response.delivery.id).toBe('delivery-1');
    expect(response.requiresSync).toBe(false);
    expect(createUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
    );
  });

  it('lanza 409 si el producto no está disponible', async () => {
    createUseCase.execute.mockResolvedValue(
      err(new ProductNotAvailableError('El producto no tiene stock disponible')),
    );
    await expect(
      controller.create(
        {
          productId: 'product-1',
          cardToken: 'tok_test_1234567890',
          customer: {
            email: 'a@b.com',
            firstName: 'A',
            lastName: 'B',
            documentType: 'CC',
            documentNumber: '1067981234',
            phone: null,
          },
          delivery: {
            addressLine1: 'Calle 1',
            addressLine2: null,
            city: 'B',
            state: 'C',
            postalCode: '110111',
            country: 'CO',
            notes: null,
          },
        },
        { headers: {}, ip: '127.0.0.1' } as never,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('consulta el estado por referencia', async () => {
    const response = await controller.status('REF-1');
    expect(response.transaction.reference).toBe('REF-1');
    expect(statusUseCase.execute).toHaveBeenCalledWith('REF-1');
  });

  it('extrae la IP del header X-Forwarded-For', async () => {
    await controller.create(
      {
        productId: 'product-1',
        cardToken: 'tok_test_1234567890',
        customer: {
          email: 'a@b.com',
          firstName: 'A',
          lastName: 'B',
          documentType: 'CC',
          documentNumber: '1067981234',
          phone: null,
        },
        delivery: {
          addressLine1: 'Calle 1',
          addressLine2: null,
          city: 'B',
          state: 'C',
          postalCode: '110111',
          country: 'CO',
          notes: null,
        },
      },
      { headers: { 'x-forwarded-for': '200.10.10.10, 10.0.0.1' } } as never,
    );
    expect(createUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: '200.10.10.10' }),
    );
  });
});