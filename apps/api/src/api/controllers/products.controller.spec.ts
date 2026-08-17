import { err, ok } from 'neverthrow';
import { ProductsController } from './products.controller';
import { makeProduct } from '../../test/helpers';
import { ProductNotFoundError } from '../../application/use-cases/use-case.errors';

describe('ProductsController', () => {
  const listProductsUseCase = { execute: jest.fn() };
  const getProductUseCase = { execute: jest.fn() };

  let controller: ProductsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProductsController(
      listProductsUseCase as never,
      getProductUseCase as never,
    );
  });

  it('lista los productos', async () => {
    listProductsUseCase.execute.mockResolvedValue([
      makeProduct(),
      makeProduct({ id: 'p2', stock: 0 }),
    ]);
    const response = await controller.list();
    expect(response).toHaveLength(2);
    expect(response[0]).toMatchObject({
      id: 'product-1',
      isPurchasable: true,
    });
    expect(response[1].isPurchasable).toBe(false);
  });

  it('retorna el detalle de un producto', async () => {
    getProductUseCase.execute.mockResolvedValue(ok(makeProduct()));
    const response = await controller.get('product-1');
    expect(response.id).toBe('product-1');
  });

  it('lanza NotFound cuando el producto no existe', async () => {
    getProductUseCase.execute.mockResolvedValue(
      err(new ProductNotFoundError('product-x')),
    );
    await expect(controller.get('product-x')).rejects.toMatchObject({
      status: 404,
    });
  });
});