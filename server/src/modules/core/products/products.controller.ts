import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ProductsService } from './products.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateVariantDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product.dto';

@Controller('org/:id')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // --- PRODUCTS ---

  @Get('products')
  findAll(@Param('id') id: string, @Session() session: UserSession) {
    return this.productsService.findAll(id, session.user.id);
  }

  @Get('products/:productId')
  findOne(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Session() session: UserSession,
  ) {
    return this.productsService.findOne(id, session.user.id, productId);
  }

  @Post('products')
  create(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(id, session.user.id, dto);
  }

  @Put('products/:productId')
  update(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, session.user.id, productId, dto);
  }

  @Delete('products/:productId')
  remove(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Session() session: UserSession,
  ) {
    return this.productsService.remove(id, session.user.id, productId);
  }

  // --- VARIANTS ---

  @Post('products/:productId/variants')
  addVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Session() session: UserSession,
    @Body() dto: CreateVariantDto,
  ) {
    return this.productsService.addVariant(id, session.user.id, productId, dto);
  }

  @Put('products/:productId/variants/:variantId')
  updateVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.productsService.updateVariant(
      id,
      session.user.id,
      productId,
      variantId,
      dto,
    );
  }

  @Delete('products/:productId/variants/:variantId')
  removeVariant(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Session() session: UserSession,
  ) {
    return this.productsService.removeVariant(
      id,
      session.user.id,
      productId,
      variantId,
    );
  }

  // --- CATEGORIES ---

  @Get('product-categories')
  findCategories(@Param('id') id: string, @Session() session: UserSession) {
    return this.productsService.findCategories(id, session.user.id);
  }

  @Post('product-categories')
  createCategory(
    @Param('id') id: string,
    @Session() session: UserSession,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.productsService.createCategory(id, session.user.id, dto);
  }

  @Put('product-categories/:categoryId')
  updateCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Session() session: UserSession,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(
      id,
      session.user.id,
      categoryId,
      dto,
    );
  }

  @Delete('product-categories/:categoryId')
  removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Session() session: UserSession,
  ) {
    return this.productsService.removeCategory(id, session.user.id, categoryId);
  }
}
