import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { mapUseCaseError } from '../errors/http-error.mapper';
import { ProductResponse, productToResponse } from '../presenters/responses';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los productos disponibles con su stock' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async list(): Promise<ProductResponse[]> {
    const products = await this.listProductsUseCase.execute();
    return products.map(productToResponse);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle de un producto' })
  @ApiResponse({ status: 200, description: 'Detalle del producto' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponse> {
    const result = await this.getProductUseCase.execute(id);
    if (result.isErr()) {
      throw mapUseCaseError(result.error);
    }
    return productToResponse(result.value);
  }
}