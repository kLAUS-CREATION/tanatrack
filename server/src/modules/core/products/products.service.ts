import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PERMISSIONS } from 'src/constants/permissions.constant';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateVariantDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateVariantDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private membershipService: MembershipService,
  ) {}

  // --- PRODUCTS ---

  async findAll(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_VIEW_ALL,
    );
    return this.prisma.product.findMany({
      where: { organizationId: orgId },
      include: { variants: true, category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, userId: string, productId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_VIEW_ALL,
    );
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId: orgId },
      include: { variants: true, category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(orgId: string, userId: string, dto: CreateProductDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );

    if (dto.categoryId) await this.assertCategoryInOrg(orgId, dto.categoryId);

    const { variants, ...productData } = dto;
    return this.prisma.product.create({
      data: {
        ...productData,
        organizationId: orgId,
        variants: variants?.length
          ? { create: variants.map((v) => this.variantData(v)) }
          : undefined,
      },
      include: { variants: true, category: true },
    });
  }

  async update(
    orgId: string,
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );
    await this.assertProductInOrg(orgId, productId);
    if (dto.categoryId) await this.assertCategoryInOrg(orgId, dto.categoryId);

    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: { variants: true, category: true },
    });
  }

  async remove(orgId: string, userId: string, productId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );
    await this.assertProductInOrg(orgId, productId);
    return this.prisma.product.delete({ where: { id: productId } });
  }

  // --- VARIANTS ---

  async addVariant(
    orgId: string,
    userId: string,
    productId: string,
    dto: CreateVariantDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );
    await this.assertProductInOrg(orgId, productId);
    return this.prisma.productVariant.create({
      data: { ...this.variantData(dto), productId },
    });
  }

  async updateVariant(
    orgId: string,
    userId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );
    await this.assertVariantInOrg(orgId, productId, variantId);
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  async removeVariant(
    orgId: string,
    userId: string,
    productId: string,
    variantId: string,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE,
    );
    await this.assertVariantInOrg(orgId, productId, variantId);
    return this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  // --- CATEGORIES ---

  async findCategories(orgId: string, userId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_VIEW_ALL,
    );
    return this.prisma.productCategory.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(orgId: string, userId: string, dto: CreateCategoryDto) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE_CATEGORIES,
    );
    return this.prisma.productCategory.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  async updateCategory(
    orgId: string,
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE_CATEGORIES,
    );
    await this.assertCategoryInOrg(orgId, categoryId);
    return this.prisma.productCategory.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async removeCategory(orgId: string, userId: string, categoryId: string) {
    await this.membershipService.verifyAccess(
      userId,
      orgId,
      PERMISSIONS.PRODUCTS_MANAGE_CATEGORIES,
    );
    await this.assertCategoryInOrg(orgId, categoryId);
    return this.prisma.productCategory.delete({ where: { id: categoryId } });
  }

  // --- helpers ---

  private variantData(v: CreateVariantDto) {
    return {
      sku: v.sku,
      barcode: v.barcode,
      name: v.name,
      costPrice: v.costPrice ?? 0,
      sellingPrice: v.sellingPrice ?? 0,
      isActive: v.isActive ?? true,
    };
  }

  private async assertProductInOrg(orgId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId: orgId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async assertVariantInOrg(
    orgId: string,
    productId: string,
    variantId: string,
  ) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: variantId,
        productId,
        product: { organizationId: orgId },
      },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  private async assertCategoryInOrg(orgId: string, categoryId: string) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, organizationId: orgId },
    });
    if (!category)
      throw new BadRequestException('Category not found in this organization');
    return category;
  }
}
