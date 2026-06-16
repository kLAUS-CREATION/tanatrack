import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChangeEntity, ChangeOp, Prisma } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { ChangeRequestService } from '../change-requests/change-request.service';
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
    @Inject(forwardRef(() => ChangeRequestService))
    private changeRequests: ChangeRequestService,
  ) {}

  // ============================================================
  //  READS (pending creations are never Product rows, so they
  //  stay hidden until approved)
  // ============================================================

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

  // ============================================================
  //  PRODUCT MUTATIONS (maker–checker via ChangeRequestService)
  // ============================================================

  async create(orgId: string, userId: string, dto: CreateProductDto) {
    await this.assertCanManageProducts(orgId, userId);
    if (dto.categoryId) await this.assertCategoryInOrg(orgId, dto.categoryId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.PRODUCT,
      operation: ChangeOp.CREATE,
      payload: dto,
      apply: () => this.applyCreateProduct(orgId, dto),
    });
  }

  async update(
    orgId: string,
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    await this.assertCanManageProducts(orgId, userId);
    await this.assertProductInOrg(orgId, productId);
    if (dto.categoryId) await this.assertCategoryInOrg(orgId, dto.categoryId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.PRODUCT,
      operation: ChangeOp.UPDATE,
      productId,
      payload: dto,
      apply: () => this.applyUpdateProduct(productId, dto),
    });
  }

  async remove(orgId: string, userId: string, productId: string) {
    await this.assertCanManageProducts(orgId, userId);
    await this.assertProductInOrg(orgId, productId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.PRODUCT,
      operation: ChangeOp.DELETE,
      productId,
      apply: () => this.applyDeleteProduct(productId),
    });
  }

  // ============================================================
  //  VARIANT MUTATIONS (maker–checker)
  // ============================================================

  async addVariant(
    orgId: string,
    userId: string,
    productId: string,
    dto: CreateVariantDto,
  ) {
    await this.assertCanManageProducts(orgId, userId);
    await this.assertProductInOrg(orgId, productId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.VARIANT,
      operation: ChangeOp.CREATE,
      productId,
      payload: dto,
      apply: () => this.applyAddVariant(productId, dto),
    });
  }

  async updateVariant(
    orgId: string,
    userId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ) {
    await this.assertCanManageProducts(orgId, userId);
    await this.assertVariantInOrg(orgId, productId, variantId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.VARIANT,
      operation: ChangeOp.UPDATE,
      productId,
      variantId,
      payload: dto,
      apply: () => this.applyUpdateVariant(variantId, dto),
    });
  }

  async removeVariant(
    orgId: string,
    userId: string,
    productId: string,
    variantId: string,
  ) {
    await this.assertCanManageProducts(orgId, userId);
    await this.assertVariantInOrg(orgId, productId, variantId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.VARIANT,
      operation: ChangeOp.DELETE,
      productId,
      variantId,
      apply: () => this.applyDeleteVariant(variantId),
    });
  }

  // ============================================================
  //  CATEGORY MUTATIONS (maker–checker)
  // ============================================================

  async createCategory(orgId: string, userId: string, dto: CreateCategoryDto) {
    await this.assertCanManageCategories(orgId, userId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.CATEGORY,
      operation: ChangeOp.CREATE,
      payload: dto,
      apply: () => this.applyCreateCategory(orgId, dto),
    });
  }

  async updateCategory(
    orgId: string,
    userId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ) {
    await this.assertCanManageCategories(orgId, userId);
    await this.assertCategoryInOrg(orgId, categoryId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.CATEGORY,
      operation: ChangeOp.UPDATE,
      categoryId,
      payload: dto,
      apply: () => this.applyUpdateCategory(categoryId, dto),
    });
  }

  async removeCategory(orgId: string, userId: string, categoryId: string) {
    await this.assertCanManageCategories(orgId, userId);
    await this.assertCategoryInOrg(orgId, categoryId);

    return this.changeRequests.submit(orgId, userId, {
      entity: ChangeEntity.CATEGORY,
      operation: ChangeOp.DELETE,
      categoryId,
      apply: () => this.applyDeleteCategory(categoryId),
    });
  }

  // ============================================================
  //  PERMISSION GATES
  // ============================================================

  /** Allowed for PRODUCTS_MANAGE holders (queued) or approvers (instant). */
  private async assertCanManageProducts(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.PRODUCTS_MANAGE,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException('Missing required permission: PRODUCTS_MANAGE');
    }
  }

  /** Same for category mutations (PRODUCTS_MANAGE_CATEGORIES or approver). */
  private async assertCanManageCategories(orgId: string, userId: string) {
    const allowed =
      (await this.membershipService.hasPermission(
        userId,
        orgId,
        PERMISSIONS.PRODUCTS_MANAGE_CATEGORIES,
      )) || (await this.changeRequests.isApprover(orgId, userId));
    if (!allowed) {
      throw new ForbiddenException(
        'Missing required permission: PRODUCTS_MANAGE_CATEGORIES',
      );
    }
  }

  // ============================================================
  //  APPLY — invoked by ChangeRequestService on approval. Re-validates the
  //  target still exists, then performs the underlying mutation.
  // ============================================================

  async applyChange(
    orgId: string,
    request: {
      entity: ChangeEntity;
      operation: ChangeOp;
      productId: string | null;
      variantId: string | null;
      categoryId: string | null;
      payload: Prisma.JsonValue;
    },
  ): Promise<string> {
    const payload = (request.payload ?? {}) as Record<string, unknown>;

    switch (request.entity) {
      case ChangeEntity.PRODUCT: {
        if (request.operation === ChangeOp.CREATE) {
          const dto = payload as unknown as CreateProductDto;
          if (dto.categoryId)
            await this.assertCategoryInOrg(orgId, dto.categoryId);
          const product = await this.applyCreateProduct(orgId, dto);
          return product.id;
        }
        const productId = request.productId!;
        await this.assertProductInOrg(orgId, productId);
        if (request.operation === ChangeOp.UPDATE) {
          const dto = payload as unknown as UpdateProductDto;
          if (dto.categoryId)
            await this.assertCategoryInOrg(orgId, dto.categoryId);
          await this.applyUpdateProduct(productId, dto);
        } else {
          await this.applyDeleteProduct(productId);
        }
        return productId;
      }

      case ChangeEntity.VARIANT: {
        const productId = request.productId!;
        if (request.operation === ChangeOp.CREATE) {
          await this.assertProductInOrg(orgId, productId);
          const variant = await this.applyAddVariant(
            productId,
            payload as unknown as CreateVariantDto,
          );
          return variant.id;
        }
        const variantId = request.variantId!;
        await this.assertVariantInOrg(orgId, productId, variantId);
        if (request.operation === ChangeOp.UPDATE) {
          await this.applyUpdateVariant(
            variantId,
            payload as unknown as UpdateVariantDto,
          );
        } else {
          await this.applyDeleteVariant(variantId);
        }
        return variantId;
      }

      case ChangeEntity.CATEGORY: {
        if (request.operation === ChangeOp.CREATE) {
          const category = await this.applyCreateCategory(
            orgId,
            payload as unknown as CreateCategoryDto,
          );
          return category.id;
        }
        const categoryId = request.categoryId!;
        await this.assertCategoryInOrg(orgId, categoryId);
        if (request.operation === ChangeOp.UPDATE) {
          await this.applyUpdateCategory(
            categoryId,
            payload as unknown as UpdateCategoryDto,
          );
        } else {
          await this.applyDeleteCategory(categoryId);
        }
        return categoryId;
      }

      default:
        throw new BadRequestException('Unsupported change request');
    }
  }

  // ============================================================
  //  RAW MUTATIONS — the only code that actually writes catalog rows.
  //  Shared by the instant (approver) path and the approve path.
  // ============================================================

  private applyCreateProduct(orgId: string, dto: CreateProductDto) {
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

  private applyUpdateProduct(productId: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: { variants: true, category: true },
    });
  }

  private applyDeleteProduct(productId: string) {
    // Soft delete. A hard delete cascades to sale_item / purchase_item / stock_movement
    // (schema onDelete: Cascade) and would destroy financial history and the append-only
    // ledger. Instead deactivate the product and all its variants so they drop out of the
    // selling/purchasing flows (which filter on isActive) while every record stays intact.
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.updateMany({
        where: { productId },
        data: { isActive: false },
      });
      return tx.product.update({
        where: { id: productId },
        data: { isActive: false },
        include: { variants: true, category: true },
      });
    });
  }

  private applyAddVariant(productId: string, dto: CreateVariantDto) {
    return this.prisma.productVariant.create({
      data: { ...this.variantData(dto), productId },
    });
  }

  private applyUpdateVariant(variantId: string, dto: UpdateVariantDto) {
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  private applyDeleteVariant(variantId: string) {
    // Soft delete to preserve sale/purchase history and the stock ledger — a hard
    // delete cascades and destroys them (see applyDeleteProduct).
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  }

  private applyCreateCategory(orgId: string, dto: CreateCategoryDto) {
    return this.prisma.productCategory.create({
      data: { ...dto, organizationId: orgId },
    });
  }

  private applyUpdateCategory(categoryId: string, dto: UpdateCategoryDto) {
    return this.prisma.productCategory.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  private applyDeleteCategory(categoryId: string) {
    return this.prisma.productCategory.delete({ where: { id: categoryId } });
  }

  // ============================================================
  //  VALIDATION HELPERS
  // ============================================================

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
