import { GetProductUseCase } from './get-product.use-case';
import { makeProduct } from '../../test/helpers';

describe('GetProductUseCase', () => {
  it('retorna el producto si existe', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(makeProduct()),
    };
    const useCase = new GetProductUseCase(productRepository as never);

    const result = await useCase.execute('product-1');
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().id).toBe('product-1');
  });

  it('retorna error si el producto no existe', async () => {
    const productRepository = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const useCase = new GetProductUseCase(productRepository as never);

    const result = await useCase.execute('no-existe');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().name).toBe('ProductNotFoundError');
  });
});