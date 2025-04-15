-- Drop existing tables and related objects
DROP TRIGGER IF EXISTS tr_update_petty_cash_balance ON public.petty_cash_requests;
DROP FUNCTION IF EXISTS update_petty_cash_balance();
DROP TABLE IF EXISTS public.petty_cash_requests;
DROP TABLE IF EXISTS public.petty_cash;
DROP TABLE IF EXISTS public.master_channel;

-- Create master_channel table
CREATE TABLE public.master_channel (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT pk_master_channel PRIMARY KEY (id),
    CONSTRAINT master_channel_type_check CHECK (type IN ('physical_store', 'online_marketplace', 'website', 'wholesale', 'factory_outlet', 'distributor')),
    CONSTRAINT uq_master_channel_code UNIQUE (code, tenant_id)
);

CREATE SEQUENCE public.master_channel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.master_channel_id_seq OWNED BY public.master_channel.id;
ALTER TABLE ONLY public.master_channel ALTER COLUMN id SET DEFAULT nextval('public.master_channel_id_seq'::regclass);

-- Recreate petty_cash table
CREATE TABLE public.petty_cash (
    id integer NOT NULL,
    office_id integer NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    initial_balance numeric(10,2) NOT NULL,
    current_balance numeric(10,2) NOT NULL,
    channel_id integer,
    division_id integer,
    budget_limit numeric(10,2),
    budget_period character varying(20),
    alert_threshold numeric(10,2),
    status character varying(20) DEFAULT 'active'::character varying,
    balance_updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT pk_petty_cash PRIMARY KEY (id),
    CONSTRAINT petty_cash_status_check CHECK (status::text = ANY (ARRAY['active'::character varying, 'closed'::character varying]::text[])),
    CONSTRAINT petty_cash_budget_period_check CHECK (budget_period IS NULL OR budget_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'))
);

CREATE SEQUENCE public.petty_cash_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.petty_cash_id_seq OWNED BY public.petty_cash.id;
ALTER TABLE ONLY public.petty_cash ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_id_seq'::regclass);

-- Recreate petty_cash_requests table
CREATE TABLE public.petty_cash_requests (
    id integer NOT NULL,
    petty_cash_id integer NOT NULL,
    request_number character varying(50) NOT NULL,
    office_id integer NOT NULL,
    employee_id integer NOT NULL,
    channel_id integer,
    division_id integer,
    amount numeric(10,2) NOT NULL,
    purpose text NOT NULL,
    category_id integer NOT NULL,
    payment_method character varying(20),
    reference_number character varying(100),
    budget_code character varying(50),
    receipt_urls text[],
    status character varying(20) DEFAULT 'pending'::character varying,
    settlement_status character varying(20) DEFAULT 'pending'::character varying,
    settlement_date timestamp with time zone,
    reimbursement_status character varying(20) DEFAULT 'not_required'::character varying,
    reimbursement_date timestamp with time zone,
    approved_by character varying(255),
    approved_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT pk_petty_cash_requests PRIMARY KEY (id),
    CONSTRAINT petty_cash_requests_status_check CHECK (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying]::text[])),
    CONSTRAINT petty_cash_requests_settlement_status_check CHECK (settlement_status::text = ANY (ARRAY['pending'::character varying, 'settled'::character varying, 'cancelled'::character varying]::text[])),
    CONSTRAINT petty_cash_requests_payment_method_check CHECK (payment_method IS NULL OR payment_method IN ('cash', 'bank_transfer', 'digital_wallet', 'other')),
    CONSTRAINT petty_cash_requests_reimbursement_status_check CHECK (reimbursement_status IN ('not_required', 'pending', 'approved', 'rejected', 'completed'))
);

CREATE SEQUENCE public.petty_cash_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.petty_cash_requests_id_seq OWNED BY public.petty_cash_requests.id;
ALTER TABLE ONLY public.petty_cash_requests ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_requests_id_seq'::regclass);

