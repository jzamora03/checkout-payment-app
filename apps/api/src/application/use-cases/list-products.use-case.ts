import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product/product.entity';
import { ProductRepositoryPort } from '../ports/product-repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(): Promise<Product[]> {
    return this.productRepository.findAll({ includeOutOfStock: true });
  }
}