import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductService } from '../services/product/product.service';

/**
 * Product catalog: JWT for all routes; POST/PATCH/DELETE use {@link AdminGuard}.
 */
@ApiTags('products')
@ApiExtraModels(PaginationMetaDto)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List active products (paginated)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Page size (default 20, max 100)',
  })
  @ApiOkResponse({
    description: 'Paginated active products',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Active products',
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.productService.findAllActive(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiConflictResponse({ description: 'SKU already exists' })
  @ApiOperation({ summary: 'Create product (admin)' })
  @ApiCreatedResponse({ description: 'Created product' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiConflictResponse({ description: 'SKU already exists' })
  @ApiOperation({ summary: 'Update product (admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Updated product' })
  @ApiBadRequestResponse({ description: 'No fields to update' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiConflictResponse({ description: 'Referenced by order line items' })
  @ApiOperation({ summary: 'Delete product (admin)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Product deleted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.productService.remove(id);
    return { deleted: true };
  }
}
