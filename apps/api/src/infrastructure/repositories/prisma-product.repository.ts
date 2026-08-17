import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/product/product.entity';
import {
  ListProductFilters,
  ProductRepositoryPort,
} from '../../application/ports/product-repository.port';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: ListProductFilters): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(filters?.includeOutOfStock ? {} : { stock: { gt: 0 } }),
      },
      orderBy: { createdAt: 'asc' },
    });
    return products.map((product) => this.toDomain(product));
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    return product ? this.toDomain(product) : null;
  }

  async findPurchasableById(id: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, isActive: true, stock: { gt: 0 } },
    });
    return product ? this.toDomain(product) : null;
  }

  async decrementStock(
    id: string,
    expectedVersion: number,
    quantity = 1,
  ): Promise<boolean> {
    const result = await this.prisma.product.updateMany({
      where: {
        id,
        isActive: true,
        stock: { gte: quantity },
        version: expectedVersion,
      },
      data: {
        stock: { decrement: quantity },
        version: { increment: 1 },
      },
    });
    return result.count === 1;
  }

  private toDomain(model: {
    id: string;
    sku: string;
    name: string;
    description: string;
    priceInCents: number;
    currency: string;
    stock: number;
    imageUrl: string | null;
    isActive: boolean;
    version: number;
  }): Product {
    return Product.create({
      id: model.id,
      sku: model.sku,
      name: model.name,
      description: model.description,
      priceInCents: model.priceInCents,
      currency: model.currency,
      stock: model.stock,
      imageUrl: model.imageUrl,
      isActive: model.isActive,
      version: model.version,
    });
  }
}