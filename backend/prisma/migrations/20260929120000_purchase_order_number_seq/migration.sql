-- Sequence for purchase order numbers. Replaces `count() + 1`, which could hand
-- the same number to two concurrent requests.
CREATE SEQUENCE IF NOT EXISTS "purchase_order_number_seq";

-- Continue after existing orders so no number is reused.
SELECT setval(
  'purchase_order_number_seq',
  (SELECT COUNT(*) FROM "purchase_orders") + 1,
  false
);
