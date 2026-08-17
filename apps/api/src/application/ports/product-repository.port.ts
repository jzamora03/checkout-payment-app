import { Product } from '../../domain/product/product.entity';

export interface ListProductFilters {
  includeOutOfStock?: boolean;
}

export interface ProductRepositoryPort {
  findAll(filters?: ListProductFilters): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findPurchasableById(id: string): Promise<Product | null>;
  /**
   * Decrementa el stock de forma atómica usando la versión para evitar sobreventa.
   * @returns true si la fila fue actualizada, false si no hay stock o cambió la versión.
   */
  decrementStock(id: string, expectedVersion: number, quantity?: number): Promise<boolean>;
}