-- Extend the shared change-request system to cover purchases (maker-checker).
-- A PURCHASE request snapshots the whole purchase in `payload`; on approval the
-- stock increment + ledger rows are applied and `appliedRefId` records the new
-- purchase id. Purchases are CREATE-only, so no dedicated target column is added.

ALTER TYPE "ChangeEntity" ADD VALUE 'PURCHASE';
