-- Drop existing indexes first
DROP INDEX IF EXISTS idx_cash_flow_date;
DROP INDEX IF EXISTS idx_cash_flow_type;
DROP INDEX IF EXISTS idx_cash_flow_category;
DROP INDEX IF EXISTS idx_cash_flow_payment;
DROP INDEX IF EXISTS idx_cash_flow_tenant;

DROP INDEX IF EXISTS idx_sales_invoices_order;
DROP INDEX IF EXISTS idx_sales_invoices_number;
DROP INDEX IF EXISTS idx_sales_invoices_status;
DROP INDEX IF EXISTS idx_sales_invoices_tenant;

DROP INDEX IF EXISTS idx_sales_payments_invoice;
DROP INDEX IF EXISTS idx_sales_payments_date;
DROP INDEX IF EXISTS idx_sales_payments_tenant;

DROP INDEX IF EXISTS idx_purchase_orders_number;
DROP INDEX IF EXISTS idx_purchase_orders_supplier;
DROP INDEX IF EXISTS idx_purchase_orders_status;
DROP INDEX IF EXISTS idx_purchase_orders_tenant;

DROP INDEX IF EXISTS idx_purchase_order_items_po;
DROP INDEX IF EXISTS idx_purchase_order_items_item;
DROP INDEX IF EXISTS idx_purchase_order_items_tenant;

DROP INDEX IF EXISTS idx_petty_cash_office;
DROP INDEX IF EXISTS idx_petty_cash_period;
DROP INDEX IF EXISTS idx_petty_cash_tenant;

DROP INDEX IF EXISTS idx_petty_cash_requests_number;
DROP INDEX IF EXISTS idx_petty_cash_requests_office;
DROP INDEX IF EXISTS idx_petty_cash_requests_employee;
DROP INDEX IF EXISTS idx_petty_cash_requests_status;
DROP INDEX IF EXISTS idx_petty_cash_requests_tenant;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS public.petty_cash_requests;
DROP TABLE IF EXISTS public.petty_cash;
DROP TABLE IF EXISTS public.purchase_order_items;
DROP TABLE IF EXISTS public.purchase_orders;
DROP TABLE IF EXISTS public.sales_payments;
DROP TABLE IF EXISTS public.sales_invoices;
DROP TABLE IF EXISTS public.cash_flow;
DROP TABLE IF EXISTS public.transaction_categories; 