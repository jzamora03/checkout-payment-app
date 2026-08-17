import { Product } from '../../domain/product/product.entity';

export interface ListProductFilters {
  includeOutOfStock?: boolean;
}

export abstract class ProductRepositoryPort {
  abstract findAll(filters?: ListProductFilters): Promise<Product[]>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findPurchasableById(id: string): Promise<Product | null>;
  /**
   * Decrementa el stock de forma atómica usando la versión para evitar sobreventa.
   * @returns true si la fila fue actualizada, false si no hay stock o cambió la versión.
   */
  abstract decrementStock(
    id: string,
    expectedVersion: number,
    quantity?: number,
  ): Promise<boolean>;
}