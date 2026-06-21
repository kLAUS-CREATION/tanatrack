-- Receiving pool: a StockLevel row with BOTH branchId and warehouseId NULL is the
-- org-wide bucket for purchased-but-unallocated stock. The composite all-NULL key is
-- not unique under Postgres NULL semantics, so add a partial unique index guaranteeing
-- a single pool row per variant (mirrors the existing branch/warehouse partial indexes).
CREATE UNIQUE INDEX "stock_level_variant_pool_key" ON "stock_level"("variantId") WHERE "branchId" IS NULL AND "warehouseId" IS NULL;
