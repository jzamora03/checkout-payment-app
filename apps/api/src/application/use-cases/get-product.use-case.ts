import { Injectable } from '@nestjs/common';
import { err, ok, Result } from 'neverthrow';
import { Product } from '../../domain/product/product.entity';
import { ProductRepositoryPort } from '../ports/product-repository.port';
import { ProductNotFoundError } from './use-case.errors';

@Injectable()
export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepositoryPort) {}

  async execute(id: string): Promise<Result<Product, ProductNotFoundError>> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return err(new ProductNotFoundError(id));
    }
    return ok(product);
  }
}