-- Add foreign key constraints
ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_office FOREIGN KEY (office_id) REFERENCES public.master_office(id),
    ADD CONSTRAINT fk_petty_cash_channel FOREIGN KEY (channel_id) REFERENCES public.master_channel(id),
    ADD CONSTRAINT fk_petty_cash_division FOREIGN KEY (division_id) REFERENCES public.master_division(id),
    ADD CONSTRAINT fk_petty_cash_tenant FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_petty_cash FOREIGN KEY (petty_cash_id) REFERENCES public.petty_cash(id),
    ADD CONSTRAINT fk_petty_cash_requests_office FOREIGN KEY (office_id) REFERENCES public.master_office(id),
    ADD CONSTRAINT fk_petty_cash_requests_employee FOREIGN KEY (employee_id) REFERENCES public.master_employee(id),
    ADD CONSTRAINT fk_petty_cash_requests_channel FOREIGN KEY (channel_id) REFERENCES public.master_channel(id),
    ADD CONSTRAINT fk_petty_cash_requests_division FOREIGN KEY (division_id) REFERENCES public.master_division(id),
    ADD CONSTRAINT fk_petty_cash_requests_category FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id),
    ADD CONSTRAINT fk_petty_cash_requests_tenant FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);

-- Create indexes
CREATE INDEX idx_petty_cash_channel ON public.petty_cash(channel_id);
CREATE INDEX idx_petty_cash_division ON public.petty_cash(division_id);
CREATE INDEX idx_petty_cash_office ON public.petty_cash(office_id);
CREATE INDEX idx_petty_cash_requests_petty_cash ON public.petty_cash_requests(petty_cash_id);
CREATE INDEX idx_petty_cash_requests_channel ON public.petty_cash_requests(channel_id);
CREATE INDEX idx_petty_cash_requests_division ON public.petty_cash_requests(division_id);
CREATE INDEX idx_petty_cash_requests_employee ON public.petty_cash_requests(employee_id);
CREATE INDEX idx_petty_cash_requests_office ON public.petty_cash_requests(office_id);

-- Create trigger function to update petty_cash balance
CREATE OR REPLACE FUNCTION update_petty_cash_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.petty_cash
        SET current_balance = current_balance - NEW.amount,
            balance_updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.petty_cash_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tr_update_petty_cash_balance
    AFTER UPDATE ON public.petty_cash_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_petty_cash_balance();

-- Insert sample data for channels
INSERT INTO public.master_channel 
(code, name, type, description, tenant_id, created_by, updated_by)
VALUES
('TOKOPEDIA', 'Tokopedia Store', 'online_marketplace', 'Jersey Industry Official Store di Tokopedia', 1, 'admin', 'admin'),
('SHOPEE', 'Shopee Store', 'online_marketplace', 'Jersey Industry Official Store di Shopee', 1, 'admin', 'admin'),
('WEBSITE', 'Jersey Industry Website', 'website', 'www.jerseyindustry.com', 1, 'admin', 'admin'),
('NCMO-STORE', 'North City Main Store', 'physical_store', 'Toko di North City Main Office', 1, 'admin', 'admin'),
('NCBO-STORE', 'North City Branch Store', 'physical_store', 'Toko di North City Branch Office', 1, 'admin', 'admin'),
('NRMO-STORE', 'North Rural Main Store', 'physical_store', 'Toko di North Rural Main Office', 1, 'admin', 'admin'),
('NRBO-STORE', 'North Rural Branch Store', 'physical_store', 'Toko di North Rural Branch Office', 1, 'admin', 'admin'),
('SCMO-STORE', 'South City Main Store', 'physical_store', 'Toko di South City Main Office', 1, 'admin', 'admin'),
('SCBO-STORE', 'South City Branch Store', 'physical_store', 'Toko di South City Branch Office', 1, 'admin', 'admin'),
('SRMO-STORE', 'South Rural Main Store', 'physical_store', 'Toko di South Rural Main Office', 1, 'admin', 'admin'),
('SRBO-STORE', 'South Rural Branch Store', 'physical_store', 'Toko di South Rural Branch Office', 1, 'admin', 'admin'),
('ECMO-STORE', 'East City Main Store', 'physical_store', 'Toko di East City Main Office', 1, 'admin', 'admin'),
('ECBO-STORE', 'East City Branch Store', 'physical_store', 'Toko di East City Branch Office', 1, 'admin', 'admin'),
('ERMO-STORE', 'East Rural Main Store', 'physical_store', 'Toko di East Rural Main Office', 1, 'admin', 'admin'),
('ERBO-STORE', 'East Rural Branch Store', 'physical_store', 'Toko di East Rural Branch Office', 1, 'admin', 'admin'),
('WCMO-STORE', 'West City Main Store', 'physical_store', 'Toko di West City Main Office', 1, 'admin', 'admin'),
('WCBO-STORE', 'West City Branch Store', 'physical_store', 'Toko di West City Branch Office', 1, 'admin', 'admin'),
('WRMO-STORE', 'West Rural Main Store', 'physical_store', 'Toko di West Rural Main Office', 1, 'admin', 'admin'),
('WRBO-STORE', 'West Rural Branch Store', 'physical_store', 'Toko di West Rural Branch Office', 1, 'admin', 'admin');

