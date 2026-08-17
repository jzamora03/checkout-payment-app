import { ListProductsUseCase } from './list-products.use-case';
import { makeProduct } from '../../test/helpers';

describe('ListProductsUseCase', () => {
  it('retorna todos los productos del repositorio', async () => {
    const productRepository = {
      findAll: jest.fn().mockResolvedValue([makeProduct(), makeProduct({ id: 'p2' })]),
    };

    const useCase = new ListProductsUseCase(productRepository as never);
    const products = await useCase.execute();

    expect(products).toHaveLength(2);
    expect(productRepository.findAll).toHaveBeenCalledWith({ includeOutOfStock: true });
  });

  it('retorna lista vacía cuando no hay productos', async () => {
    const productRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const useCase = new ListProductsUseCase(productRepository as never);
    expect(await useCase.execute()).toEqual([]);
  });
});