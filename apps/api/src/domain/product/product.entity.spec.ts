import { Product } from './product.entity';

describe('Product (dominio)', () => {
  it('detecta producto sin stock', () => {
    const product = Product.create({
      id: 'p1',
      sku: 'SKU',
      name: 'P',
      description: 'D',
      priceInCents: 1000,
      currency: 'COP',
      stock: 0,
      imageUrl: null,
      isActive: true,
      version: 1,
    });
    expect(product.isOutOfStock).toBe(true);
    expect(product.isPurchasable).toBe(false);
  });

  it('detecta producto comprable solo si está activo y con stock', () => {
    const active = Product.create({
      id: 'p1',
      sku: 'SKU',
      name: 'P',
      description: 'D',
      priceInCents: 1000,
      currency: 'COP',
      stock: 3,
      imageUrl: null,
      isActive: true,
      version: 1,
    });
    expect(active.isPurchasable).toBe(true);

    const inactive = Product.create({
      id: 'p2',
      sku: 'SKU2',
      name: 'P',
      description: 'D',
      priceInCents: 1000,
      currency: 'COP',
      stock: 3,
      imageUrl: null,
      isActive: false,
      version: 1,
    });
    expect(inactive.isPurchasable).toBe(false);
  });

  it('expone los datos en el DTO', () => {
    const product = Product.create({
      id: 'p1',
      sku: 'SKU',
      name: 'P',
      description: 'D',
      priceInCents: 1000,
      currency: 'COP',
      stock: 3,
      imageUrl: 'https://img',
      isActive: true,
      version: 2,
    });
    expect(product.toDTO()).toMatchObject({
      id: 'p1',
      stock: 3,
      version: 2,
      imageUrl: 'https://img',
    });
  });
});