-- Insert sample petty cash funds
INSERT INTO public.petty_cash 
(office_id, period_start_date, period_end_date, initial_balance, current_balance, 
channel_id, division_id, budget_limit, budget_period, alert_threshold, 
tenant_id, created_by, updated_by)
VALUES
-- Petty cash for North City Main Office Store
(17, '2024-04-01', '2024-04-30', 10000000, 10000000, 
(SELECT id FROM public.master_channel WHERE code = 'NCMO-STORE'),
1, -- Admin division
10000000, 'monthly', 2000000,
1, 'admin', 'admin'),

-- Petty cash for Online Operations (Tokopedia)
(17, '2024-04-01', '2024-04-30', 5000000, 5000000,
(SELECT id FROM public.master_channel WHERE code = 'TOKOPEDIA'),
2, -- Marketing division
5000000, 'monthly', 1000000,
1, 'admin', 'admin'),

-- Petty cash for Production at North City Main Office
(17, '2024-04-01', '2024-04-30', 15000000, 15000000,
NULL, -- No specific channel
3, -- Production division
15000000, 'monthly', 3000000,
1, 'admin', 'admin');

-- Insert sample petty cash requests
INSERT INTO public.petty_cash_requests 
(petty_cash_id, request_number, office_id, employee_id, channel_id, division_id,
amount, purpose, category_id, payment_method, reference_number, budget_code,
status, tenant_id, created_by, updated_by)
VALUES
-- Request for North City Main Store supplies
(1, 'PCR-2024-001', 17, 1, -- Employee from North City Main Office
(SELECT id FROM public.master_channel WHERE code = 'NCMO-STORE'),
1, -- Admin division
500000, 'Pembelian supplies toko North City Main', 
1, -- Office Supplies category
'cash', 'INV-2024-001', 'STORE-SUPPLIES',
'pending', 1, 'admin', 'admin'),

-- Request for Tokopedia product photography
(2, 'PCR-2024-002', 17, 2, -- Marketing employee
(SELECT id FROM public.master_channel WHERE code = 'TOKOPEDIA'),
2, -- Marketing division
1500000, 'Product photography untuk listing Tokopedia',
2, -- Marketing category
'bank_transfer', 'INV-2024-002', 'TOPED-MARKETING',
'pending', 1, 'admin', 'admin'),

-- Request for Production materials
(3, 'PCR-2024-003', 17, 3, -- Production employee
NULL, -- No specific channel
3, -- Production division
2000000, 'Emergency purchase benang jahit',
3, -- Production Materials category
'cash', 'INV-2024-003', 'PROD-MATERIALS',
'pending', 1, 'admin', 'admin');

-- Add comments
COMMENT ON TABLE public.master_channel IS 'Stores different sales and distribution channels for omnichannel operations';
COMMENT ON TABLE public.petty_cash IS 'Petty cash management table with omnichannel support';
COMMENT ON TABLE public.petty_cash_requests IS 'Petty cash request table with enhanced tracking and channel support'; 