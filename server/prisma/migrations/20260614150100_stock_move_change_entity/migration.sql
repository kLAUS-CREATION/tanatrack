-- Extend the shared change-request system to cover stock allocations (maker-checker).
-- A STOCK_MOVE request snapshots the move (variant, quantity, destination) in `payload`;
-- on approval the stock is moved from the receiving pool to the destination location and
-- a TRANSFER ledger row is written. STOCK_MOVE is CREATE-only.

ALTER TYPE "ChangeEntity" ADD VALUE 'STOCK_MOVE';
