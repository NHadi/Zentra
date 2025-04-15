-- Accounting Module Tables

-- Transaction Categories
CREATE TABLE public.transaction_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    UNIQUE(code, tenant_id)
);

-- Cash Flow
CREATE TABLE public.cash_flow (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    category_id INTEGER NOT NULL REFERENCES public.transaction_categories(id),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    payment_id INTEGER REFERENCES public.payments(id),
    office_id INTEGER REFERENCES public.master_office(id),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

-- Sales Invoices (for Order transactions)
CREATE TABLE public.sales_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    order_id INTEGER NOT NULL REFERENCES public.orders(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled')),
    notes TEXT,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    UNIQUE(invoice_number, tenant_id)
);

-- Sales Payments (to track order payments)
CREATE TABLE public.sales_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES public.sales_invoices(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES public.master_supplier(id),
    order_date DATE NOT NULL,
    delivery_date DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
    notes TEXT,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    UNIQUE(po_number, tenant_id)
);

-- Purchase Order Items
CREATE TABLE public.purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES public.master_item(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

-- Petty Cash
CREATE TABLE public.petty_cash (
    id SERIAL PRIMARY KEY,
    office_id INTEGER NOT NULL REFERENCES public.master_office(id),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    initial_balance DECIMAL(10,2) NOT NULL,
    current_balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL
);

-- Petty Cash Requests
CREATE TABLE public.petty_cash_requests (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) NOT NULL,
    office_id INTEGER NOT NULL REFERENCES public.master_office(id),
    employee_id INTEGER NOT NULL REFERENCES public.master_employee(id),
    amount DECIMAL(10,2) NOT NULL,
    purpose TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES public.transaction_categories(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tenant_id INTEGER NOT NULL REFERENCES public.master_tenant(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL,
    UNIQUE(request_number, tenant_id)
);

-- Create indexes
CREATE INDEX idx_cash_flow_date ON public.cash_flow(transaction_date);
CREATE INDEX idx_cash_flow_type ON public.cash_flow(transaction_type);
CREATE INDEX idx_cash_flow_category ON public.cash_flow(category_id);
CREATE INDEX idx_cash_flow_payment ON public.cash_flow(payment_id);
CREATE INDEX idx_cash_flow_tenant ON public.cash_flow(tenant_id);

CREATE INDEX idx_sales_invoices_order ON public.sales_invoices(order_id);
CREATE INDEX idx_sales_invoices_number ON public.sales_invoices(invoice_number);
CREATE INDEX idx_sales_invoices_status ON public.sales_invoices(status);
CREATE INDEX idx_sales_invoices_tenant ON public.sales_invoices(tenant_id);

CREATE INDEX idx_sales_payments_invoice ON public.sales_payments(invoice_id);
CREATE INDEX idx_sales_payments_date ON public.sales_payments(payment_date);
CREATE INDEX idx_sales_payments_tenant ON public.sales_payments(tenant_id);

CREATE INDEX idx_purchase_orders_number ON public.purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_tenant ON public.purchase_orders(tenant_id);

CREATE INDEX idx_purchase_order_items_po ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_item ON public.purchase_order_items(item_id);
CREATE INDEX idx_purchase_order_items_tenant ON public.purchase_order_items(tenant_id);

CREATE INDEX idx_petty_cash_office ON public.petty_cash(office_id);
CREATE INDEX idx_petty_cash_period ON public.petty_cash(period_start_date, period_end_date);
CREATE INDEX idx_petty_cash_tenant ON public.petty_cash(tenant_id);

CREATE INDEX idx_petty_cash_requests_number ON public.petty_cash_requests(request_number);
CREATE INDEX idx_petty_cash_requests_office ON public.petty_cash_requests(office_id);
CREATE INDEX idx_petty_cash_requests_employee ON public.petty_cash_requests(employee_id);
CREATE INDEX idx_petty_cash_requests_status ON public.petty_cash_requests(status);
CREATE INDEX idx_petty_cash_requests_tenant ON public.petty_cash_requests(tenant_id);

-- Insert example data
INSERT INTO public.transaction_categories (code, name, type, description, tenant_id, created_by, updated_by) VALUES
('INC-SALES', 'Sales Income', 'income', 'Income from product sales', 1, 'system', 'system'),
('INC-OTHER', 'Other Income', 'income', 'Other sources of income', 1, 'system', 'system'),
('EXP-MAT', 'Material Purchase', 'expense', 'Expenses for raw materials', 1, 'system', 'system'),
('EXP-UTIL', 'Utilities', 'expense', 'Utility expenses', 1, 'system', 'system'),
('EXP-SAL', 'Salaries', 'expense', 'Employee salaries', 1, 'system', 'system');

-- Example Cash Flow (using existing payment records)
INSERT INTO public.cash_flow (transaction_date, transaction_type, category_id, amount, description, reference_number, payment_id, office_id, tenant_id, created_by, updated_by) VALUES
('2024-04-01', 'income', 1, 899.87, 'Order payment received', 'TRX-2024-001-DP', 1, 17, 1, 'system', 'system'),
('2024-04-02', 'income', 1, 449.94, 'Order payment received', 'TRX-2024-001-PP1', 2, 17, 1, 'system', 'system'),
('2024-04-03', 'expense', 4, -500.00, 'Electricity bill payment', 'REF-UTIL-001', NULL, 17, 1, 'system', 'system');

-- Example Sales Invoice for existing order
INSERT INTO public.sales_invoices (invoice_number, order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status, tenant_id, created_by, updated_by) VALUES
('INV-2024-001', 3, '2024-04-01', '2024-04-15', 1612.18, 0, 1612.18, 'partial', 1, 'system', 'system');

-- Example Sales Payments
INSERT INTO public.sales_payments (invoice_id, payment_date, amount, payment_method, reference_number, tenant_id, created_by, updated_by) VALUES
(1, '2024-04-01', 899.87, 'bank_transfer', 'TRX-2024-001-DP', 1, 'system', 'system'),
(1, '2024-04-02', 449.94, 'bank_transfer', 'TRX-2024-001-PP1', 1, 'system', 'system');

-- Example Purchase Orders
INSERT INTO public.purchase_orders (po_number, supplier_id, order_date, delivery_date, subtotal, tax_amount, total_amount, status, tenant_id, created_by, updated_by) VALUES
('PO-2024-001', 1, '2024-04-01', '2024-04-08', 5000.00, 500.00, 5500.00, 'approved', 1, 'system', 'system'),
('PO-2024-002', 2, '2024-04-02', '2024-04-09', 3000.00, 300.00, 3300.00, 'pending', 1, 'system', 'system');

-- Example Purchase Order Items
INSERT INTO public.purchase_order_items (purchase_order_id, item_id, quantity, unit_price, subtotal, tenant_id, created_by, updated_by) VALUES
(1, 1, 100, 30.00, 3000.00, 1, 'system', 'system'),
(1, 2, 50, 40.00, 2000.00, 1, 'system', 'system'),
(2, 3, 60, 50.00, 3000.00, 1, 'system', 'system');

-- Example Petty Cash
INSERT INTO public.petty_cash (office_id, period_start_date, period_end_date, initial_balance, current_balance, tenant_id, created_by, updated_by) VALUES
(17, '2024-04-01', '2024-04-30', 5000.00, 4200.00, 1, 'system', 'system'),
(18, '2024-04-01', '2024-04-30', 3000.00, 2800.00, 1, 'system', 'system');

-- Example Petty Cash Requests
INSERT INTO public.petty_cash_requests (request_number, office_id, employee_id, amount, purpose, category_id, status, tenant_id, created_by, updated_by) VALUES
('PCR-2024-001', 17, 1, 300.00, 'Office supplies purchase', 4, 'approved', 1, 'system', 'system'),
('PCR-2024-002', 17, 2, 500.00, 'Transportation expenses', 4, 'pending', 1, 'system', 'system'); 