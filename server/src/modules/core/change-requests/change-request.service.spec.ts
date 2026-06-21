import { BadRequestException } from '@nestjs/common';
import { ChangeEntity, ChangeOp, ChangeStatus } from '@prisma/client';
import { ChangeRequestService } from './change-request.service';
import { MembershipService } from '../membership/membership.service';
import { ProductsService } from '../products/products.service';
import { PurchasesService } from '../purchases/purchases.service';
import { AllocationsService } from '../allocations/allocations.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';

/**
 * Focused tests for the maker-checker approval guard. A SUPPLIER/CREATE request is
 * used because its apply path runs through prisma.supplier.create, which is easy to
 * observe — proving whether the underlying mutation ran or not.
 */
describe('ChangeRequestService.approve (race safety)', () => {
  const PENDING_REQUEST = {
    id: 'req-1',
    organizationId: 'org-1',
    entity: ChangeEntity.SUPPLIER,
    operation: ChangeOp.CREATE,
    productId: null,
    variantId: null,
    categoryId: null,
    supplierId: null,
    payload: { name: 'Acme Ltd' },
    status: ChangeStatus.PENDING,
    requestedBy: 'maker-1',
    reviewedBy: null,
    reviewedAt: null,
    reason: null,
    appliedRefId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let prisma: {
    changeRequest: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    supplier: { create: jest.Mock };
  };
  let service: ChangeRequestService;

  beforeEach(() => {
    prisma = {
      changeRequest: {
        findFirst: jest.fn().mockResolvedValue({ ...PENDING_REQUEST }),
        updateMany: jest.fn(),
        update: jest.fn().mockResolvedValue({
          ...PENDING_REQUEST,
          status: ChangeStatus.APPROVED,
        }),
      },
      supplier: { create: jest.fn().mockResolvedValue({ id: 'sup-1' }) },
    };

    const membership = {
      verifyAccess: jest.fn().mockResolvedValue(true),
    } as unknown as MembershipService;

    service = new ChangeRequestService(
      prisma as unknown as PrismaService,
      membership,
      {} as ProductsService,
      {} as PurchasesService,
      {} as AllocationsService,
    );
  });

  it('applies the change exactly once when it wins the claim', async () => {
    prisma.changeRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.approve('org-1', 'admin-1', 'req-1');

    expect(prisma.changeRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'req-1', status: ChangeStatus.PENDING },
      data: expect.objectContaining({ status: ChangeStatus.APPROVED }),
    });
    expect(prisma.supplier.create).toHaveBeenCalledTimes(1);
  });

  it('does not apply when another approver already claimed the request', async () => {
    // The guarded claim flips nothing → this caller lost the race.
    prisma.changeRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.approve('org-1', 'admin-2', 'req-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.supplier.create).not.toHaveBeenCalled();
  });

  it('lets only one of two concurrent approvers apply', async () => {
    // First updateMany wins (count 1), the second loses (count 0).
    prisma.changeRequest.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const results = await Promise.allSettled([
      service.approve('org-1', 'admin-1', 'req-1'),
      service.approve('org-1', 'admin-2', 'req-1'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(prisma.supplier.create).toHaveBeenCalledTimes(1);
  });

  it('releases the claim back to PENDING when apply fails', async () => {
    prisma.changeRequest.updateMany.mockResolvedValue({ count: 1 });
    prisma.supplier.create.mockRejectedValueOnce(new Error('db down'));

    await expect(service.approve('org-1', 'admin-1', 'req-1')).rejects.toThrow(
      'db down',
    );

    // The catch block must reset the row so it isn't stuck APPROVED-but-unapplied.
    expect(prisma.changeRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: ChangeStatus.PENDING }),
    });
  });
});
