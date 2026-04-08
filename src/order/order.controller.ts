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
  Req,
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
  ApiForbiddenResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
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
  @ApiOperation({
    summary: 'List orders with optional filter and pagination',
    description:
      'Admins see all orders. Regular users only see orders belonging to their account.',
  })
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
    description:
      'Paginated orders with nested items (scoped by role; see operation description)',
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
  findAll(
    @Query() query: ListOrdersQueryDto,
    @Req() req: { user: JwtValidatedUser },
  ) {
    return this.orderService.findAll(query, req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single order by id',
    description:
      'Admins can load any order by id. Regular users can only load their own orders; requesting another user’s order returns 404.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Numeric order id',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Order with line items (regular users: own orders only; see operation description)',
  })
  @ApiNotFoundResponse({
    description:
      'Order not found, or not visible to a non-admin (another user’s order)',
  })
  @ApiBadRequestResponse({ description: 'Invalid id format' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: JwtValidatedUser },
  ) {
    return this.orderService.findOne(id, req.user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order with line items' })
  @ApiBody({ type: CreateOrderDto })
  @ApiCreatedResponse({ description: 'Created order with line items' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: { user: JwtValidatedUser },
  ) {
    return this.orderService.create(createOrderDto, req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiOperation({
    summary:
      'Update order status (admin): one step forward on PENDING→PROCESSING→SHIPPED→DELIVERED only',
  })
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
    description:
      'Invalid transition (skip, backward, same status, terminal order), CANCELLED in body, or validation failed',
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
  @ApiForbiddenResponse({
    description: 'Not the order owner (admins may cancel any PENDING order)',
  })
  @ApiBadRequestResponse({
    description: 'Order is not PENDING or invalid id',
  })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: JwtValidatedUser },
  ) {
    return this.orderService.cancelOrder(id, req.user);
  }
}
