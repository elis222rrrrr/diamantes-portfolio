-- Adds an "IN_PRODUCTION" status between PAID and FULFILLED — a
-- customer-facing "the studio has started making this" update, distinct
-- from the payment-confirmed and shipped milestones that already existed.
ALTER TYPE "OrderStatus" ADD VALUE 'IN_PRODUCTION' BEFORE 'FULFILLED';
