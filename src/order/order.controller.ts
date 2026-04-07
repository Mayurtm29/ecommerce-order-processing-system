import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationMetaDto } from '../common/dto/pagination-meta.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrderService } from './order.service';

/**
 * HTTP API for orders and nested line items.
 */
@ApiTags('orders')
@ApiExtraModels(PaginationMetaDto)
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'List orders with optional filter and pagination' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OrderStatus,
    description: 'Filter by order status',
  })
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
    description: 'Paginated orders with nested items',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Orders with nested line items and products',
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(@Query() query: ListOrdersQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by id' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Numeric order id',
    example: 1,
  })
  @ApiOkResponse({ description: 'Order with line items' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({ description: 'Invalid id format' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order with line items' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Created order with line items' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Numeric order id',
    example: 1,
  })
  @ApiBody({ type: UpdateStatusDto })
  @ApiOkResponse({ description: 'Updated order with line items' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({
    description: 'Validation failed or order is cancelled',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an order (only when status is PENDING)',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Numeric order id',
    example: 1,
  })
  @ApiOkResponse({ description: 'Cancelled order with line items' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiBadRequestResponse({
    description: 'Order is not PENDING or invalid id',
  })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.cancelOrder(id);
  }
}
