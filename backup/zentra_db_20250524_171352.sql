--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

-- Started on 2025-05-24 10:13:54 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 24576)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4125 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 317 (class 1255 OID 24587)
-- Name: update_petty_cash_balance(); Type: FUNCTION; Schema: public; Owner: zentra_api_admin
--

CREATE FUNCTION public.update_petty_cash_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.petty_cash
        SET current_balance = current_balance - NEW.amount,
            balance_updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.petty_cash_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_petty_cash_balance() OWNER TO zentra_api_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 24588)
-- Name: audit_trail; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.audit_trail (
    id integer NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_trail OWNER TO zentra_api_admin;

--
-- TOC entry 216 (class 1259 OID 24595)
-- Name: audit_trail_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.audit_trail_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_trail_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4126 (class 0 OID 0)
-- Dependencies: 216
-- Name: audit_trail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.audit_trail_id_seq OWNED BY public.audit_trail.id;


--
-- TOC entry 217 (class 1259 OID 24596)
-- Name: backup; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.backup (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    size bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    tenant_id integer NOT NULL,
    updated_at timestamp without time zone,
    updated_by character varying(255)
);


ALTER TABLE public.backup OWNER TO zentra_api_admin;

--
-- TOC entry 218 (class 1259 OID 24602)
-- Name: backup_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.backup_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.backup_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4127 (class 0 OID 0)
-- Dependencies: 218
-- Name: backup_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.backup_id_seq OWNED BY public.backup.id;


--
-- TOC entry 219 (class 1259 OID 24603)
-- Name: cash_flow; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.cash_flow (
    id integer NOT NULL,
    transaction_date date NOT NULL,
    transaction_type character varying(20) NOT NULL,
    category_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text,
    reference_number character varying(50),
    reference_type character varying(50),
    reference_id integer,
    office_id integer,
    status character varying(20) DEFAULT 'completed'::character varying,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    payment_id bigint,
    CONSTRAINT cash_flow_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text]))),
    CONSTRAINT cash_flow_transaction_type_check CHECK (((transaction_type)::text = ANY (ARRAY[('income'::character varying)::text, ('expense'::character varying)::text])))
);


ALTER TABLE public.cash_flow OWNER TO zentra_api_admin;

--
-- TOC entry 4128 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE cash_flow; Type: COMMENT; Schema: public; Owner: zentra_api_admin
--

COMMENT ON TABLE public.cash_flow IS 'Cash flow table';


--
-- TOC entry 220 (class 1259 OID 24613)
-- Name: cash_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.cash_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cash_flow_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4129 (class 0 OID 0)
-- Dependencies: 220
-- Name: cash_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.cash_flow_id_seq OWNED BY public.cash_flow.id;


--
-- TOC entry 221 (class 1259 OID 24614)
-- Name: item_stock_movement; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.item_stock_movement (
    id integer NOT NULL,
    item_id integer NOT NULL,
    movement_type character varying(20) NOT NULL,
    reference_type character varying(50) NOT NULL,
    reference_id integer NOT NULL,
    quantity integer NOT NULL,
    balance integer NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_movement_type CHECK (((movement_type)::text = ANY (ARRAY[('in'::character varying)::text, ('out'::character varying)::text, ('adjustment'::character varying)::text])))
);


ALTER TABLE public.item_stock_movement OWNER TO zentra_api_admin;

--
-- TOC entry 222 (class 1259 OID 24622)
-- Name: item_stock_movement_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.item_stock_movement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.item_stock_movement_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4130 (class 0 OID 0)
-- Dependencies: 222
-- Name: item_stock_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.item_stock_movement_id_seq OWNED BY public.item_stock_movement.id;


--
-- TOC entry 223 (class 1259 OID 24623)
-- Name: master_channel; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

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
    CONSTRAINT master_channel_type_check CHECK (((type)::text = ANY (ARRAY[('physical_store'::character varying)::text, ('online_marketplace'::character varying)::text, ('website'::character varying)::text, ('wholesale'::character varying)::text, ('factory_outlet'::character varying)::text, ('distributor'::character varying)::text])))
);


ALTER TABLE public.master_channel OWNER TO zentra_api_admin;

--
-- TOC entry 4131 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE master_channel; Type: COMMENT; Schema: public; Owner: zentra_api_admin
--

COMMENT ON TABLE public.master_channel IS 'Stores different sales and distribution channels for omnichannel operations';


--
-- TOC entry 224 (class 1259 OID 24632)
-- Name: master_channel_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_channel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_channel_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4132 (class 0 OID 0)
-- Dependencies: 224
-- Name: master_channel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_channel_id_seq OWNED BY public.master_channel.id;


--
-- TOC entry 294 (class 1259 OID 32768)
-- Name: master_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_customer_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 295 (class 1259 OID 32769)
-- Name: master_customer; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_customer (
    id integer DEFAULT nextval('public.master_customer_id_seq'::regclass) NOT NULL,
    customer_number character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    address text,
    city character varying(100),
    postal_code character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_customer_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


ALTER TABLE public.master_customer OWNER TO zentra_api_admin;

--
-- TOC entry 4133 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE master_customer; Type: COMMENT; Schema: public; Owner: zentra_api_admin
--

COMMENT ON TABLE public.master_customer IS 'Stores customer information for orders and transactions';


--
-- TOC entry 225 (class 1259 OID 24633)
-- Name: master_division_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_division_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_division_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 226 (class 1259 OID 24634)
-- Name: master_division; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_division (
    id integer DEFAULT nextval('public.master_division_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_division OWNER TO zentra_api_admin;

--
-- TOC entry 227 (class 1259 OID 24642)
-- Name: master_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_employee_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 228 (class 1259 OID 24643)
-- Name: master_employee; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_employee (
    id integer DEFAULT nextval('public.master_employee_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255),
    phone character varying(20),
    division_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_employee OWNER TO zentra_api_admin;

--
-- TOC entry 229 (class 1259 OID 24651)
-- Name: master_item; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_item (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    unit character varying(20) NOT NULL,
    min_stock integer DEFAULT 0,
    max_stock integer,
    reorder_point integer,
    category character varying(50),
    is_active boolean DEFAULT true,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_item OWNER TO zentra_api_admin;

--
-- TOC entry 230 (class 1259 OID 24660)
-- Name: master_item_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_item_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 230
-- Name: master_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_item_id_seq OWNED BY public.master_item.id;


--
-- TOC entry 231 (class 1259 OID 24661)
-- Name: master_menu; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_menu (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(255),
    icon character varying(50),
    parent_id integer,
    sort integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_menu OWNER TO zentra_api_admin;

--
-- TOC entry 232 (class 1259 OID 24669)
-- Name: master_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_menu_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 232
-- Name: master_menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_menu_id_seq OWNED BY public.master_menu.id;


--
-- TOC entry 233 (class 1259 OID 24670)
-- Name: master_office; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_office (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50),
    address text,
    phone character varying(20),
    email character varying(255),
    zone_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(50),
    updated_by character varying(50),
    tenant_id integer NOT NULL
);


ALTER TABLE public.master_office OWNER TO zentra_api_admin;

--
-- TOC entry 234 (class 1259 OID 24677)
-- Name: master_office_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_office_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_office_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 234
-- Name: master_office_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_office_id_seq OWNED BY public.master_office.id;


--
-- TOC entry 235 (class 1259 OID 24678)
-- Name: master_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_permission_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 236 (class 1259 OID 24679)
-- Name: master_permission; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_permission (
    id integer DEFAULT nextval('public.master_permission_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL,
    code character varying(100) NOT NULL,
    module character varying(100) NOT NULL
);


ALTER TABLE public.master_permission OWNER TO zentra_api_admin;

--
-- TOC entry 237 (class 1259 OID 24687)
-- Name: master_product_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_product_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 238 (class 1259 OID 24688)
-- Name: master_product; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_product (
    id integer DEFAULT nextval('public.master_product_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    category_id integer NOT NULL,
    description text,
    material character varying(100),
    size_available jsonb,
    color_options jsonb,
    customization_options jsonb,
    production_time integer,
    min_order_quantity integer DEFAULT 1,
    base_price numeric(10,2) NOT NULL,
    bulk_discount_rules jsonb,
    weight numeric(5,2),
    is_active boolean DEFAULT true,
    stock_status character varying(50) DEFAULT 'in_stock'::character varying,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT master_product_base_price_check CHECK ((base_price >= (0)::numeric)),
    CONSTRAINT master_product_min_order_check CHECK ((min_order_quantity > 0))
);


ALTER TABLE public.master_product OWNER TO zentra_api_admin;

--
-- TOC entry 239 (class 1259 OID 24701)
-- Name: master_product_category_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_product_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_product_category_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 240 (class 1259 OID 24702)
-- Name: master_product_category; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_product_category (
    id integer DEFAULT nextval('public.master_product_category_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_product_category OWNER TO zentra_api_admin;

--
-- TOC entry 241 (class 1259 OID 24711)
-- Name: master_region_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_region_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_region_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 242 (class 1259 OID 24712)
-- Name: master_region; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_region (
    id integer DEFAULT nextval('public.master_region_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_region OWNER TO zentra_api_admin;

--
-- TOC entry 243 (class 1259 OID 24720)
-- Name: master_role_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_role_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 244 (class 1259 OID 24721)
-- Name: master_role; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_role (
    id integer DEFAULT nextval('public.master_role_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_role OWNER TO zentra_api_admin;

--
-- TOC entry 245 (class 1259 OID 24729)
-- Name: master_supplier; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_supplier (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    contact_person character varying(100),
    phone character varying(20),
    email character varying(255),
    address text,
    tax_number character varying(50),
    bank_name character varying(100),
    bank_account_number character varying(50),
    bank_account_name character varying(100),
    is_active boolean DEFAULT true,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_supplier OWNER TO zentra_api_admin;

--
-- TOC entry 246 (class 1259 OID 24737)
-- Name: master_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_supplier_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 246
-- Name: master_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_supplier_id_seq OWNED BY public.master_supplier.id;


--
-- TOC entry 247 (class 1259 OID 24738)
-- Name: master_tenant; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_tenant (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    domain character varying(255) NOT NULL,
    status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_tenant OWNER TO zentra_api_admin;

--
-- TOC entry 248 (class 1259 OID 24746)
-- Name: master_tenant_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_tenant_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;


ALTER TABLE public.master_tenant_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 248
-- Name: master_tenant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.master_tenant_id_seq OWNED BY public.master_tenant.id;


--
-- TOC entry 249 (class 1259 OID 24747)
-- Name: master_user_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_user_menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_user_menu_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 250 (class 1259 OID 24748)
-- Name: master_user_menu; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_user_menu (
    id integer DEFAULT nextval('public.master_user_menu_id_seq'::regclass) NOT NULL,
    user_id integer NOT NULL,
    menu_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_user_menu OWNER TO zentra_api_admin;

--
-- TOC entry 251 (class 1259 OID 24756)
-- Name: master_zone_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.master_zone_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.master_zone_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 252 (class 1259 OID 24757)
-- Name: master_zone; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.master_zone (
    id integer DEFAULT nextval('public.master_zone_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    region_id integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.master_zone OWNER TO zentra_api_admin;

--
-- TOC entry 253 (class 1259 OID 24765)
-- Name: order_items; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.order_items (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    size character varying(10) NOT NULL,
    color character varying(50) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    original_subtotal numeric(10,2) NOT NULL,
    applied_discount_rule jsonb,
    discount_amount numeric(10,2) DEFAULT 0,
    final_subtotal numeric(10,2) NOT NULL,
    customization jsonb DEFAULT '{}'::jsonb NOT NULL,
    current_task character varying(20) DEFAULT 'layout'::character varying NOT NULL,
    production_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0)),
    CONSTRAINT valid_production_status CHECK (((production_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('rejected'::character varying)::text])))
);


ALTER TABLE public.order_items OWNER TO zentra_api_admin;

--
-- TOC entry 254 (class 1259 OID 24778)
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 254
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- TOC entry 255 (class 1259 OID 24779)
-- Name: orders; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    order_number character varying(50) NOT NULL,
    office_id integer,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    expected_delivery_date date,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    customer_id integer NOT NULL,
    label character varying(200),
    CONSTRAINT valid_payment_status CHECK (((payment_status)::text = ANY (ARRAY[('unpaid'::character varying)::text, ('partial'::character varying)::text, ('paid'::character varying)::text, ('refunded'::character varying)::text])))
);


ALTER TABLE public.orders OWNER TO zentra_api_admin;

--
-- TOC entry 256 (class 1259 OID 24793)
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 256
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- TOC entry 257 (class 1259 OID 24794)
-- Name: payments; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_date timestamp with time zone NOT NULL,
    reference_number character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_payment_status CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('completed'::character varying)::text, ('failed'::character varying)::text, ('refunded'::character varying)::text])))
);


ALTER TABLE public.payments OWNER TO zentra_api_admin;

--
-- TOC entry 258 (class 1259 OID 24803)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 258
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 259 (class 1259 OID 24804)
-- Name: petty_cash; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

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
    CONSTRAINT petty_cash_budget_period_check CHECK (((budget_period IS NULL) OR ((budget_period)::text = ANY (ARRAY[('daily'::character varying)::text, ('weekly'::character varying)::text, ('monthly'::character varying)::text, ('quarterly'::character varying)::text, ('yearly'::character varying)::text])))),
    CONSTRAINT petty_cash_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('closed'::character varying)::text])))
);


ALTER TABLE public.petty_cash OWNER TO zentra_api_admin;

--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE petty_cash; Type: COMMENT; Schema: public; Owner: zentra_api_admin
--

COMMENT ON TABLE public.petty_cash IS 'Petty cash management table with omnichannel support';


--
-- TOC entry 260 (class 1259 OID 24815)
-- Name: petty_cash_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.petty_cash_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.petty_cash_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4143 (class 0 OID 0)
-- Dependencies: 260
-- Name: petty_cash_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.petty_cash_id_seq OWNED BY public.petty_cash.id;


--
-- TOC entry 261 (class 1259 OID 24816)
-- Name: petty_cash_requests; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

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
    CONSTRAINT petty_cash_requests_payment_method_check CHECK (((payment_method IS NULL) OR ((payment_method)::text = ANY (ARRAY[('cash'::character varying)::text, ('bank_transfer'::character varying)::text, ('digital_wallet'::character varying)::text, ('other'::character varying)::text])))),
    CONSTRAINT petty_cash_requests_reimbursement_status_check CHECK (((reimbursement_status)::text = ANY (ARRAY[('not_required'::character varying)::text, ('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('completed'::character varying)::text]))),
    CONSTRAINT petty_cash_requests_settlement_status_check CHECK (((settlement_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('settled'::character varying)::text, ('cancelled'::character varying)::text]))),
    CONSTRAINT petty_cash_requests_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('completed'::character varying)::text])))
);


ALTER TABLE public.petty_cash_requests OWNER TO zentra_api_admin;

--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE petty_cash_requests; Type: COMMENT; Schema: public; Owner: zentra_api_admin
--

COMMENT ON TABLE public.petty_cash_requests IS 'Petty cash request table with enhanced tracking and channel support';


--
-- TOC entry 262 (class 1259 OID 24830)
-- Name: petty_cash_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.petty_cash_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.petty_cash_requests_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 262
-- Name: petty_cash_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.petty_cash_requests_id_seq OWNED BY public.petty_cash_requests.id;


--
-- TOC entry 263 (class 1259 OID 24831)
-- Name: product_images; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying(255) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100) DEFAULT 'system'::character varying NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(100) DEFAULT 'system'::character varying NOT NULL,
    tenant_id integer NOT NULL
);


ALTER TABLE public.product_images OWNER TO zentra_api_admin;

--
-- TOC entry 264 (class 1259 OID 24840)
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_images_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 264
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- TOC entry 265 (class 1259 OID 24841)
-- Name: production_tasks; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.production_tasks (
    id bigint NOT NULL,
    order_item_id bigint NOT NULL,
    task_type character varying(20) NOT NULL,
    sequence_number integer NOT NULL,
    employee_id integer,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_task_status CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('rejected'::character varying)::text])))
);


ALTER TABLE public.production_tasks OWNER TO zentra_api_admin;

--
-- TOC entry 266 (class 1259 OID 24850)
-- Name: production_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.production_tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.production_tasks_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 266
-- Name: production_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.production_tasks_id_seq OWNED BY public.production_tasks.id;


--
-- TOC entry 267 (class 1259 OID 24851)
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    item_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    received_quantity integer DEFAULT 0,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT purchase_order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.purchase_order_items OWNER TO zentra_api_admin;

--
-- TOC entry 268 (class 1259 OID 24860)
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_order_items_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 268
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- TOC entry 269 (class 1259 OID 24861)
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number character varying(50) NOT NULL,
    supplier_id integer NOT NULL,
    order_date date NOT NULL,
    delivery_date date,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('received'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.purchase_orders OWNER TO zentra_api_admin;

--
-- TOC entry 270 (class 1259 OID 24871)
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.purchase_orders_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 270
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- TOC entry 271 (class 1259 OID 24872)
-- Name: role_menus_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.role_menus_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_menus_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 272 (class 1259 OID 24873)
-- Name: role_menus; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.role_menus (
    id integer DEFAULT nextval('public.role_menus_id_seq'::regclass) NOT NULL,
    role_id integer,
    menu_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.role_menus OWNER TO zentra_api_admin;

--
-- TOC entry 273 (class 1259 OID 24880)
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.role_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 274 (class 1259 OID 24881)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.role_permissions (
    id integer DEFAULT nextval('public.role_permissions_id_seq'::regclass) NOT NULL,
    role_id integer,
    permission_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role_permissions OWNER TO zentra_api_admin;

--
-- TOC entry 275 (class 1259 OID 24889)
-- Name: sales_invoices; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.sales_invoices (
    id integer NOT NULL,
    invoice_number character varying(50) NOT NULL,
    order_id integer NOT NULL,
    invoice_date date NOT NULL,
    due_date date NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0,
    total_amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0,
    status character varying(20) DEFAULT 'unpaid'::character varying,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT sales_invoices_status_check CHECK (((status)::text = ANY (ARRAY[('unpaid'::character varying)::text, ('partial'::character varying)::text, ('paid'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.sales_invoices OWNER TO zentra_api_admin;

--
-- TOC entry 276 (class 1259 OID 24900)
-- Name: sales_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.sales_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sales_invoices_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 276
-- Name: sales_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.sales_invoices_id_seq OWNED BY public.sales_invoices.id;


--
-- TOC entry 277 (class 1259 OID 24901)
-- Name: sales_payments; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.sales_payments (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    payment_date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    reference_number character varying(100),
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.sales_payments OWNER TO zentra_api_admin;

--
-- TOC entry 278 (class 1259 OID 24908)
-- Name: sales_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.sales_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sales_payments_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 278
-- Name: sales_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.sales_payments_id_seq OWNED BY public.sales_payments.id;


--
-- TOC entry 279 (class 1259 OID 24909)
-- Name: stock_opname; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.stock_opname (
    id integer NOT NULL,
    opname_number character varying(50) NOT NULL,
    opname_date date NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_opname_status CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.stock_opname OWNER TO zentra_api_admin;

--
-- TOC entry 280 (class 1259 OID 24918)
-- Name: stock_opname_detail; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.stock_opname_detail (
    id integer NOT NULL,
    stock_opname_id integer NOT NULL,
    item_id integer NOT NULL,
    system_qty integer DEFAULT 0 NOT NULL,
    actual_qty integer DEFAULT 0 NOT NULL,
    difference_qty integer GENERATED ALWAYS AS ((actual_qty - system_qty)) STORED,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.stock_opname_detail OWNER TO zentra_api_admin;

--
-- TOC entry 281 (class 1259 OID 24928)
-- Name: stock_opname_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.stock_opname_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_opname_detail_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 281
-- Name: stock_opname_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.stock_opname_detail_id_seq OWNED BY public.stock_opname_detail.id;


--
-- TOC entry 282 (class 1259 OID 24929)
-- Name: stock_opname_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.stock_opname_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_opname_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 282
-- Name: stock_opname_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.stock_opname_id_seq OWNED BY public.stock_opname.id;


--
-- TOC entry 283 (class 1259 OID 24930)
-- Name: task_history; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.task_history (
    id bigint NOT NULL,
    task_id bigint NOT NULL,
    employee_id integer NOT NULL,
    status_change character varying(50),
    comment text,
    tenant_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.task_history OWNER TO zentra_api_admin;

--
-- TOC entry 284 (class 1259 OID 24937)
-- Name: task_history_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.task_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_history_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 284
-- Name: task_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.task_history_id_seq OWNED BY public.task_history.id;


--
-- TOC entry 285 (class 1259 OID 24938)
-- Name: transaction_categories; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.transaction_categories (
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
    CONSTRAINT transaction_categories_type_check CHECK (((type)::text = ANY (ARRAY[('income'::character varying)::text, ('expense'::character varying)::text])))
);


ALTER TABLE public.transaction_categories OWNER TO zentra_api_admin;

--
-- TOC entry 286 (class 1259 OID 24947)
-- Name: transaction_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.transaction_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transaction_categories_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 286
-- Name: transaction_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.transaction_categories_id_seq OWNED BY public.transaction_categories.id;


--
-- TOC entry 287 (class 1259 OID 24948)
-- Name: users; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tenant_id integer NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO zentra_api_admin;

--
-- TOC entry 288 (class 1259 OID 24956)
-- Name: work_order_items; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.work_order_items (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    item_id integer NOT NULL,
    description text,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL
);


ALTER TABLE public.work_order_items OWNER TO zentra_api_admin;

--
-- TOC entry 289 (class 1259 OID 24963)
-- Name: work_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.work_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_order_items_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 289
-- Name: work_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.work_order_items_id_seq OWNED BY public.work_order_items.id;


--
-- TOC entry 290 (class 1259 OID 24964)
-- Name: work_order_tasks; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.work_order_tasks (
    id integer NOT NULL,
    work_order_id integer NOT NULL,
    task_name character varying(100) NOT NULL,
    description text,
    assigned_to integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    notes text,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_task_status CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text])))
);


ALTER TABLE public.work_order_tasks OWNER TO zentra_api_admin;

--
-- TOC entry 291 (class 1259 OID 24973)
-- Name: work_order_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.work_order_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_order_tasks_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 291
-- Name: work_order_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.work_order_tasks_id_seq OWNED BY public.work_order_tasks.id;


--
-- TOC entry 292 (class 1259 OID 24974)
-- Name: work_orders; Type: TABLE; Schema: public; Owner: zentra_api_admin
--

CREATE TABLE public.work_orders (
    id integer NOT NULL,
    spk_number character varying(50) NOT NULL,
    order_id integer NOT NULL,
    customer_name character varying(100) NOT NULL,
    work_type character varying(50) NOT NULL,
    description text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    assigned_to integer NOT NULL,
    estimated_cost numeric(12,2) NOT NULL,
    actual_cost numeric(12,2),
    completion_notes text,
    tenant_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) NOT NULL,
    CONSTRAINT valid_work_order_status CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('in_progress'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


ALTER TABLE public.work_orders OWNER TO zentra_api_admin;

--
-- TOC entry 293 (class 1259 OID 24983)
-- Name: work_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: zentra_api_admin
--

CREATE SEQUENCE public.work_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.work_orders_id_seq OWNER TO zentra_api_admin;

--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 293
-- Name: work_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zentra_api_admin
--

ALTER SEQUENCE public.work_orders_id_seq OWNED BY public.work_orders.id;


--
-- TOC entry 3407 (class 2604 OID 24984)
-- Name: audit_trail id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.audit_trail ALTER COLUMN id SET DEFAULT nextval('public.audit_trail_id_seq'::regclass);


--
-- TOC entry 3410 (class 2604 OID 24985)
-- Name: backup id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.backup ALTER COLUMN id SET DEFAULT nextval('public.backup_id_seq'::regclass);


--
-- TOC entry 3412 (class 2604 OID 24986)
-- Name: cash_flow id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow ALTER COLUMN id SET DEFAULT nextval('public.cash_flow_id_seq'::regclass);


--
-- TOC entry 3416 (class 2604 OID 24987)
-- Name: item_stock_movement id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.item_stock_movement ALTER COLUMN id SET DEFAULT nextval('public.item_stock_movement_id_seq'::regclass);


--
-- TOC entry 3419 (class 2604 OID 24988)
-- Name: master_channel id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_channel ALTER COLUMN id SET DEFAULT nextval('public.master_channel_id_seq'::regclass);


--
-- TOC entry 3429 (class 2604 OID 24989)
-- Name: master_item id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_item ALTER COLUMN id SET DEFAULT nextval('public.master_item_id_seq'::regclass);


--
-- TOC entry 3434 (class 2604 OID 24990)
-- Name: master_menu id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_menu ALTER COLUMN id SET DEFAULT nextval('public.master_menu_id_seq'::regclass);


--
-- TOC entry 3438 (class 2604 OID 24991)
-- Name: master_office id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office ALTER COLUMN id SET DEFAULT nextval('public.master_office_id_seq'::regclass);


--
-- TOC entry 3460 (class 2604 OID 24992)
-- Name: master_supplier id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_supplier ALTER COLUMN id SET DEFAULT nextval('public.master_supplier_id_seq'::regclass);


--
-- TOC entry 3464 (class 2604 OID 24993)
-- Name: master_tenant id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_tenant ALTER COLUMN id SET DEFAULT nextval('public.master_tenant_id_seq'::regclass);


--
-- TOC entry 3474 (class 2604 OID 24994)
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- TOC entry 3481 (class 2604 OID 24995)
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- TOC entry 3489 (class 2604 OID 24996)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 3493 (class 2604 OID 24997)
-- Name: petty_cash id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_id_seq'::regclass);


--
-- TOC entry 3498 (class 2604 OID 24998)
-- Name: petty_cash_requests id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests ALTER COLUMN id SET DEFAULT nextval('public.petty_cash_requests_id_seq'::regclass);


--
-- TOC entry 3504 (class 2604 OID 24999)
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- TOC entry 3511 (class 2604 OID 25000)
-- Name: production_tasks id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.production_tasks ALTER COLUMN id SET DEFAULT nextval('public.production_tasks_id_seq'::regclass);


--
-- TOC entry 3515 (class 2604 OID 25001)
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- TOC entry 3519 (class 2604 OID 25002)
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- TOC entry 3529 (class 2604 OID 25003)
-- Name: sales_invoices id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_invoices ALTER COLUMN id SET DEFAULT nextval('public.sales_invoices_id_seq'::regclass);


--
-- TOC entry 3535 (class 2604 OID 25004)
-- Name: sales_payments id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_payments ALTER COLUMN id SET DEFAULT nextval('public.sales_payments_id_seq'::regclass);


--
-- TOC entry 3538 (class 2604 OID 25005)
-- Name: stock_opname id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname ALTER COLUMN id SET DEFAULT nextval('public.stock_opname_id_seq'::regclass);


--
-- TOC entry 3542 (class 2604 OID 25006)
-- Name: stock_opname_detail id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname_detail ALTER COLUMN id SET DEFAULT nextval('public.stock_opname_detail_id_seq'::regclass);


--
-- TOC entry 3548 (class 2604 OID 25007)
-- Name: task_history id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.task_history ALTER COLUMN id SET DEFAULT nextval('public.task_history_id_seq'::regclass);


--
-- TOC entry 3551 (class 2604 OID 25008)
-- Name: transaction_categories id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.transaction_categories ALTER COLUMN id SET DEFAULT nextval('public.transaction_categories_id_seq'::regclass);


--
-- TOC entry 3558 (class 2604 OID 25009)
-- Name: work_order_items id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_items ALTER COLUMN id SET DEFAULT nextval('public.work_order_items_id_seq'::regclass);


--
-- TOC entry 3561 (class 2604 OID 25010)
-- Name: work_order_tasks id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_tasks ALTER COLUMN id SET DEFAULT nextval('public.work_order_tasks_id_seq'::regclass);


--
-- TOC entry 3565 (class 2604 OID 25011)
-- Name: work_orders id; Type: DEFAULT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders ALTER COLUMN id SET DEFAULT nextval('public.work_orders_id_seq'::regclass);


--
-- TOC entry 4039 (class 0 OID 24588)
-- Dependencies: 215
-- Data for Name: audit_trail; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.audit_trail (id, entity_type, entity_id, action, old_values, new_values, tenant_id, created_by, created_at, updated_by, updated_at) FROM stdin;
1	menu	38	update	{"id": 38, "url": "tes", "icon": "ni ni-cart", "name": "test test", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T07:56:47.420045Z", "created_by": "admin", "updated_at": "2025-03-23T15:00:53.807792Z", "updated_by": "admin"}	{"id": 38, "url": "tesasdsad", "icon": "ni ni-box-2", "name": "test test", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T07:56:47.420045Z", "created_by": "admin", "updated_at": "2025-03-23T15:03:51.4194733+07:00", "updated_by": "admin"}	1	admin	2025-03-23 15:03:51.428905	\N	2025-03-23 08:03:51.430351
2	menu	39	create	null	{"id": 39, "url": "", "icon": "ni ni-box-2", "name": "new data", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:05:18.129638Z", "created_by": "admin", "updated_at": "2025-03-23T08:05:18.129638Z", "updated_by": "admin"}	1	admin	2025-03-23 15:05:18.136336	\N	2025-03-23 08:05:18.138061
3	menu	38	update	{"id": 38, "url": "tesasdsad", "icon": "ni ni-box-2", "name": "test test", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T07:56:47.420045Z", "created_by": "admin", "updated_at": "2025-03-23T15:03:51.419473Z", "updated_by": "admin"}	{"id": 38, "url": "aaaa", "icon": "ni ni-box-2", "name": "test test", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T07:56:47.420045Z", "created_by": "admin", "updated_at": "2025-03-23T15:05:41.6232625+07:00", "updated_by": "admin"}	1	admin	2025-03-23 15:05:41.630317	\N	2025-03-23 08:05:41.630285
4	menu	39	delete	{"id": 39, "url": "", "icon": "ni ni-box-2", "name": "new data", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:05:18.129638Z", "created_by": "admin", "updated_at": "2025-03-23T08:05:18.129638Z", "updated_by": "admin"}	null	1	admin	2025-03-23 15:08:04.409984	\N	2025-03-23 08:08:04.411549
5	menu	38	delete	{"id": 38, "url": "aaaa", "icon": "ni ni-box-2", "name": "test test", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T07:56:47.420045Z", "created_by": "admin", "updated_at": "2025-03-23T15:05:41.623262Z", "updated_by": "admin"}	null	1	admin	2025-03-23 15:08:06.985538	\N	2025-03-23 08:08:06.98571
6	menu	40	create	null	{"id": 40, "url": "#", "icon": "ni ni-settings", "name": "System", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:08:29.163802Z", "created_by": "admin", "updated_at": "2025-03-23T08:08:29.163802Z", "updated_by": "admin"}	1	admin	2025-03-23 15:08:29.169159	\N	2025-03-23 08:08:29.170542
7	menu	40	update	{"id": 40, "url": "#", "icon": "ni ni-settings", "name": "System", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:08:29.163802Z", "created_by": "admin", "updated_at": "2025-03-23T08:08:29.163802Z", "updated_by": "admin"}	{"id": 40, "url": "", "icon": "ni ni-settings", "name": "System", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:08:29.163802Z", "created_by": "admin", "updated_at": "2025-03-23T15:08:51.7304139+07:00", "updated_by": "admin"}	1	admin	2025-03-23 15:08:51.735969	\N	2025-03-23 08:08:51.736737
8	menu	41	create	null	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail", "sort": 0, "parent_id": null, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin", "updated_at": "2025-03-23T08:11:39.560894Z", "updated_by": "admin"}	1	admin	2025-03-23 15:11:39.569003	\N	2025-03-23 08:11:39.569519
9	menu	41	update	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail test", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	1	admin	2025-03-23 15:48:32.95183	\N	2025-03-23 08:48:32.953968
10	menu	41	update	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail test", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	1	admin	2025-03-23 15:48:37.774268	\N	2025-03-23 08:48:37.774845
11	menu	41	update	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail test", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	1	admin	2025-03-23 16:43:16.640861	\N	2025-03-23 09:43:16.641695
12	menu	41	update	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail test", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	{"id": 41, "url": "/audit", "icon": "ni ni-archive-2", "name": "Audit Trail", "sort": 1, "parent_id": 40, "tenant_id": 1, "created_at": "2025-03-23T08:11:39.560894Z", "created_by": "admin"}	1	admin	2025-03-23 16:43:21.551152	\N	2025-03-23 09:43:21.551965
13	permission	41	create	\N	{"id": 41, "code": "", "name": "test", "module": "", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin", "updated_at": "2025-03-29T21:15:46.329394Z", "updated_by": "admin", "description": "test"}	1	admin	2025-03-29 14:15:46.32911	admin	2025-03-29 14:15:46.32911
14	permission	41	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 41, "name": "test", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin"}	1	admin	2025-03-29 21:15:46.358045	\N	2025-03-29 14:15:46.359341
15	permission	41	update	{"id": 41, "code": "", "name": "test", "module": "", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin", "updated_at": "2025-03-29T21:15:46.329394Z", "updated_by": "admin", "description": "test"}	{"id": 41, "code": "", "name": "test update", "module": "", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin", "updated_at": "2025-03-29T21:16:04.5183375+07:00", "updated_by": "admin", "description": "test"}	1	admin	2025-03-29 14:16:04.513848	admin	2025-03-29 14:16:04.513848
16	permission	41	update	{"id": 41, "name": "test", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin"}	{"id": 41, "name": "test update", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin"}	1	admin	2025-03-29 21:16:04.536005	\N	2025-03-29 14:16:04.536889
17	permission	41	delete	{"id": 41, "code": "", "name": "test update", "module": "", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin", "updated_at": "2025-03-29T21:16:04.518337Z", "updated_by": "admin", "description": "test"}	\N	1	admin	2025-03-29 14:16:08.317354	admin	2025-03-29 14:16:08.317354
18	permission	41	delete	{"id": 41, "name": "test update", "tenant_id": 1, "created_at": "2025-03-29T21:15:46.329394Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-29 21:16:08.331459	\N	2025-03-29 14:16:08.332486
19	product	3	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 3, "name": "Green Jersey", "tenant_id": 1, "created_at": "2025-03-30T06:25:43.264585Z", "created_by": "admin"}	1	admin	2025-03-30 13:25:43.329004	\N	2025-03-30 06:25:43.344205
20	product	4	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 4, "name": "Test new", "tenant_id": 1, "created_at": "2025-03-30T06:51:56.068678Z", "created_by": "admin"}	1	admin	2025-03-30 13:51:56.089695	\N	2025-03-30 06:51:56.091401
21	product	3	delete	{"id": 3, "name": "Green Jersey", "tenant_id": 1, "created_at": "2025-03-30T06:25:43.264585Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-30 13:55:23.159557	\N	2025-03-30 06:55:23.160587
22	product	5	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 5, "name": "test new", "tenant_id": 1, "created_at": "2025-03-30T07:33:11.579406Z", "created_by": "admin"}	1	admin	2025-03-30 14:33:11.591783	\N	2025-03-30 07:33:11.594204
23	product	5	delete	{"id": 5, "name": "test new", "tenant_id": 1, "created_at": "2025-03-30T07:33:11.579406Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-30 14:34:24.398619	\N	2025-03-30 07:34:24.39913
24	division	1	update	{"id": 1, "name": "ADMIN", "tenant_id": 1, "created_at": "2025-03-27T17:31:55.802818Z", "created_by": "system"}	{"id": 1, "name": "ADMIN", "tenant_id": 1, "created_at": "2025-03-27T17:31:55.802818Z", "created_by": "system"}	1	admin	2025-03-30 14:54:43.216178	\N	2025-03-30 07:54:43.217852
25	menu	43	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 43, "icon": "ni ni-tag", "name": "test", "tenant_id": 1, "created_at": "2025-03-30T08:11:00.466591Z", "created_by": "admin"}	1	admin	2025-03-30 15:11:00.477237	\N	2025-03-30 08:11:00.479408
26	menu	43	update	{"id": 43, "icon": "ni ni-tag", "name": "test", "tenant_id": 1, "created_at": "2025-03-30T08:11:00.466591Z", "created_by": "admin"}	{"id": 43, "icon": "ni ni-tag", "name": "test teasd", "tenant_id": 1, "created_at": "2025-03-30T08:11:00.466591Z", "created_by": "admin"}	1	admin	2025-03-30 15:11:26.343578	\N	2025-03-30 08:11:26.34421
27	menu	43	delete	{"id": 43, "icon": "ni ni-tag", "name": "test teasd", "tenant_id": 1, "created_at": "2025-03-30T08:11:00.466591Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-30 15:11:36.10173	\N	2025-03-30 08:11:36.102963
28	menu	44	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 44, "icon": "ni ni-tag", "name": "Menu Header", "tenant_id": 1, "created_at": "2025-03-30T15:43:03.595709Z", "created_by": "admin"}	1	admin	2025-03-30 22:43:03.649842	\N	2025-03-30 15:43:03.652545
29	menu	44	update	{"id": 44, "icon": "ni ni-tag", "name": "Menu Header", "tenant_id": 1, "created_at": "2025-03-30T15:43:03.595709Z", "created_by": "admin"}	{"id": 44, "icon": "ni ni-tag", "name": "Menu Header", "tenant_id": 1, "created_at": "2025-03-30T15:43:03.595709Z", "created_by": "admin"}	1	admin	2025-03-30 22:43:45.691317	\N	2025-03-30 15:43:45.693456
30	menu	45	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 45, "url": "/newmnu", "icon": "ni ni-money-coins", "name": "New menu", "parent_id": 44, "tenant_id": 1, "created_at": "2025-03-30T15:45:43.256613Z", "created_by": "admin"}	1	admin	2025-03-30 22:45:43.264754	\N	2025-03-30 15:45:43.265967
31	menu	45	delete	{"id": 45, "url": "/newmnu", "icon": "ni ni-money-coins", "name": "New menu", "parent_id": 44, "tenant_id": 1, "created_at": "2025-03-30T15:45:43.256613Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-30 22:45:52.783862	\N	2025-03-30 15:45:52.787302
32	menu	44	delete	{"id": 44, "icon": "ni ni-tag", "name": "Menu Header", "tenant_id": 1, "created_at": "2025-03-30T15:43:03.595709Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-03-30 22:45:55.410465	\N	2025-03-30 15:45:55.410605
33	employee	28	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	1	admin	2025-04-01 14:34:44.164123	\N	2025-04-01 07:34:44.165808
34	employee	29	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 29, "name": "asdads", "tenant_id": 1, "created_at": "2025-04-01T07:52:42.127171Z", "created_by": "admin"}	1	admin	2025-04-01 14:52:42.140858	\N	2025-04-01 07:52:42.141752
35	employee	30	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 30, "name": "finishing", "tenant_id": 1, "created_at": "2025-04-01T07:53:38.628777Z", "created_by": "admin"}	1	admin	2025-04-01 14:53:38.636532	\N	2025-04-01 07:53:38.636125
36	employee	28	update	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	1	admin	2025-04-01 14:57:26.824938	\N	2025-04-01 07:57:26.82643
37	employee	28	update	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	1	admin	2025-04-01 14:59:44.68783	\N	2025-04-01 07:59:44.688187
38	employee	28	update	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	1	admin	2025-04-01 15:01:11.799259	\N	2025-04-01 08:01:11.800063
39	employee	28	update	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	1	admin	2025-04-01 15:02:59.451081	\N	2025-04-01 08:02:59.453156
40	employee	30	delete	{"id": 30, "name": "finishing", "tenant_id": 1, "created_at": "2025-04-01T07:53:38.628777Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:04:47.208011	\N	2025-04-01 08:04:47.208981
41	employee	29	delete	{"id": 29, "name": "asdads", "tenant_id": 1, "created_at": "2025-04-01T07:52:42.127171Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:05:00.867764	\N	2025-04-01 08:05:00.869161
42	employee	31	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 31, "name": "john", "tenant_id": 1, "created_at": "2025-04-01T08:10:12.719458Z", "created_by": "admin"}	1	admin	2025-04-01 15:10:12.734173	\N	2025-04-01 08:10:12.734447
43	employee	31	update	{"id": 31, "name": "john", "tenant_id": 1, "created_at": "2025-04-01T08:10:12.719458Z", "created_by": "admin"}	{"id": 31, "name": "john update", "tenant_id": 1, "created_at": "2025-04-01T08:10:12.719458Z", "created_by": "admin"}	1	admin	2025-04-01 15:10:33.983903	\N	2025-04-01 08:10:33.983697
44	employee	31	delete	{"id": 31, "name": "john update", "tenant_id": 1, "created_at": "2025-04-01T08:10:12.719458Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:10:52.439594	\N	2025-04-01 08:10:52.440181
45	employee	28	delete	{"id": 28, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T07:34:44.1148Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:10:57.920398	\N	2025-04-01 08:10:57.921696
46	employee	32	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 32, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:16:10.495215Z", "created_by": "admin"}	1	admin	2025-04-01 15:16:10.501199	\N	2025-04-01 08:16:10.501663
47	employee	32	update	{"id": 32, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:16:10.495215Z", "created_by": "admin"}	{"id": 32, "name": "nurul hadi tset", "tenant_id": 1, "created_at": "2025-04-01T08:16:10.495215Z", "created_by": "admin"}	1	admin	2025-04-01 15:16:18.857479	\N	2025-04-01 08:16:18.858136
48	employee	32	delete	{"id": 32, "name": "nurul hadi tset", "tenant_id": 1, "created_at": "2025-04-01T08:16:10.495215Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:16:31.871848	\N	2025-04-01 08:16:31.871715
49	employee	33	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 33, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:18:40.302686Z", "created_by": "admin"}	1	admin	2025-04-01 15:18:40.321479	\N	2025-04-01 08:18:40.314338
50	employee	33	update	{"id": 33, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:18:40.302686Z", "created_by": "admin"}	{"id": 33, "name": "nurul hadi uody", "tenant_id": 1, "created_at": "2025-04-01T08:18:40.302686Z", "created_by": "admin"}	1	admin	2025-04-01 15:18:50.066209	\N	2025-04-01 08:18:50.068969
51	employee	33	delete	{"id": 33, "name": "nurul hadi uody", "tenant_id": 1, "created_at": "2025-04-01T08:18:40.302686Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:18:57.230342	\N	2025-04-01 08:18:57.233514
52	employee	34	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 34, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	1	admin	2025-04-01 15:19:52.86188	\N	2025-04-01 08:19:52.863733
53	employee	34	update	{"id": 34, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	{"id": 34, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	1	admin	2025-04-01 15:19:59.347363	\N	2025-04-01 08:19:59.350162
54	employee	34	update	{"id": 34, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	{"id": 34, "name": "nurul hadi test ASASD", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	1	admin	2025-04-01 15:20:14.661964	\N	2025-04-01 08:20:14.662973
55	employee	34	update	{"id": 34, "name": "nurul hadi test ASASD", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	{"id": 34, "name": "nurul hadi t", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	1	admin	2025-04-01 15:21:43.516767	\N	2025-04-01 08:21:43.51761
56	employee	34	update	{"id": 34, "name": "nurul hadi t", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	{"id": 34, "name": "nurul hadi tasasd", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	1	admin	2025-04-01 15:21:58.315962	\N	2025-04-01 08:21:58.318094
57	employee	35	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 35, "name": "asasd", "tenant_id": 1, "created_at": "2025-04-01T08:22:18.122244Z", "created_by": "admin"}	1	admin	2025-04-01 15:22:18.125982	\N	2025-04-01 08:22:18.126699
58	employee	35	update	{"id": 35, "name": "asasd", "tenant_id": 1, "created_at": "2025-04-01T08:22:18.122244Z", "created_by": "admin"}	{"id": 35, "name": "asasd asasd", "tenant_id": 1, "created_at": "2025-04-01T08:22:18.122244Z", "created_by": "admin"}	1	admin	2025-04-01 15:22:33.232818	\N	2025-04-01 08:22:33.232179
59	employee	35	delete	{"id": 35, "name": "asasd asasd", "tenant_id": 1, "created_at": "2025-04-01T08:22:18.122244Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:22:37.652628	\N	2025-04-01 08:22:37.652699
60	employee	34	delete	{"id": 34, "name": "nurul hadi tasasd", "tenant_id": 1, "created_at": "2025-04-01T08:19:52.858131Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:23:26.676599	\N	2025-04-01 08:23:26.678795
61	employee	36	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 36, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:25:18.765737Z", "created_by": "admin"}	1	admin	2025-04-01 15:25:18.770861	\N	2025-04-01 08:25:18.772091
62	employee	36	update	{"id": 36, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-01T08:25:18.765737Z", "created_by": "admin"}	{"id": 36, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-01T08:25:18.765737Z", "created_by": "admin"}	1	admin	2025-04-01 15:25:24.368756	\N	2025-04-01 08:25:24.370866
63	employee	36	delete	{"id": 36, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-01T08:25:18.765737Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:26:43.310041	\N	2025-04-01 08:26:43.311001
64	product_category	7	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 7, "name": "Test Category", "tenant_id": 1, "created_at": "2025-04-01T08:49:24.92839Z", "created_by": "admin"}	1	admin	2025-04-01 15:49:24.943235	\N	2025-04-01 08:49:24.945011
65	product_category	7	update	{"id": 7, "name": "Test Category", "tenant_id": 1, "created_at": "2025-04-01T08:49:24.92839Z", "created_by": "admin"}	{"id": 7, "name": "Test Category", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:49:43.552234	\N	2025-04-01 08:49:43.55369
66	product_category	7	delete	{"id": 7, "name": "Test Category", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:50:01.511616	\N	2025-04-01 08:50:01.513618
67	product_category	8	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 8, "name": "test", "tenant_id": 1, "created_at": "2025-04-01T08:50:24.530287Z", "created_by": "admin"}	1	admin	2025-04-01 15:50:24.53497	\N	2025-04-01 08:50:24.536412
68	product_category	8	update	{"id": 8, "name": "test", "tenant_id": 1, "created_at": "2025-04-01T08:50:24.530287Z", "created_by": "admin"}	{"id": 8, "name": "test test", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:50:29.256841	\N	2025-04-01 08:50:29.258362
69	product_category	8	update	{"id": 8, "name": "test test", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	{"id": 8, "name": "test test", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:50:33.247317	\N	2025-04-01 08:50:33.249064
70	product_category	8	delete	{"id": 8, "name": "test test", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 15:50:36.810221	\N	2025-04-01 08:50:36.811017
71	user	0	delete	{"id": "918ec695-573d-45c6-b408-e732a5b79bcf", "tenant_id": 1, "created_at": "2025-04-01T16:30:34.09158+07:00", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-01 16:33:18.837229	\N	2025-04-01 09:33:18.83781
72	user	0	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": "a31debd8-ef47-4b2a-bb08-e7ca49fbbd88", "tenant_id": 1, "created_at": "2025-04-01T16:33:30.538388+07:00", "created_by": "admin"}	1	admin	2025-04-01 16:33:30.548839	\N	2025-04-01 09:33:30.549636
73	menu	46	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 46, "url": "/stock-movement", "icon": "ni ni-archive-2", "name": "Stock Movement", "parent_id": 4, "tenant_id": 1, "created_at": "2025-04-06T15:01:51.654123Z", "created_by": "admin"}	1	admin	2025-04-06 22:01:51.673036	\N	2025-04-06 15:01:51.675308
74	menu	46	update	{"id": 46, "url": "/stock-movement", "icon": "ni ni-archive-2", "name": "Stock Movement", "parent_id": 4, "tenant_id": 1, "created_at": "2025-04-06T15:01:51.654123Z", "created_by": "admin"}	{"id": 46, "url": "/stock-movement", "icon": "ni ni-archive-2", "name": "Stock Movement", "parent_id": 4, "tenant_id": 1, "created_at": "2025-04-06T15:01:51.654123Z", "created_by": "admin"}	1	admin	2025-04-06 22:14:25.264546	\N	2025-04-06 15:14:25.265927
75	menu	47	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 47, "url": "/makloon", "icon": "ni ni-circle-08", "name": "Makloon", "parent_id": 2, "tenant_id": 1, "created_at": "2025-04-06T15:54:36.553501Z", "created_by": "admin"}	1	admin	2025-04-06 22:54:36.574634	\N	2025-04-06 15:54:36.576502
76	menu	48	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 48, "icon": "ni ni-money-coins", "name": "Artificial Intelligence", "tenant_id": 1, "created_at": "2025-04-07T08:11:44.671447Z", "created_by": "admin"}	1	admin	2025-04-07 15:11:44.703606	\N	2025-04-07 08:11:44.709898
77	menu	49	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 49, "url": "/model-builder", "icon": "ni ni-settings", "name": "Model Builder", "tenant_id": 1, "created_at": "2025-04-07T08:12:18.661025Z", "created_by": "admin"}	1	admin	2025-04-07 15:12:18.668389	\N	2025-04-07 08:12:18.671267
78	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:28:22.215436	\N	2025-04-10 10:28:22.217994
79	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:29:17.602371	\N	2025-04-10 10:29:17.602765
80	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:32:59.471487	\N	2025-04-10 10:32:59.473802
81	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:35:21.621948	\N	2025-04-10 10:35:21.623492
82	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:49:34.117517	\N	2025-04-10 10:49:34.119078
83	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:54:04.991328	\N	2025-04-10 10:54:04.985916
84	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:55:57.495845	\N	2025-04-10 10:55:57.495669
85	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:58:17.80635	\N	2025-04-10 10:58:17.807478
86	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-04-10 17:58:47.001842	\N	2025-04-10 10:58:47.003219
87	item	14	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 14, "name": "Testing product", "tenant_id": 1, "created_at": "2025-04-10T23:33:31.480275+07:00", "created_by": "admin"}	1	admin	2025-04-10 23:33:31.625626	\N	2025-04-10 16:33:31.647777
88	item	14	update	{"id": 14, "name": "Testing product", "tenant_id": 1, "created_at": "2025-04-10T23:33:31.480275+07:00", "created_by": "admin"}	{"id": 14, "name": "Testing product test", "tenant_id": 1, "created_at": "2025-04-10T23:33:31.480275+07:00", "created_by": "admin"}	1	admin	2025-04-10 23:48:30.838644	\N	2025-04-10 16:48:30.839479
89	item	14	update	{"id": 14, "name": "Testing product test", "tenant_id": 1, "created_at": "2025-04-10T23:33:31.480275+07:00", "created_by": "admin"}	{"id": 14, "name": "Testing product test asdasd", "tenant_id": 1, "created_at": "2025-04-10T23:33:31.480275+07:00", "created_by": "admin"}	1	admin	2025-04-10 23:53:33.186897	\N	2025-04-10 16:53:33.187486
90	item	15	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 15, "name": "teasdas", "tenant_id": 1, "created_at": "2025-04-11T00:12:02.566894+07:00", "created_by": "admin"}	1	admin	2025-04-11 00:12:02.584584	\N	2025-04-10 17:12:02.586192
115	zone	41	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	1	admin	2025-04-20 12:54:21.178122	\N	2025-04-20 05:54:21.179063
91	item	15	update	{"id": 15, "name": "teasdas", "tenant_id": 1, "created_at": "2025-04-11T00:12:02.566894+07:00", "created_by": "admin"}	{"id": 15, "name": "teasdas asdads", "tenant_id": 1, "created_at": "2025-04-11T00:12:02.566894+07:00", "created_by": "admin"}	1	admin	2025-04-11 00:12:17.738345	\N	2025-04-10 17:12:17.740061
92	transaction_category	6	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 6, "name": "Test", "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-12 23:18:28.723939	\N	2025-04-12 16:18:28.72657
93	transaction_category	6	update	{"id": 6, "name": "Test", "created_at": "0001-01-01T00:00:00Z"}	{"id": 6, "name": "Test yyyy", "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-12 23:24:26.416834	\N	2025-04-12 16:24:26.417515
94	transaction_category	6	delete	{"id": 6, "name": "Test yyyy", "created_at": "0001-01-01T00:00:00Z"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-12 23:24:33.273242	\N	2025-04-12 16:24:33.273992
95	zone	37	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 37, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:25:26.892937Z", "created_by": "admin"}	1	admin	2025-04-20 12:25:26.913249	\N	2025-04-20 05:25:26.915468
96	zone	37	update	{"id": 37, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:25:26.892937Z", "created_by": "admin"}	{"id": 37, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:25:26.892937Z", "created_by": "admin"}	1	admin	2025-04-20 12:26:00.077069	\N	2025-04-20 05:26:00.078009
97	region	16	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 16, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:26:23.6133Z", "created_by": "admin"}	1	admin	2025-04-20 12:26:23.629349	\N	2025-04-20 05:26:23.630505
98	region	16	delete	{"id": 16, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:26:23.6133Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 12:37:39.407986	\N	2025-04-20 05:37:39.408155
99	region	17	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	1	admin	2025-04-20 12:37:47.838538	\N	2025-04-20 05:37:47.839709
100	region	17	update	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	1	admin	2025-04-20 12:38:21.815661	\N	2025-04-20 05:38:21.816665
101	region	17	update	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	1	admin	2025-04-20 12:38:59.513797	\N	2025-04-20 05:38:59.515514
102	zone	37	delete	{"id": 37, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:25:26.892937Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 12:39:44.43704	\N	2025-04-20 05:39:44.437527
103	region	17	delete	{"id": 17, "name": "Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:37:47.826669Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 12:39:50.295297	\N	2025-04-20 05:39:50.295653
104	zone	38	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 38, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:41:41.340799Z", "created_by": "admin"}	1	admin	2025-04-20 12:41:41.347884	\N	2025-04-20 05:41:41.348098
105	zone	38	delete	{"id": 38, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:41:41.340799Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 12:42:23.948027	\N	2025-04-20 05:42:23.948851
106	zone	39	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 39, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:42:39.668861Z", "created_by": "admin"}	1	admin	2025-04-20 12:42:39.682398	\N	2025-04-20 05:42:39.682443
107	zone	39	update	{"id": 39, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:42:39.668861Z", "created_by": "admin"}	{"id": 39, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:42:39.668861Z", "created_by": "admin"}	1	admin	2025-04-20 12:42:45.389552	\N	2025-04-20 05:42:45.389799
108	zone	39	update	{"id": 39, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:42:39.668861Z", "created_by": "admin"}	{"id": 39, "name": "Depok", "tenant_id": 1, "created_at": "2025-04-20T05:42:39.668861Z", "created_by": "admin"}	1	admin	2025-04-20 12:42:53.498574	\N	2025-04-20 05:42:53.499513
109	region	18	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 18, "name": "IDN - Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:49:51.657504Z", "created_by": "admin"}	1	admin	2025-04-20 12:49:51.664016	\N	2025-04-20 05:49:51.664473
110	region	18	update	{"id": 18, "name": "IDN - Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:49:51.657504Z", "created_by": "admin"}	{"id": 18, "name": "IDN - Jawa Barat", "tenant_id": 1, "created_at": "2025-04-20T05:49:51.657504Z", "created_by": "admin"}	1	admin	2025-04-20 12:50:01.097709	\N	2025-04-20 05:50:01.099256
111	zone	40	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 12:50:19.68214	\N	2025-04-20 05:50:19.682448
112	menu	11	update	{"id": 11, "url": "/region", "icon": "ni ni-world-2", "name": "Region", "sort": 2, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	{"id": 11, "url": "/region", "icon": "ni ni-world-2", "name": "Region", "sort": 2, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	1	admin	2025-04-20 12:51:28.659414	\N	2025-04-20 05:51:28.660831
113	menu	10	update	{"id": 10, "url": "/zone", "icon": "ni ni-map-big", "name": "Zone", "sort": 1, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	{"id": 10, "url": "/zone", "icon": "ni ni-map-big", "name": "Zone", "sort": 1, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	1	admin	2025-04-20 12:51:33.488505	\N	2025-04-20 05:51:33.489659
114	menu	11	update	{"id": 11, "url": "/region", "icon": "ni ni-world-2", "name": "Region", "sort": 2, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	{"id": 11, "url": "/region", "icon": "ni ni-world-2", "name": "Region", "sort": 2, "parent_id": 2, "tenant_id": 1, "created_at": "2025-03-22T07:25:18.170058Z", "created_by": "system"}	1	admin	2025-04-20 12:51:56.63281	\N	2025-04-20 05:51:56.6338
116	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:03:02.815673	\N	2025-04-20 06:03:02.817152
117	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:03:08.215141	\N	2025-04-20 06:03:08.216934
118	zone	41	update	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	1	admin	2025-04-20 13:04:14.595487	\N	2025-04-20 06:04:14.5957
119	zone	41	update	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	1	admin	2025-04-20 13:08:24.911348	\N	2025-04-20 06:08:24.912126
120	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:08:37.516982	\N	2025-04-20 06:08:37.518653
121	zone	41	update	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	{"id": 41, "name": "Bekasi", "tenant_id": 1, "created_at": "2025-04-20T05:54:21.166059Z", "created_by": "admin"}	1	admin	2025-04-20 13:08:42.255772	\N	2025-04-20 06:08:42.25618
122	office	33	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	1	admin	2025-04-20 13:09:27.46283	\N	2025-04-20 06:09:27.463851
123	office	33	update	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	1	admin	2025-04-20 13:10:16.758733	\N	2025-04-20 06:10:16.758746
124	office	33	update	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	1	admin	2025-04-20 13:10:24.640179	\N	2025-04-20 06:10:24.640291
125	office	33	delete	{"id": 33, "name": "PT Vomo Industry Indonesia", "tenant_id": 1, "created_at": "2025-04-20T06:09:27.453829Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 13:10:29.039682	\N	2025-04-20 06:10:29.040276
126	office	34	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-20 13:26:03.570105	\N	2025-04-20 06:26:03.57183
127	office	34	update	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-20 13:40:38.233596	\N	2025-04-20 06:40:38.234576
128	office	34	update	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-20 13:46:49.652967	\N	2025-04-20 06:46:49.653617
129	office	34	update	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-20 13:47:55.290729	\N	2025-04-20 06:47:55.292194
130	office	34	update	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-20 13:49:57.207735	\N	2025-04-20 06:49:57.209329
131	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:54:16.52731	\N	2025-04-20 06:54:16.527959
132	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:54:24.491246	\N	2025-04-20 06:54:24.492595
133	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:54:36.606375	\N	2025-04-20 06:54:36.608136
134	zone	40	update	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	{"id": 40, "name": "Bandung", "tenant_id": 1, "created_at": "2025-04-20T05:50:19.676995Z", "created_by": "admin"}	1	admin	2025-04-20 13:54:40.317838	\N	2025-04-20 06:54:40.318169
135	product	6	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 6, "name": "Test Upload", "tenant_id": 1, "created_at": "2025-04-20T07:01:01.337627Z", "created_by": "admin"}	1	admin	2025-04-20 14:01:01.361503	\N	2025-04-20 07:01:01.363122
136	product	6	delete	{"id": 6, "name": "Test Upload", "tenant_id": 1, "created_at": "2025-04-20T07:01:01.337627Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 14:02:19.669511	\N	2025-04-20 07:02:19.670056
137	product	7	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 7, "name": "Bisniqu Data", "tenant_id": 1, "created_at": "2025-04-20T07:03:17.712403Z", "created_by": "admin"}	1	admin	2025-04-20 14:03:17.718186	\N	2025-04-20 07:03:17.720507
166	payment	6	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-12T22:11:54.222543+07:00", "created_by": "admin"}	1	admin	2025-05-12 22:11:54.244733	\N	2025-05-12 15:11:54.248614
138	product	7	delete	{"id": 7, "name": "Bisniqu Data", "tenant_id": 1, "created_at": "2025-04-20T07:03:17.712403Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-20 14:08:12.009378	\N	2025-04-20 07:08:12.01014
139	product	8	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 8, "name": "SRP test", "tenant_id": 1, "created_at": "2025-04-20T07:09:26.034007Z", "created_by": "admin"}	1	admin	2025-04-20 14:09:26.039993	\N	2025-04-20 07:09:26.040878
140	product	9	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 9, "name": "asdasd", "tenant_id": 1, "created_at": "2025-04-20T15:03:11.359573Z", "created_by": "admin"}	1	admin	2025-04-20 22:03:11.39463	\N	2025-04-20 15:03:11.397514
141	product	10	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 10, "name": "test docker", "tenant_id": 1, "created_at": "2025-04-20T15:31:24.924095Z", "created_by": "admin"}	1	admin	2025-04-20 22:31:24.940663	\N	2025-04-20 15:31:24.941278
142	product_category	9	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 9, "name": "TestCategory", "tenant_id": 1, "created_at": "2025-04-26T09:15:09.72833Z", "created_by": "admin"}	1	admin	2025-04-26 16:15:09.995458	\N	2025-04-26 09:15:10.001708
143	product_category	9	update	{"id": 9, "name": "TestCategory", "tenant_id": 1, "created_at": "2025-04-26T09:15:09.72833Z", "created_by": "admin"}	{"id": 9, "name": "TestCategory", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-26 16:15:16.390089	\N	2025-04-26 09:15:16.391226
144	product_category	9	delete	{"id": 9, "name": "TestCategory", "tenant_id": 1, "created_at": "0001-01-01T00:00:00Z"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-26 16:15:20.951582	\N	2025-04-26 09:15:20.952987
145	office	34	update	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	{"id": 34, "name": "PT Vomo Industry Indonesi", "tenant_id": 1, "created_at": "2025-04-20T06:26:03.564747Z", "created_by": "admin"}	1	admin	2025-04-26 16:15:58.723449	\N	2025-04-26 09:15:58.724467
146	employee	37	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 37, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:27:22.461456Z", "created_by": "admin"}	1	admin	2025-04-26 17:27:22.526489	\N	2025-04-26 10:27:22.528466
147	employee	37	update	{"id": 37, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:27:22.461456Z", "created_by": "admin"}	{"id": 37, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:27:22.461456Z", "created_by": "admin"}	1	admin	2025-04-26 17:32:15.09519	\N	2025-04-26 10:32:15.096463
148	employee	37	delete	{"id": 37, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:27:22.461456Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-26 17:32:32.240119	\N	2025-04-26 10:32:32.241554
149	employee	38	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 38, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:32:48.942904Z", "created_by": "admin"}	1	admin	2025-04-26 17:32:48.95263	\N	2025-04-26 10:32:48.95355
150	employee	38	update	{"id": 38, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-26T10:32:48.942904Z", "created_by": "admin"}	{"id": 38, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-26T10:32:48.942904Z", "created_by": "admin"}	1	admin	2025-04-26 17:33:11.776294	\N	2025-04-26 10:33:11.778893
151	employee	38	delete	{"id": 38, "name": "nurul hadi test", "tenant_id": 1, "created_at": "2025-04-26T10:32:48.942904Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-26 17:33:23.62622	\N	2025-04-26 10:33:23.629324
152	division	10	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 10, "name": "test div", "tenant_id": 1, "created_at": "2025-04-27T06:17:35.513867Z", "created_by": "admin"}	1	admin	2025-04-27 13:17:35.530543	\N	2025-04-27 06:17:35.532898
153	division	10	update	{"id": 10, "name": "test div", "tenant_id": 1, "created_at": "2025-04-27T06:17:35.513867Z", "created_by": "admin"}	{"id": 10, "name": "test div adas", "tenant_id": 1, "created_at": "2025-04-27T06:17:35.513867Z", "created_by": "admin"}	1	admin	2025-04-27 13:17:41.62798	\N	2025-04-27 06:17:41.628934
154	division	10	delete	{"id": 10, "name": "test div adas", "tenant_id": 1, "created_at": "2025-04-27T06:17:35.513867Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-27 13:17:44.755003	\N	2025-04-27 06:17:44.75617
155	division	11	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 11, "name": "lagi", "tenant_id": 1, "created_at": "2025-04-27T06:17:51.062571Z", "created_by": "admin"}	1	admin	2025-04-27 13:17:51.066827	\N	2025-04-27 06:17:51.069019
156	division	11	delete	{"id": 11, "name": "lagi", "tenant_id": 1, "created_at": "2025-04-27T06:17:51.062571Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-27 13:17:55.632807	\N	2025-04-27 06:17:55.636612
157	order	4	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 4, "tenant_id": 1, "created_at": "2025-04-27T22:52:04.487932+07:00", "created_by": "admin"}	1	admin	2025-04-27 22:52:04.573161	\N	2025-04-27 15:52:04.573837
158	order	5	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-04-27 23:07:51.752855	\N	2025-04-27 16:07:51.754996
159	employee	39	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 39, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-28T16:21:09.198455Z", "created_by": "admin"}	1	admin	2025-04-28 23:21:09.275945	\N	2025-04-28 16:21:09.278232
160	employee	39	delete	{"id": 39, "name": "nurul hadi", "tenant_id": 1, "created_at": "2025-04-28T16:21:09.198455Z", "created_by": "admin"}	{"created_at": "0001-01-01T00:00:00Z"}	1	admin	2025-04-28 23:21:22.630984	\N	2025-04-28 16:21:22.632077
161	order	6	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-07 05:59:04.803992	\N	2025-05-06 22:59:04.806147
162	order	9	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-07 06:09:03.6758	\N	2025-05-06 23:09:03.676761
163	payment	3	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 3, "tenant_id": 1, "created_at": "2025-05-11T09:41:26.564624+07:00", "created_by": "admin"}	1	admin	2025-05-11 09:41:26.662079	\N	2025-05-11 02:41:26.665655
164	payment	4	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 4, "tenant_id": 1, "created_at": "2025-05-11T09:47:26.152466+07:00", "created_by": "admin"}	1	admin	2025-05-11 09:47:26.172027	\N	2025-05-11 02:47:26.175362
165	payment	5	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 5, "tenant_id": 1, "created_at": "2025-05-11T09:48:07.796469+07:00", "created_by": "admin"}	1	admin	2025-05-11 09:48:07.808598	\N	2025-05-11 02:48:07.809682
167	payment	1	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 1, "tenant_id": 1, "created_at": "2025-05-12T22:51:38.510638+07:00", "created_by": "admin"}	1	admin	2025-05-12 22:51:38.533728	\N	2025-05-12 15:51:38.535212
168	payment	1	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 1, "tenant_id": 1, "created_at": "2025-05-12T23:02:35.111281+07:00", "created_by": "admin"}	1	admin	2025-05-12 23:02:35.133117	\N	2025-05-12 16:02:35.134235
169	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 09:58:21.128274	\N	2025-05-14 02:58:21.133967
170	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 09:59:54.498692	\N	2025-05-14 02:59:54.502643
171	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:02:52.962875	\N	2025-05-14 03:02:52.967732
172	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:09:04.626551	\N	2025-05-14 03:09:04.627447
173	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:19:12.281477	\N	2025-05-14 03:19:12.284326
174	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:21:01.000932	\N	2025-05-14 03:21:01.000693
175	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:22:13.908459	\N	2025-05-14 03:22:13.910322
176	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-14 10:23:44.673092	\N	2025-05-14 03:23:44.675122
177	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-15 15:41:34.886176	\N	2025-05-15 08:41:34.888687
178	order	9	update	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	{"id": 9, "tenant_id": 1, "created_at": "2025-05-07T06:09:03.65801+07:00", "created_by": "admin"}	1	admin	2025-05-15 15:44:33.814751	\N	2025-05-15 08:44:33.817881
179	order	3	update	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	{"id": 3, "tenant_id": 1, "created_at": "2025-04-01T17:27:52.945804+07:00", "created_by": "system"}	1	admin	2025-05-15 15:48:41.757226	\N	2025-05-15 08:48:41.758845
180	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:42:49.51922	\N	2025-05-15 09:42:49.520435
181	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:43:26.740294	\N	2025-05-15 09:43:26.741195
182	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:44:04.795701	\N	2025-05-15 09:44:04.797407
183	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:44:57.954869	\N	2025-05-15 09:44:57.956494
184	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:45:47.221693	\N	2025-05-15 09:45:47.221975
185	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:46:17.802094	\N	2025-05-15 09:46:17.802521
186	order	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	{"id": 6, "tenant_id": 1, "created_at": "2025-05-07T05:59:04.747221+07:00", "created_by": "admin"}	1	admin	2025-05-15 16:46:40.394059	\N	2025-05-15 09:46:40.39404
187	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:09:14.602339	\N	2025-05-15 10:09:14.602914
188	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:10:32.564268	\N	2025-05-15 10:10:32.566969
189	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:14:13.089228	\N	2025-05-15 10:14:13.089851
190	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:15:18.231756	\N	2025-05-15 10:15:18.232601
191	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:16:10.859579	\N	2025-05-15 10:16:10.860016
192	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:16:58.134739	\N	2025-05-15 10:16:58.135656
193	order	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-27T23:07:51.713615+07:00", "created_by": "admin"}	1	admin	2025-05-15 17:18:04.559459	\N	2025-05-15 10:18:04.561264
194	order	10	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 10, "tenant_id": 1, "created_at": "2025-05-17T17:25:00.170885+07:00", "created_by": "admin"}	1	admin	2025-05-17 17:25:00.245571	\N	2025-05-17 10:25:00.249951
195	order	10	update	{"id": 10, "tenant_id": 1, "created_at": "2025-05-17T17:25:00.170885+07:00", "created_by": "admin"}	{"id": 10, "tenant_id": 1, "created_at": "2025-05-17T17:25:00.170885+07:00", "created_by": "admin"}	1	admin	2025-05-17 17:25:11.103271	\N	2025-05-17 10:25:11.103152
196	payment	2	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 2, "tenant_id": 1, "created_at": "2025-05-17T17:25:27.215586+07:00", "created_by": "admin"}	1	admin	2025-05-17 17:25:27.248327	\N	2025-05-17 10:25:27.25009
197	task	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 21:57:24.309852	\N	2025-05-17 14:57:24.311485
198	task	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 21:57:53.926147	\N	2025-05-17 14:57:53.926977
199	task	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 21:58:13.327958	\N	2025-05-17 14:58:13.328152
200	task	2	update	{"id": 2, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 2, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:01:50.81245	\N	2025-05-17 15:01:50.813122
201	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:02:47.829504	\N	2025-05-17 15:02:47.8304
202	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:26:56.369775	\N	2025-05-17 15:26:56.371065
203	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:27:12.873919	\N	2025-05-17 15:27:12.874785
204	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:46:28.988456	\N	2025-05-17 15:46:28.990338
205	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:47:26.629555	\N	2025-05-17 15:47:26.630432
206	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:49:43.765634	\N	2025-05-17 15:49:43.766081
207	task	13	update	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 13, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:49:43.800889	\N	2025-05-17 15:49:43.801258
208	task	4	update	{"id": 4, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 4, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 22:51:08.016498	\N	2025-05-17 15:51:08.018275
209	task	5	update	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 5, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 23:21:19.372688	\N	2025-05-17 16:21:19.373868
210	task	6	update	{"id": 6, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	{"id": 6, "tenant_id": 1, "created_at": "2025-04-01T17:30:22.109029+07:00", "created_by": "system"}	1	admin	2025-05-17 23:50:12.950877	\N	2025-05-17 16:50:12.951145
211	task	15	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.164951	\N	2025-05-18 03:09:29.16649
212	task	16	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 16, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.187072+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.192863	\N	2025-05-18 03:09:29.19363
213	task	17	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 17, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.198953+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.202936	\N	2025-05-18 03:09:29.203446
214	task	18	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 18, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.209355+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.213443	\N	2025-05-18 03:09:29.214048
215	task	19	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 19, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.218387+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.222779	\N	2025-05-18 03:09:29.223865
216	task	20	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 20, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.228371+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.23251	\N	2025-05-18 03:09:29.233583
217	task	21	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 21, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.239282+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.247098	\N	2025-05-18 03:09:29.249018
218	task	22	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.259857	\N	2025-05-18 03:09:29.260615
219	task	23	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 23, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.26642+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.270698	\N	2025-05-18 03:09:29.271549
220	task	24	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 24, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.278018+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.282359	\N	2025-05-18 03:09:29.282913
221	task	25	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 25, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.287903+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.292523	\N	2025-05-18 03:09:29.29308
222	task	26	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 26, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.297025+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.301588	\N	2025-05-18 03:09:29.302277
223	task	27	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 27, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.307978+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.312506	\N	2025-05-18 03:09:29.313035
224	task	28	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 28, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.317435+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.321636	\N	2025-05-18 03:09:29.322289
225	order	11	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 11, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.101749+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:09:29.326708	\N	2025-05-18 03:09:29.327454
226	task	28	update	{"id": 28, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.317435+07:00", "created_by": "admin"}	{"id": 28, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.317435+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:14.624159	\N	2025-05-18 03:10:14.625393
227	task	28	update	{"id": 28, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.317435+07:00", "created_by": "admin"}	{"id": 28, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.317435+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:24.118814	\N	2025-05-18 03:10:24.118335
228	task	15	update	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:48.747474	\N	2025-05-18 03:10:48.747082
229	task	22	update	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:50.783472	\N	2025-05-18 03:10:50.78345
230	task	15	update	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:52.510346	\N	2025-05-18 03:10:52.510279
231	task	22	update	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:10:54.468183	\N	2025-05-18 03:10:54.468777
232	task	22	update	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	{"id": 22, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.255318+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:11:13.39538	\N	2025-05-18 03:11:13.39683
233	task	15	update	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	1	admin	2025-05-18 10:11:18.385765	\N	2025-05-18 03:11:18.385376
234	order	11	update	{"id": 11, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.101749+07:00", "created_by": "admin"}	{"id": 11, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.101749+07:00", "created_by": "admin"}	1	admin	2025-05-18 22:34:56.016092	\N	2025-05-18 15:34:56.019404
235	order	11	update	{"id": 11, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.101749+07:00", "created_by": "admin"}	{"id": 11, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.101749+07:00", "created_by": "admin"}	1	admin	2025-05-18 22:35:14.476888	\N	2025-05-18 15:35:14.477894
236	task	15	update	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-18T10:09:29.151675+07:00", "created_by": "admin"}	1	admin	2025-05-18 22:35:44.08797	\N	2025-05-18 15:35:44.088929
237	zone	42	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 42, "name": "Zona test ", "tenant_id": 1, "created_at": "2025-05-18T15:42:19.099973Z", "created_by": "admin"}	1	admin	2025-05-18 22:42:19.118934	\N	2025-05-18 15:42:19.120044
238	product	11	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 11, "name": "Kaos Jersey Testing", "tenant_id": 1, "created_at": "2025-05-18T16:02:24.588617Z", "created_by": "admin"}	1	admin	2025-05-18 23:02:24.619758	\N	2025-05-18 16:02:24.621615
239	task	29	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 29, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.531985+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.549737	\N	2025-05-18 16:09:31.550421
240	task	30	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 30, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.565126+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.577972	\N	2025-05-18 16:09:31.579248
241	task	31	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 31, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.592971+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.60341	\N	2025-05-18 16:09:31.603828
242	task	32	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 32, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.614403+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.628369	\N	2025-05-18 16:09:31.628695
243	task	33	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 33, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.639441+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.65017	\N	2025-05-18 16:09:31.651049
244	task	34	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 34, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.665439+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.676568	\N	2025-05-18 16:09:31.677282
245	task	35	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 35, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.691328+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.701881	\N	2025-05-18 16:09:31.70253
246	task	36	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.726616	\N	2025-05-18 16:09:31.72816
247	task	37	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 37, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.740235+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.748739	\N	2025-05-18 16:09:31.750637
248	task	38	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 38, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.767141+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.784201	\N	2025-05-18 16:09:31.785322
249	task	39	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 39, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.7991+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.809574	\N	2025-05-18 16:09:31.810223
250	task	40	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 40, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.820149+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.833898	\N	2025-05-18 16:09:31.83541
251	task	41	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 41, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.845642+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.855923	\N	2025-05-18 16:09:31.857865
252	task	42	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 42, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.867983+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.876229	\N	2025-05-18 16:09:31.876377
253	order	12	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 12, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.485636+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:09:31.884383	\N	2025-05-18 16:09:31.88512
254	order	12	update	{"id": 12, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.485636+07:00", "created_by": "admin"}	{"id": 12, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.485636+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:10:44.737411	\N	2025-05-18 16:10:44.738602
255	payment	3	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 3, "tenant_id": 1, "created_at": "2025-05-18T23:12:36.296781+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:12:36.356663	\N	2025-05-18 16:12:36.357211
256	order	12	update	{"id": 12, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.485636+07:00", "created_by": "admin"}	{"id": 12, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.485636+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:13:48.3263	\N	2025-05-18 16:13:48.328097
257	task	29	update	{"id": 29, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.531985+07:00", "created_by": "admin"}	{"id": 29, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.531985+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:14:22.838218	\N	2025-05-18 16:14:22.840653
258	task	36	update	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:14:44.656597	\N	2025-05-18 16:14:44.659226
259	task	36	update	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:14:55.373199	\N	2025-05-18 16:14:55.375513
260	task	29	update	{"id": 29, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.531985+07:00", "created_by": "admin"}	{"id": 29, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.531985+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:16:15.028567	\N	2025-05-18 16:16:15.029934
261	task	36	update	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	{"id": 36, "tenant_id": 1, "created_at": "2025-05-18T23:09:31.712661+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:17:10.162913	\N	2025-05-18 16:17:10.16407
262	product	12	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 12, "name": "Product Custom", "tenant_id": 1, "created_at": "2025-05-18T16:22:36.992758Z", "created_by": "admin"}	1	admin	2025-05-18 23:22:37.013453	\N	2025-05-18 16:22:37.014378
263	task	43	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 43, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.036408+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.046732	\N	2025-05-18 16:23:19.047748
264	task	44	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 44, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.058333+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.069911	\N	2025-05-18 16:23:19.07101
265	task	45	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 45, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.080898+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.089698	\N	2025-05-18 16:23:19.091763
266	task	46	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 46, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.104707+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.113864	\N	2025-05-18 16:23:19.114739
267	task	47	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 47, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.123401+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.133699	\N	2025-05-18 16:23:19.134547
268	task	48	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 48, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.143306+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.151486	\N	2025-05-18 16:23:19.152216
269	task	49	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 49, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.162718+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.173088	\N	2025-05-18 16:23:19.173969
270	order	13	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 13, "tenant_id": 1, "created_at": "2025-05-18T23:23:19.006227+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:23:19.182212	\N	2025-05-18 16:23:19.182967
271	payment	4	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 4, "tenant_id": 1, "created_at": "2025-05-18T23:35:38.609079+07:00", "created_by": "admin"}	1	admin	2025-05-18 23:35:38.636152	\N	2025-05-18 16:35:38.636937
272	task	50	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 50, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.35743+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.376356	\N	2025-05-23 02:24:43.379656
273	task	51	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 51, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.412512+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.420287	\N	2025-05-23 02:24:43.421621
274	task	52	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 52, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.429333+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.436389	\N	2025-05-23 02:24:43.437598
275	task	53	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 53, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.443909+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.451495	\N	2025-05-23 02:24:43.45251
276	task	54	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 54, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.461617+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.46956	\N	2025-05-23 02:24:43.470041
277	task	55	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 55, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.47736+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.484119	\N	2025-05-23 02:24:43.484882
278	task	56	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 56, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.493374+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.500098	\N	2025-05-23 02:24:43.500816
279	order	14	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 14, "tenant_id": 1, "created_at": "2025-05-23T09:24:43.254333+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:24:43.508155	\N	2025-05-23 02:24:43.508473
280	task	57	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 57, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.809645+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.817409	\N	2025-05-23 02:28:52.818707
281	task	58	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 58, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.826737+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.83287	\N	2025-05-23 02:28:52.834498
282	task	59	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 59, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.842872+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.850248	\N	2025-05-23 02:28:52.852511
283	task	60	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 60, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.85952+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.866608	\N	2025-05-23 02:28:52.868213
284	task	61	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 61, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.877773+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.884676	\N	2025-05-23 02:28:52.886129
285	task	62	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 62, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.895298+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.901306	\N	2025-05-23 02:28:52.903072
286	task	63	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 63, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.911376+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.916201	\N	2025-05-23 02:28:52.91789
287	order	15	create	{"created_at": "0001-01-01T00:00:00Z"}	{"id": 15, "tenant_id": 1, "created_at": "2025-05-23T09:28:52.794186+07:00", "created_by": "admin"}	1	admin	2025-05-23 09:28:52.923821	\N	2025-05-23 02:28:52.92538
\.


--
-- TOC entry 4041 (class 0 OID 24596)
-- Dependencies: 217
-- Data for Name: backup; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.backup (id, file_name, size, created_at, created_by, tenant_id, updated_at, updated_by) FROM stdin;
3	db_backup_2025-03-27_00-14-48_a7363268.dump	50688	2025-03-27 00:14:49.453044	developer	1	\N	\N
4	db_backup_2025-03-27_01-42-03_9a8b67ae.dump	55488	2025-03-27 01:42:04.371803	developer	1	\N	\N
36	db_backup_2025-03-30_14-57-45_2521a6e4.dump	64238	2025-03-30 07:57:46.54205	developer	1	\N	developer
38	db_backup_2025-04-01_16-49-30_0c9ed976.dump	65964	2025-04-01 09:49:30.400806	developer	1	\N	developer
39	db_backup_2025-04-06_20-05-29_10e99f9f.dump	118062	2025-04-06 13:05:30.496587	developer	1	\N	developer
40	db_backup_2025-04-12_20-42-27_1d8a47b8.dump	178583	2025-04-12 13:42:28.609772	developer	1	\N	developer
41	db_backup_2025-04-12_21-32-48_145d0d9e.dump	187845	2025-04-12 14:32:48.895791	developer	1	\N	developer
\.


--
-- TOC entry 4043 (class 0 OID 24603)
-- Dependencies: 219
-- Data for Name: cash_flow; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.cash_flow (id, transaction_date, transaction_type, category_id, amount, description, reference_number, reference_type, reference_id, office_id, status, tenant_id, created_at, created_by, updated_at, updated_by, payment_id) FROM stdin;
3	2024-04-03	expense	4	-500.00	Electricity bill payment	REF-UTIL-001	\N	\N	17	completed	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system	\N
10	2025-05-12	income	1	1612.18	Payment RN-01 for Order #ORD-2024-001	RN-01	payment	1	17	completed	1	2025-05-12 16:02:35.122747+00	admin	2025-05-12 16:02:35.122747+00	admin	1
11	2025-05-17	income	1	49.99	Payment tsss for Order #ORD-1747477500147-684	tsss	payment	2	34	completed	1	2025-05-17 10:25:27.226297+00	admin	2025-05-17 10:25:27.226297+00	admin	2
12	2025-05-18	income	1	450000.00	Payment TEST-2025-Mei-18 for Order #ORD-1747584571450-708	TEST-2025-Mei-18	payment	3	34	completed	1	2025-05-18 16:12:36.316489+00	admin	2025-05-18 16:12:36.316489+00	admin	3
13	2025-05-18	income	1	6.00	Payment Dp Persib Champion for Order #ORD-1747585398978-266	Dp Persib Champion	payment	4	17	completed	1	2025-05-18 16:35:38.622663+00	admin	2025-05-18 16:35:38.622663+00	admin	4
\.


--
-- TOC entry 4045 (class 0 OID 24614)
-- Dependencies: 221
-- Data for Name: item_stock_movement; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.item_stock_movement (id, item_id, movement_type, reference_type, reference_id, quantity, balance, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	in	purchase_order	1	500	1500	PO receipt - Premium Fabrics Co.	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
2	2	in	purchase_order	1	400	1200	PO receipt - Premium Fabrics Co.	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
3	1	out	production	1	-50	1450	Production order #PRD-2024-001	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
4	2	out	production	1	-40	1160	Production order #PRD-2024-001	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
5	1	adjustment	stock_opname	1	-20	1430	Stock opname adjustment SO-2024-001	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
6	3	adjustment	stock_opname	1	-5	595	Stock opname adjustment SO-2024-001	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
\.


--
-- TOC entry 4047 (class 0 OID 24623)
-- Dependencies: 223
-- Data for Name: master_channel; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_channel (id, code, name, type, description, is_active, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	TOKOPEDIA	Tokopedia Store	online_marketplace	Jersey Industry Official Store di Tokopedia	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
2	SHOPEE	Shopee Store	online_marketplace	Jersey Industry Official Store di Shopee	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
3	WEBSITE	Jersey Industry Website	website	www.jerseyindustry.com	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
4	NCMO-STORE	North City Main Store	physical_store	Toko di North City Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
5	NCBO-STORE	North City Branch Store	physical_store	Toko di North City Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
6	NRMO-STORE	North Rural Main Store	physical_store	Toko di North Rural Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
7	NRBO-STORE	North Rural Branch Store	physical_store	Toko di North Rural Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
8	SCMO-STORE	South City Main Store	physical_store	Toko di South City Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
9	SCBO-STORE	South City Branch Store	physical_store	Toko di South City Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
10	SRMO-STORE	South Rural Main Store	physical_store	Toko di South Rural Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
11	SRBO-STORE	South Rural Branch Store	physical_store	Toko di South Rural Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
12	ECMO-STORE	East City Main Store	physical_store	Toko di East City Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
13	ECBO-STORE	East City Branch Store	physical_store	Toko di East City Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
14	ERMO-STORE	East Rural Main Store	physical_store	Toko di East Rural Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
15	ERBO-STORE	East Rural Branch Store	physical_store	Toko di East Rural Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
16	WCMO-STORE	West City Main Store	physical_store	Toko di West City Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
17	WCBO-STORE	West City Branch Store	physical_store	Toko di West City Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
18	WRMO-STORE	West Rural Main Store	physical_store	Toko di West Rural Main Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
19	WRBO-STORE	West Rural Branch Store	physical_store	Toko di West Rural Branch Office	t	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
\.


--
-- TOC entry 4119 (class 0 OID 32769)
-- Dependencies: 295
-- Data for Name: master_customer; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_customer (id, customer_number, name, email, phone, address, city, postal_code, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	CUST-1743503273	Manchester United FC	order@manutd.com	+6281284093225	123 Sir Matt Busby Way, Manchester M16 0RA, UK	\N	\N	active	\N	1	2025-04-01 10:27:52.945804+00	system	2025-04-10 10:58:46.976996+00	admin
2	CUST-1745770072	nurul hadi	nurul.hadi@outlook.com	081284093225	Haneen Residence 3, Jl. H. Thabronih No.112, Kalimulya, Kec. Cilodong, Kota Depok, RT 01 RW 04, Jawa Barat 16413	\N	\N	active	\N	1	2025-04-27 16:07:51.713615+00	admin	2025-04-27 16:07:51.713615+00	admin
\.


--
-- TOC entry 4050 (class 0 OID 24634)
-- Dependencies: 226
-- Data for Name: master_division; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_division (id, name, description, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
9	FINISHING	Final finishing and quality check	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
8	SEWING	Sewing process	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
7	CUTTING	Cutting materials	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
6	PRESSING	Pressing materials	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
5	PREPARING	Preparing raw materials	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
4	PRINTING	Printing process division	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
3	LAYOUT	Layout and design department	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
2	SALES	Sales department	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
1	ADMIN	Administration department	2025-03-27 17:31:55.802818	2025-03-27 17:31:55.802818	1	system	system
\.


--
-- TOC entry 4052 (class 0 OID 24643)
-- Dependencies: 228
-- Data for Name: master_employee; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_employee (id, name, email, phone, division_id, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
4	David Williams	david.williams@email.com	123-456-7893	2	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
5	Emma Thompson	emma.thompson@email.com	123-456-7894	2	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
6	Frank Harris	frank.harris@email.com	123-456-7895	2	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
7	Grace Miller	grace.miller@email.com	123-456-7896	3	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
8	Henry Martinez	henry.martinez@email.com	123-456-7897	3	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
9	Isabella Garcia	isabella.garcia@email.com	123-456-7898	3	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
10	Jack Anderson	jack.anderson@email.com	123-456-7899	4	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
13	Mia Lopez	mia.lopez@email.com	123-456-7902	5	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
14	Noah Scott	noah.scott@email.com	123-456-7903	5	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
15	Olivia Adams	olivia.adams@email.com	123-456-7904	5	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
16	Paul Walker	paul.walker@email.com	123-456-7905	6	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
17	Quinn Carter	quinn.carter@email.com	123-456-7906	6	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
18	Rachel Evans	rachel.evans@email.com	123-456-7907	6	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
19	Samuel Turner	samuel.turner@email.com	123-456-7908	7	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
20	Tina Hall	tina.hall@email.com	123-456-7909	7	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
21	Umar Allen	umar.allen@email.com	123-456-7910	7	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
22	Victoria Hill	victoria.hill@email.com	123-456-7911	8	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
23	William Nelson	william.nelson@email.com	123-456-7912	8	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
24	Xander Wright	xander.wright@email.com	123-456-7913	8	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
25	Yasmine Baker	yasmine.baker@email.com	123-456-7914	9	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
26	Zachary Green	zachary.green@email.com	123-456-7915	9	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
27	Aaron Young	aaron.young@email.com	123-456-7916	9	2025-03-27 17:37:37.757119	2025-03-27 17:37:37.757119	1	system	system
11	Katherine White	katherine.white@email.com	123-456-7900	1	2025-03-27 17:37:37.757119	2025-03-30 14:54:43.207009	1	system	system
12	Liam Rodriguez	liam.rodriguez@email.com	123-456-7901	1	2025-03-27 17:37:37.757119	2025-03-30 14:54:43.207009	1	system	system
1	Alice Johnson	alice.johnson@email.com	123-456-7890	1	2025-03-27 17:37:37.757119	2025-03-30 14:54:43.207009	1	system	system
2	Bob Smith	bob.smith@email.com	123-456-7891	1	2025-03-27 17:37:37.757119	2025-03-30 14:54:43.207009	1	system	system
3	Charlie Brown	charlie.brown@email.com	123-456-7892	1	2025-03-27 17:37:37.757119	2025-03-30 14:54:43.207009	1	system	system
\.


--
-- TOC entry 4053 (class 0 OID 24651)
-- Dependencies: 229
-- Data for Name: master_item; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_item (id, code, name, description, unit, min_stock, max_stock, reorder_point, category, is_active, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	FAB-001	Polyester Mesh Fabric	High-quality breathable mesh fabric for jerseys	yards	1000	5000	1500	fabric	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
2	FAB-002	Dri-Fit Material	Moisture-wicking performance fabric	yards	800	4000	1200	fabric	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
3	FAB-003	Cotton Blend Fabric	Comfortable cotton-polyester blend	yards	500	3000	800	fabric	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
4	THR-001	Polyester Thread White	Durable polyester thread for jersey stitching	spools	50	200	75	thread	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
5	THR-002	Polyester Thread Black	Durable polyester thread for jersey stitching	spools	50	200	75	thread	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
6	THR-003	Elastic Thread	Stretchable thread for jersey hems	spools	30	150	50	thread	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
7	ACC-001	Jersey Collar Material	Ribbed collar material	pieces	200	1000	300	accessory	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
8	ACC-002	Size Labels L	Size L labels	pieces	500	2000	700	label	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
9	ACC-003	Size Labels M	Size M labels	pieces	500	2000	700	label	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
10	ACC-004	Size Labels S	Size S labels	pieces	500	2000	700	label	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
11	PRT-001	Heat Transfer Vinyl White	White vinyl for number printing	rolls	10	50	15	printing	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
12	PRT-002	Heat Transfer Vinyl Black	Black vinyl for number printing	rolls	10	50	15	printing	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
13	PRT-003	Sublimation Ink Cyan	Cyan ink for sublimation printing	liters	5	20	8	printing	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
14	ABC-123	Testing product test asdasd	asdads	liters	1	5	\N	\N	t	1	2025-04-10 16:33:31.480275+00	admin	2025-04-10 16:53:33.181992+00	admin
15	ABC-003	teasdas asdads	assd	pieces	1	8	\N	\N	t	1	2025-04-10 17:12:02.566894+00	admin	2025-04-10 17:12:17.729754+00	admin
\.


--
-- TOC entry 4055 (class 0 OID 24661)
-- Dependencies: 231
-- Data for Name: master_menu; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_menu (id, name, url, icon, parent_id, sort, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
1	Access Management	\N	ni ni-settings	\N	1	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
2	Master Data	\N	ni ni-archive-2	\N	2	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
3	Transaction	\N	ni ni-cart	\N	3	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
4	Inventory	\N	ni ni-box-2	\N	4	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
5	Accounting	\N	ni ni-money-coins	\N	5	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
6	Permission	/permission	ni ni-key-25	1	1	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
7	Role	/role	ni ni-badge	1	2	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
8	User	/user	ni ni-single-02	1	3	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
9	Menu	/menu	ni ni-bullet-list-67	1	4	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
12	Office	/office	ni ni-building	2	3	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
13	Product	/product	ni ni-box-2	2	4	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
14	Product Category	/product-category	ni ni-tag	2	5	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
15	Employee	/employee	ni ni-circle-08	2	6	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
16	Division	/division	ni ni-collection	2	7	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
17	Order	/order	ni ni-cart	3	1	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
18	Order Detail	/order-detail	ni ni-bullet-list-67	3	2	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
19	Order Detail Item	/order-detail-item	ni ni-box-2	3	3	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
20	Payment	/payment	ni ni-money-coins	3	4	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
21	Payment Detail	/payment-detail	ni ni-bullet-list-67	3	5	2025-03-22 08:00:31.935588	2025-03-22 08:00:31.935588	1	system	system
22	Task	/task	ni ni-calendar-grid-58	3	6	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
23	Task History	/task-history	ni ni-time-alarm	3	7	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
27	Cash Flow	/cash-flow	ni ni-money-coins	5	1	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
28	Purchase List	/purchase-list	ni ni-cart	5	2	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
29	Payment List	/payment-list	ni ni-credit-card	5	3	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
31	Petty Cash	/petty-cash	ni ni-money-coins	5	5	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
32	Transaction Category	/transaction-category	ni ni-tag	5	6	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
33	Petty Cash Request	/petty-cash-request	ni ni-paper-diploma	5	7	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
34	Petty Cash Summary	/petty-cash-summary	ni ni-chart-bar-32	5	8	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
30	SPK Data	/spk-data	ni ni-single-copy-04	5	4	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
40	System		ni ni-settings	\N	6	2025-03-23 08:08:29.163802	2025-03-23 15:08:51.730413	1	admin	admin
41	Audit Trail	/audit	ni ni-archive-2	40	1	2025-03-23 08:11:39.560894	2025-03-23 16:43:21.539038	1	admin	admin
42	Backup Management	/backup	ni ni-money-coins	40	2	2025-03-26 16:36:35.692878	2025-03-26 16:36:35.692878	1	system	system
24	Master Item	/item	ni ni-box-2	4	1	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
25	Stock Opname	/stock-opname	ni ni-tag	4	2	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
46	Stock Movement	/stock-movement	ni ni-archive-2	4	3	2025-04-06 15:01:51.654123	2025-04-06 22:14:25.254253	1	admin	admin
26	Master Supplier	/supplier	ni ni-delivery-fast	4	4	2025-03-22 08:05:37.869698	2025-03-22 08:05:37.869698	1	system	system
47	Makloon	/makloon	ni ni-circle-08	2	8	2025-04-06 15:54:36.553501	2025-04-06 15:54:36.553501	1	admin	admin
48	Artificial Intelligence		ni ni-money-coins	\N	7	2025-04-07 08:11:44.671447	2025-04-07 08:11:44.671447	1	admin	admin
49	Model Builder	/model-builder	ni ni-settings	48	1	2025-04-07 08:12:18.661025	2025-04-07 08:12:18.661025	1	admin	admin
10	Zone	/zone	ni ni-map-big	2	1	2025-03-22 07:25:18.170058	2025-04-20 12:51:33.483876	1	system	admin
11	Region	/region	ni ni-world-2	2	2	2025-03-22 07:25:18.170058	2025-04-20 12:51:56.626974	1	system	admin
\.


--
-- TOC entry 4057 (class 0 OID 24670)
-- Dependencies: 233
-- Data for Name: master_office; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_office (id, name, code, address, phone, email, zone_id, created_at, updated_at, created_by, updated_by, tenant_id) FROM stdin;
17	North City Main Office	NCMA001	123 North City Main St	+12345678901	north.city@office.com	1	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
18	North City Branch Office	NCBA001	456 North City Branch Ave	+12345678902	north.branch@office.com	1	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
19	North Rural Main Office	NRMA001	789 North Rural Main Rd	+12345678903	north.rural@office.com	2	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
20	North Rural Branch Office	NRBA001	321 North Rural Branch St	+12345678904	north.rural.branch@office.com	2	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
21	South City Main Office	SCMA001	123 South City Main St	+12345678905	south.city@office.com	3	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
22	South City Branch Office	SCBA001	456 South City Branch Ave	+12345678906	south.branch@office.com	3	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
23	South Rural Main Office	SRMA001	789 South Rural Main Rd	+12345678907	south.rural@office.com	4	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
24	South Rural Branch Office	SRBA001	321 South Rural Branch St	+12345678908	south.rural.branch@office.com	4	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
25	East City Main Office	ECMA001	123 East City Main St	+12345678909	east.city@office.com	5	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
26	East City Branch Office	ECBA001	456 East City Branch Ave	+12345678910	east.branch@office.com	5	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
27	East Rural Main Office	ERMA001	789 East Rural Main Rd	+12345678911	east.rural@office.com	6	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
28	East Rural Branch Office	ERBA001	321 East Rural Branch St	+12345678912	east.rural.branch@office.com	6	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
29	West City Main Office	WCMA001	123 West City Main St	+12345678913	west.city@office.com	7	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
30	West City Branch Office	WCBA001	456 West City Branch Ave	+12345678914	west.branch@office.com	7	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
31	West Rural Main Office	WRMA001	789 West Rural Main Rd	+12345678915	west.rural@office.com	8	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
32	West Rural Branch Office	WRBA001	321 West Rural Branch St	+12345678916	west.rural.branch@office.com	8	2025-03-26 18:05:30.945079	2025-03-26 18:05:30.945079	admin	admin	1
34	PT Vomo Industry Indonesi	VOMI01	Haneen Residence 3, Jl. H. Thabronih No.112, Kalimulya, Kec. Cilodong, Kota Depok, RT 01 RW 04, Jawa Barat 16413	+6281284093225	nurul.hadi@outlook.com	40	2025-04-20 06:26:03.564747	2025-04-26 16:15:58.709883	admin	admin	1
\.


--
-- TOC entry 4060 (class 0 OID 24679)
-- Dependencies: 236
-- Data for Name: master_permission; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_permission (id, name, description, created_at, updated_at, tenant_id, created_by, updated_by, code, module) FROM stdin;
9	View Permissions	Can view permission list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PERMISSION_VIEW	ACCESS_MANAGEMENT
10	Manage Permissions	Can create/update permissions	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PERMISSION_MANAGE	ACCESS_MANAGEMENT
11	View Roles	Can view role list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ROLE_VIEW	ACCESS_MANAGEMENT
12	Manage Roles	Can create/update roles	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ROLE_MANAGE	ACCESS_MANAGEMENT
13	Delete Roles	Can delete roles	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ROLE_DELETE	ACCESS_MANAGEMENT
14	View Users	Can view user list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	USER_VIEW	ACCESS_MANAGEMENT
15	Manage Users	Can create/update users	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	USER_MANAGE	ACCESS_MANAGEMENT
16	Delete Users	Can delete users	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	USER_DELETE	ACCESS_MANAGEMENT
17	View Menus	Can view menu list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	MENU_VIEW	ACCESS_MANAGEMENT
18	Manage Menus	Can create/update menus	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	MENU_MANAGE	ACCESS_MANAGEMENT
19	View Zones	Can view zone list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ZONE_VIEW	MASTER_DATA
20	Manage Zones	Can create/update zones	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ZONE_MANAGE	MASTER_DATA
21	Delete Zones	Can delete zones	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ZONE_DELETE	MASTER_DATA
22	View Orders	Can view order list	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ORDER_VIEW	TRANSACTION
23	Create Orders	Can create new orders	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ORDER_CREATE	TRANSACTION
24	Update Orders	Can update orders	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ORDER_UPDATE	TRANSACTION
25	Delete Orders	Can delete orders	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ORDER_DELETE	TRANSACTION
26	Approve Orders	Can approve orders	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	ORDER_APPROVE	TRANSACTION
27	View Payments	Can view payments	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PAYMENT_VIEW	TRANSACTION
28	Process Payments	Can process payments	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PAYMENT_PROCESS	TRANSACTION
29	Cancel Payments	Can cancel payments	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PAYMENT_CANCEL	TRANSACTION
30	View Tasks	Can view tasks	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	TASK_VIEW	TRANSACTION
31	Manage Tasks	Can create/update tasks	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	TASK_MANAGE	TRANSACTION
32	Delete Tasks	Can delete tasks	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	TASK_DELETE	TRANSACTION
33	View Cash Flow	Can view cash flow	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	CASH_FLOW_VIEW	ACCOUNTING
34	Manage Cash Flow	Can manage cash flow	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	CASH_FLOW_MANAGE	ACCOUNTING
35	View Petty Cash	Can view petty cash	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PETTY_CASH_VIEW	ACCOUNTING
36	Create Petty Cash	Can create petty cash	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PETTY_CASH_CREATE	ACCOUNTING
37	Approve Petty Cash	Can approve petty cash	2025-03-23 17:29:56.267657	2025-03-23 17:29:56.267657	1	system	system	PETTY_CASH_APPROVE	ACCOUNTING
38	View Audit Trail	Can View Audit Trail	2025-03-23 17:51:14.619728	2025-03-23 17:51:14.619728	1	system	system	AUDIT_TRAIL_VIEW	SYSTEM
\.


--
-- TOC entry 4062 (class 0 OID 24688)
-- Dependencies: 238
-- Data for Name: master_product; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_product (id, name, code, category_id, description, material, size_available, color_options, customization_options, production_time, min_order_quantity, base_price, bulk_discount_rules, weight, is_active, stock_status, tenant_id, created_at, updated_at, created_by, updated_by) FROM stdin;
1	Pro Soccer Jersey	PSJ001	1	Professional grade soccer jersey	Premium Polyester	["S", "M", "L", "XL", "XXL"]	["Red/White", "Blue/White", "Green/White", "Custom"]	{"name": true, "number": true, "patches": true, "team_logo": true}	5	1	49.99	{"10": 5, "20": 10, "50": 15}	180.00	t	in_stock	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
2	Basketball Pro Kit	BPK001	2	Professional basketball jersey kit	Mesh Polyester	["S", "M", "L", "XL", "XXL"]	["White/Black", "Black/Gold", "Red/Black", "Custom"]	{"name": true, "number": true, "team_logo": true}	7	5	59.99	{"10": 5, "20": 10, "50": 15}	200.00	t	in_stock	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
4	Test new	T01	2	tesasaads	test	["XS", "S", "M", "L", "XL", "XXL", "3XL"]	["Red/White", "Blue/White", "Green/White", "Black/White", "Custom"]	{"name": true, "number": true, "patches": true, "team_logo": true}	5	5	8.00	{"10": 5, "20": 2, "50": 10}	3.00	t	in_stock	1	2025-03-30 06:51:56.068678	2025-03-30 06:51:56.068678	admin	admin
8	SRP test	SRP01	3	test	test	["XS", "S", "M", "L", "XL", "XXL", "3XL"]	["Red/White", "Blue/White", "Green/White", "Black/White", "Custom"]	{"name": true, "number": true, "patches": true, "team_logo": true}	10	5	1.00	{"10": 1, "20": 2, "50": 3}	5.00	t	in_stock	1	2025-04-20 07:09:26.034007	2025-04-20 07:09:26.034007	admin	admin
9	asdasd	asdad	4	asdasd	asdad	["S", "XS"]	["Green/White"]	{"name": true, "number": true, "patches": true, "team_logo": true}	2	1	2.00	{"10": 2, "20": 2, "50": 4}	5.00	t	in_stock	1	2025-04-20 15:03:11.359573	2025-04-20 15:03:11.359573	admin	admin
10	test docker	asdaldaldl	2	test docker	asdad	["XS", "S", "M", "L", "XL", "XXL", "3XL"]	["Red/White", "Blue/White", "Green/White", "Black/White", "Custom"]	{"name": true, "number": true, "patches": false, "team_logo": false}	5	1	3.00	{"10": 1, "20": 2, "50": 3}	4.00	t	in_stock	1	2025-04-20 15:31:24.924095	2025-04-20 15:31:24.924095	admin	admin
11	Kaos Jersey Testing	KJT-001	1	Kaos Testing	Material A	["XS", "S", "M", "L", "XL", "XXL", "3XL"]	["Red/White", "Blue/White", "Green/White", "Black/White", "Custom"]	{"name": true, "number": true, "patches": true, "team_logo": true}	3	1	15000.00	{"10": 3, "20": 5, "50": 7}	6.00	t	in_stock	1	2025-05-18 16:02:24.588617	2025-05-18 16:02:24.588617	admin	admin
12	Product Custom	PCustom01	2	custom	Material Super	["XS", "S", "M", "L", "XL", "XXL", "3XL"]	["Red/White", "Blue/White", "Green/White", "Black/White", "Custom"]	{"name": true, "number": true, "patches": true, "team_logo": true}	5	1	200000.00	{"10": 1, "20": 3, "50": 5}	8.00	t	in_stock	1	2025-05-18 16:22:36.992758	2025-05-18 16:22:36.992758	admin	admin
\.


--
-- TOC entry 4064 (class 0 OID 24702)
-- Dependencies: 240
-- Data for Name: master_product_category; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_product_category (id, name, code, description, is_active, tenant_id, created_at, updated_at, created_by, updated_by) FROM stdin;
1	Soccer Jersey	SOCCER	Soccer team jerseys and uniforms	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
2	Basketball Jersey	BBALL	Basketball team jerseys and uniforms	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
3	Baseball Jersey	BASEBALL	Baseball team jerseys and uniforms	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
4	Custom Team Jersey	CUSTOM	Custom designed team jerseys	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
5	Training Jersey	TRAINING	Training and practice jerseys	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
6	E-Sports Jersey	ESPORTS	E-Sports team jerseys and uniforms	t	1	2025-03-28 15:20:47.844727	2025-03-28 15:20:47.844727	system	system
\.


--
-- TOC entry 4066 (class 0 OID 24712)
-- Dependencies: 242
-- Data for Name: master_region; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_region (id, name, description, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
1	North Region	Northern region of the country	2025-03-26 18:03:22.834275	2025-03-26 18:03:22.834275	1	admin	admin
2	South Region	Southern region of the country	2025-03-26 18:03:22.834275	2025-03-26 18:03:22.834275	1	admin	admin
3	East Region	Eastern region of the country	2025-03-26 18:03:22.834275	2025-03-26 18:03:22.834275	1	admin	admin
4	West Region	Western region of the country	2025-03-26 18:03:22.834275	2025-03-26 18:03:22.834275	1	admin	admin
5	Central Region	Central region of the country	2025-03-26 18:03:22.834275	2025-03-26 18:03:22.834275	1	admin	admin
18	IDN - Jawa Barat	Indonesia - Jawa Barat	2025-04-20 05:49:51.657504	2025-04-20 05:49:51.657504	1	admin	admin
\.


--
-- TOC entry 4068 (class 0 OID 24721)
-- Dependencies: 244
-- Data for Name: master_role; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_role (id, name, description, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
1	Admin	System Administrator	2025-03-22 07:25:18.170058	2025-03-22 07:25:18.170058	1	system	system
2	Developer	Developer	2025-03-23 17:47:47.545982	2025-03-24 23:48:37.858856	1	system	admin
\.


--
-- TOC entry 4069 (class 0 OID 24729)
-- Dependencies: 245
-- Data for Name: master_supplier; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_supplier (id, code, name, contact_person, phone, email, address, tax_number, bank_name, bank_account_number, bank_account_name, is_active, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	SUP-001	Premium Fabrics Co.	John Smith	+1-555-0123	john@premiumfabrics.com	123 Textile Road, Fabric City	TAX123456	City Bank	1234567890	Premium Fabrics Co.	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
2	SUP-002	Sports Materials Inc.	Sarah Johnson	+1-555-0124	sarah@sportsmaterials.com	456 Sports Ave, Material Town	TAX789012	Metro Bank	0987654321	Sports Materials Inc.	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
3	SUP-003	Thread Masters	Mike Wilson	+1-555-0125	mike@threadmasters.com	789 Thread Street, Sewing City	TAX345678	National Bank	5678901234	Thread Masters LLC	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
4	SUP-004	Print Pro Supplies	Lisa Brown	+1-555-0126	lisa@printpro.com	321 Ink Road, Print Town	TAX901234	Global Bank	4321098765	Print Pro Supplies Inc.	t	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
\.


--
-- TOC entry 4071 (class 0 OID 24738)
-- Dependencies: 247
-- Data for Name: master_tenant; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_tenant (id, name, domain, status, created_at, updated_at, created_by, updated_by) FROM stdin;
1	Default Tenant	default.vomo.com	t	2025-03-22 07:46:30.347857	2025-03-22 07:46:30.347857	system	system
\.


--
-- TOC entry 4074 (class 0 OID 24748)
-- Dependencies: 250
-- Data for Name: master_user_menu; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_user_menu (id, user_id, menu_id, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- TOC entry 4076 (class 0 OID 24757)
-- Dependencies: 252
-- Data for Name: master_zone; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.master_zone (id, name, region_id, description, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
1	North Zone 1	1	First zone in North Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
2	North Zone 2	1	Second zone in North Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
3	South Zone 1	2	First zone in South Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
4	South Zone 2	2	Second zone in South Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
5	East Zone 1	3	First zone in East Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
6	East Zone 2	3	Second zone in East Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
7	West Zone 1	4	First zone in West Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
8	West Zone 2	4	Second zone in West Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
9	Central Zone 1	5	First zone in Central Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
10	Central Zone 2	5	Second zone in Central Region	2025-03-26 18:04:29.042981	2025-03-26 18:04:29.042981	1	admin	admin
39	Depok	18	Indonesia - Jawa Barat 	2025-04-20 05:42:39.668861	2025-04-20 12:50:01.090055	1	admin	admin
41	Bekasi	18	Indonesia - Jawa Barat 	2025-04-20 05:54:21.166059	2025-04-20 13:08:42.251494	1	admin	admin
40	Bandung	18	Indonesia - Jawa Barat 	2025-04-20 05:50:19.676995	2025-04-20 13:54:40.31279	1	admin	admin
42	Zona test 	18	test	2025-05-18 15:42:19.099973	2025-05-18 15:42:19.099973	1	admin	admin
\.


--
-- TOC entry 4077 (class 0 OID 24765)
-- Dependencies: 253
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.order_items (id, order_id, product_id, quantity, size, color, unit_price, original_subtotal, applied_discount_rule, discount_amount, final_subtotal, customization, current_task, production_status, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
10	11	1	5	S	Red	49.99	249.95	\N	0.00	249.95	{}	layout	pending	1	2025-05-18 03:09:29.101749+00	admin	2025-05-18 03:09:29.101749+00	admin
11	11	2	4	L	Black	59.99	239.96	\N	0.00	239.96	{}	layout	pending	1	2025-05-18 03:09:29.101749+00	admin	2025-05-18 03:09:29.101749+00	admin
12	12	11	15	M	Red	15000.00	225000.00	\N	0.00	225000.00	{}	layout	pending	1	2025-05-18 16:09:31.485636+00	admin	2025-05-18 16:09:31.485636+00	admin
13	12	11	15	L	Black	15000.00	225000.00	\N	0.00	225000.00	{}	layout	pending	1	2025-05-18 16:09:31.485636+00	admin	2025-05-18 16:09:31.485636+00	admin
14	13	12	30	XL	Red	200000.00	6000000.00	\N	0.00	6000000.00	{}	layout	pending	1	2025-05-18 16:23:19.006227+00	admin	2025-05-18 16:23:19.006227+00	admin
8	9	4	40	S	Red	8.00	320.00	\N	0.00	320.00	{}	layout	pending	1	2025-05-06 23:09:03.65801+00	admin	2025-05-06 23:09:03.65801+00	admin
3	3	1	20	L	Red/White	49.99	999.80	{"quantity_threshold": 20, "discount_percentage": 10}	99.98	899.82	{"name": "FERNANDES", "number": "8", "patches": ["premier_league", "captain"], "team_logo": "manutd_logo.png", "special_instructions": "Captain armband print"}	printing	in_progress	1	2025-04-01 10:27:52.945804+00	system	2025-04-01 10:27:52.945804+00	system
4	3	1	15	M	Red/White	49.99	749.85	{"quantity_threshold": 10, "discount_percentage": 5}	37.49	712.36	{"name": "RASHFORD", "number": "10", "patches": ["premier_league"], "team_logo": "manutd_logo.png"}	cutting	in_progress	1	2025-04-01 10:27:52.945804+00	system	2025-04-01 10:27:52.945804+00	system
15	14	12	1	M	White	200000.00	200000.00	\N	0.00	200000.00	{}	layout	pending	1	2025-05-23 02:24:43.254333+00	admin	2025-05-23 02:24:43.254333+00	admin
16	15	10	1	M	Blue	3.00	3.00	\N	0.00	3.00	{}	layout	pending	1	2025-05-23 02:28:52.794186+00	admin	2025-05-23 02:28:52.794186+00	admin
7	6	2	1	M	Red	59.99	59.99	\N	0.00	59.99	{}	layout	pending	1	2025-05-06 22:59:04.747221+00	admin	2025-05-06 22:59:04.747221+00	admin
5	5	1	5	S	Red	49.99	249.95	\N	0.00	249.95	{}	layout	pending	1	2025-04-27 16:07:51.713615+00	admin	2025-04-27 16:07:51.713615+00	admin
6	5	1	10	M	Red	49.99	499.90	\N	0.00	499.90	{}	layout	pending	1	2025-04-27 16:07:51.713615+00	admin	2025-04-27 16:07:51.713615+00	admin
9	10	1	1	M	Blue	49.99	49.99	\N	0.00	49.99	{}	layout	pending	1	2025-05-17 10:25:00.170885+00	admin	2025-05-17 10:25:00.170885+00	admin
\.


--
-- TOC entry 4079 (class 0 OID 24779)
-- Dependencies: 255
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.orders (id, order_number, office_id, subtotal, discount_amount, total_amount, status, payment_status, expected_delivery_date, notes, tenant_id, created_at, created_by, updated_at, updated_by, customer_id, label) FROM stdin;
3	ORD-2024-001	17	1749.65	137.47	1612.18	completed	partial	2025-04-08	Team order for new season	1	2025-04-01 10:27:52.945804+00	system	2025-05-15 08:48:41.715898+00	admin	1	Label 1
5	ORD-1745770071680-157	34	749.85	0.00	749.85	completed	unpaid	2025-04-27	test	1	2025-04-27 16:07:51.713615+00	admin	2025-05-15 10:18:04.543974+00	admin	2	Jersey Gaool cuy
6	ORD-1746572344723-985	34	59.99	0.00	59.99	completed	unpaid	2025-05-07	test	1	2025-05-06 22:59:04.747221+00	admin	2025-05-15 09:46:40.37989+00	admin	2	Label AJee
9	ORD-1746572943641-664	34	320.00	0.00	320.00	completed	paid	2025-05-08	test	1	2025-05-06 23:09:03.65801+00	admin	2025-05-15 08:44:33.790775+00	admin	2	Test Label
10	ORD-1747477500147-684	34	49.99	0.00	49.99	confirmed	unpaid	2025-05-17	test	1	2025-05-17 10:25:00.170885+00	admin	2025-05-17 10:25:11.078605+00	admin	2	Manchester City
11	ORD-1747537769073-069	34	489.91	0.00	489.91	in_production	unpaid	2025-05-24		1	2025-05-18 03:09:29.101749+00	admin	2025-05-18 15:35:14.449753+00	admin	2	Hadi And Gaengs
12	ORD-1747584571450-708	34	450000.00	0.00	450000.00	in_production	unpaid	2025-05-23		1	2025-05-18 16:09:31.485636+00	admin	2025-05-18 16:13:48.287443+00	admin	2	Cek Aje
13	ORD-1747585398978-266	17	6000000.00	0.00	6000000.00	pending	unpaid	2025-05-28		1	2025-05-18 16:23:19.006227+00	admin	2025-05-18 16:23:19.006227+00	admin	1	Ok
14	ORD-1747967083198-185	32	200000.00	5.00	199995.00	pending	unpaid	2025-05-30		1	2025-05-23 02:24:43.254333+00	admin	2025-05-23 02:24:43.254333+00	admin	2	
15	ORD-1747967332771-840	30	3.00	0.00	3.00	pending	unpaid	2025-05-24		1	2025-05-23 02:28:52.794186+00	admin	2025-05-23 02:28:52.794186+00	admin	2	asdasdasd
\.


--
-- TOC entry 4081 (class 0 OID 24794)
-- Dependencies: 257
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.payments (id, order_id, amount, payment_method, payment_date, reference_number, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	3	1612.18	cash	2025-05-12 16:02:35.072+00	RN-01	completed	test	1	2025-05-12 16:02:35.111281+00	admin	2025-05-12 16:02:35.111281+00	admin
2	10	49.99	bank_transfer	2025-05-17 10:25:27.11+00	tsss	completed	asda	1	2025-05-17 10:25:27.215586+00	admin	2025-05-17 10:25:27.215586+00	admin
3	12	450000.00	cash	2025-05-18 16:12:36.132+00	TEST-2025-Mei-18	completed	Oke lunas ya	1	2025-05-18 16:12:36.296781+00	admin	2025-05-18 16:12:36.296781+00	admin
4	13	6.00	bank_transfer	2025-05-18 16:35:38.462+00	Dp Persib Champion	completed	test	1	2025-05-18 16:35:38.609079+00	admin	2025-05-18 16:35:38.609079+00	admin
\.


--
-- TOC entry 4083 (class 0 OID 24804)
-- Dependencies: 259
-- Data for Name: petty_cash; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.petty_cash (id, office_id, period_start_date, period_end_date, initial_balance, current_balance, channel_id, division_id, budget_limit, budget_period, alert_threshold, status, balance_updated_at, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	17	2024-04-01	2024-04-30	10000000.00	10000000.00	4	1	10000000.00	monthly	2000000.00	active	2025-04-12 14:29:43.332384+00	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
2	17	2024-04-01	2024-04-30	5000000.00	5000000.00	1	2	5000000.00	monthly	1000000.00	active	2025-04-12 14:29:43.332384+00	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
3	17	2024-04-01	2024-04-30	15000000.00	15000000.00	\N	3	15000000.00	monthly	3000000.00	active	2025-04-12 14:29:43.332384+00	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
\.


--
-- TOC entry 4085 (class 0 OID 24816)
-- Dependencies: 261
-- Data for Name: petty_cash_requests; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.petty_cash_requests (id, petty_cash_id, request_number, office_id, employee_id, channel_id, division_id, amount, purpose, category_id, payment_method, reference_number, budget_code, receipt_urls, status, settlement_status, settlement_date, reimbursement_status, reimbursement_date, approved_by, approved_at, completed_at, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	PCR-2024-001	17	1	4	1	500000.00	Pembelian supplies toko North City Main	1	cash	INV-2024-001	STORE-SUPPLIES	\N	pending	pending	\N	not_required	\N	\N	\N	\N	\N	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
2	2	PCR-2024-002	17	2	1	2	1500000.00	Product photography untuk listing Tokopedia	2	bank_transfer	INV-2024-002	TOPED-MARKETING	\N	pending	pending	\N	not_required	\N	\N	\N	\N	\N	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
3	3	PCR-2024-003	17	3	\N	3	2000000.00	Emergency purchase benang jahit	3	cash	INV-2024-003	PROD-MATERIALS	\N	pending	pending	\N	not_required	\N	\N	\N	\N	\N	1	2025-04-12 14:29:43.332384+00	admin	2025-04-12 14:29:43.332384+00	admin
\.


--
-- TOC entry 4087 (class 0 OID 24831)
-- Dependencies: 263
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.product_images (id, product_id, image_url, sort_order, is_primary, created_at, created_by, updated_at, updated_by, tenant_id) FROM stdin;
14	8	/uploads/products/1745132983404378100_8.png	0	f	2025-04-20 07:09:43.405487+00	admin	2025-04-20 07:09:43.405487+00	admin	1
15	8	/uploads/products/1745133001987603200_8.png	0	f	2025-04-20 07:10:01.990842+00	admin	2025-04-20 07:10:01.990842+00	admin	1
16	9	/uploads/products/1745161391647775700_9.png	0	f	2025-04-20 15:03:11.653112+00	admin	2025-04-20 15:03:11.653112+00	admin	1
17	10	/uploads/products/1745163085172549100_10.png	0	f	2025-04-20 15:31:25.178065+00	admin	2025-04-20 15:31:25.178065+00	admin	1
6	1	/uploads/products/1743319424832942700_1.png	0	f	2025-03-30 07:23:44.836285+00	admin	2025-03-30 07:23:44.836285+00	admin	1
7	1	/uploads/products/1743319439386728500_1.png	0	f	2025-03-30 07:23:59.388736+00	admin	2025-03-30 07:23:59.388736+00	admin	1
8	2	/uploads/products/1743319783567784400_2.png	0	f	2025-03-30 07:29:43.570773+00	admin	2025-03-30 07:29:43.570773+00	admin	1
18	11	/uploads/products/1747584242370467800_11.png	0	f	2025-05-18 16:04:02.373541+00	admin	2025-05-18 16:04:02.373541+00	admin	1
19	11	/uploads/products/1747584242689569400_11.jpg	0	f	2025-05-18 16:04:02.702925+00	admin	2025-05-18 16:04:02.702925+00	admin	1
11	4	/uploads/products/1743320186461926700_4.png	0	f	2025-03-30 07:36:26.465237+00	admin	2025-03-30 07:36:26.465237+00	admin	1
12	4	/uploads/products/1743320453223313500_4.png	0	f	2025-03-30 07:40:53.225517+00	admin	2025-03-30 07:40:53.225517+00	admin	1
\.


--
-- TOC entry 4089 (class 0 OID 24841)
-- Dependencies: 265
-- Data for Name: production_tasks; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.production_tasks (id, order_item_id, task_type, sequence_number, employee_id, status, started_at, completed_at, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	3	layout	1	7	completed	2025-03-30 10:30:22.109029+00	2025-03-30 14:30:22.109029+00	Captain armband design approved	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
3	3	cutting	3	19	pending	\N	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
7	3	quality_check	7	27	pending	\N	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
8	4	layout	1	7	completed	2025-03-30 10:30:22.109029+00	2025-03-30 12:30:22.109029+00	Standard jersey layout completed	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
9	4	printing	2	10	completed	2025-03-30 13:30:22.109029+00	2025-03-30 16:30:22.109029+00	Name and number printed successfully	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
10	4	cutting	3	19	in_progress	2025-03-30 17:30:22.109029+00	\N	Material preparation in progress	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
11	4	sewing	4	22	pending	\N	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
12	4	pressing	5	16	pending	\N	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
14	4	quality_check	7	27	pending	\N	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
2	3	printing	2	10	in_progress	2025-03-30 15:30:22.109029+00	\N	test	1	2025-04-01 10:30:22.109029+00	system	2025-05-17 15:01:50.805877+00	admin
15	10	LAYOUT	1	\N	in_progress	2025-05-18 15:35:43.93+00	2025-05-18 03:10:52.487+00		1	2025-05-18 03:09:29.151675+00	admin	2025-05-18 15:35:44.077044+00	admin
13	4	finishing	6	25	completed	2025-05-17 15:47:26.597+00	2025-05-17 15:49:43.774+00	test	1	2025-04-01 10:30:22.109029+00	system	2025-05-17 15:49:43.796786+00	admin
4	3	sewing	4	22	in_progress	2025-05-17 15:51:07.941+00	\N	\N	1	2025-04-01 10:30:22.109029+00	system	2025-05-17 15:51:08.010141+00	admin
5	3	pressing	5	16	completed	2025-05-17 14:58:13.296+00	2025-05-17 16:21:19.285+00	\N	1	2025-04-01 10:30:22.109029+00	system	2025-05-17 16:21:19.360189+00	admin
6	3	finishing	6	25	completed	\N	2025-05-17 16:50:12.8+00	\N	1	2025-04-01 10:30:22.109029+00	system	2025-05-17 16:50:12.935608+00	admin
16	10	PRINTING	2	\N	pending	\N	\N		1	2025-05-18 03:09:29.187072+00	admin	2025-05-18 03:09:29.187072+00	admin
17	10	PREPARING	3	\N	pending	\N	\N		1	2025-05-18 03:09:29.198953+00	admin	2025-05-18 03:09:29.198953+00	admin
18	10	PRESSING	4	\N	pending	\N	\N		1	2025-05-18 03:09:29.209355+00	admin	2025-05-18 03:09:29.209355+00	admin
19	10	CUTTING	5	\N	pending	\N	\N		1	2025-05-18 03:09:29.218387+00	admin	2025-05-18 03:09:29.218387+00	admin
20	10	SEWING	6	\N	pending	\N	\N		1	2025-05-18 03:09:29.228371+00	admin	2025-05-18 03:09:29.228371+00	admin
21	10	FINISHING	7	\N	pending	\N	\N		1	2025-05-18 03:09:29.239282+00	admin	2025-05-18 03:09:29.239282+00	admin
28	11	FINISHING	7	\N	pending	2025-05-18 03:10:14.548+00	\N		1	2025-05-18 03:09:29.317435+00	admin	2025-05-18 03:10:24.113466+00	admin
22	11	LAYOUT	1	\N	pending	2025-05-18 03:10:50.708+00	2025-05-18 03:10:54.448+00		1	2025-05-18 03:09:29.255318+00	admin	2025-05-18 03:11:13.390084+00	admin
23	11	PRINTING	2	\N	pending	\N	\N		1	2025-05-18 03:09:29.26642+00	admin	2025-05-18 03:09:29.26642+00	admin
24	11	PREPARING	3	\N	pending	\N	\N		1	2025-05-18 03:09:29.278018+00	admin	2025-05-18 03:09:29.278018+00	admin
25	11	PRESSING	4	\N	pending	\N	\N		1	2025-05-18 03:09:29.287903+00	admin	2025-05-18 03:09:29.287903+00	admin
26	11	CUTTING	5	\N	pending	\N	\N		1	2025-05-18 03:09:29.297025+00	admin	2025-05-18 03:09:29.297025+00	admin
27	11	SEWING	6	\N	pending	\N	\N		1	2025-05-18 03:09:29.307978+00	admin	2025-05-18 03:09:29.307978+00	admin
29	12	LAYOUT	1	\N	completed	2025-05-18 16:14:22.705+00	2025-05-18 16:16:14.979+00		1	2025-05-18 16:09:31.531985+00	admin	2025-05-18 16:16:15.01512+00	admin
36	13	LAYOUT	1	\N	completed	2025-05-18 16:14:55.327+00	2025-05-18 16:17:10.116+00	oke test d catrat y	1	2025-05-18 16:09:31.712661+00	admin	2025-05-18 16:17:10.148681+00	admin
30	12	PRINTING	2	\N	pending	\N	\N		1	2025-05-18 16:09:31.565126+00	admin	2025-05-18 16:09:31.565126+00	admin
31	12	PREPARING	3	\N	pending	\N	\N		1	2025-05-18 16:09:31.592971+00	admin	2025-05-18 16:09:31.592971+00	admin
32	12	PRESSING	4	\N	pending	\N	\N		1	2025-05-18 16:09:31.614403+00	admin	2025-05-18 16:09:31.614403+00	admin
33	12	CUTTING	5	\N	pending	\N	\N		1	2025-05-18 16:09:31.639441+00	admin	2025-05-18 16:09:31.639441+00	admin
34	12	SEWING	6	\N	pending	\N	\N		1	2025-05-18 16:09:31.665439+00	admin	2025-05-18 16:09:31.665439+00	admin
35	12	FINISHING	7	\N	pending	\N	\N		1	2025-05-18 16:09:31.691328+00	admin	2025-05-18 16:09:31.691328+00	admin
37	13	PRINTING	2	\N	pending	\N	\N		1	2025-05-18 16:09:31.740235+00	admin	2025-05-18 16:09:31.740235+00	admin
38	13	PREPARING	3	\N	pending	\N	\N		1	2025-05-18 16:09:31.767141+00	admin	2025-05-18 16:09:31.767141+00	admin
39	13	PRESSING	4	\N	pending	\N	\N		1	2025-05-18 16:09:31.7991+00	admin	2025-05-18 16:09:31.7991+00	admin
40	13	CUTTING	5	\N	pending	\N	\N		1	2025-05-18 16:09:31.820149+00	admin	2025-05-18 16:09:31.820149+00	admin
41	13	SEWING	6	\N	pending	\N	\N		1	2025-05-18 16:09:31.845642+00	admin	2025-05-18 16:09:31.845642+00	admin
42	13	FINISHING	7	\N	pending	\N	\N		1	2025-05-18 16:09:31.867983+00	admin	2025-05-18 16:09:31.867983+00	admin
43	14	LAYOUT	1	\N	pending	\N	\N		1	2025-05-18 16:23:19.036408+00	admin	2025-05-18 16:23:19.036408+00	admin
44	14	PRINTING	2	\N	pending	\N	\N		1	2025-05-18 16:23:19.058333+00	admin	2025-05-18 16:23:19.058333+00	admin
45	14	PREPARING	3	\N	pending	\N	\N		1	2025-05-18 16:23:19.080898+00	admin	2025-05-18 16:23:19.080898+00	admin
46	14	PRESSING	4	\N	pending	\N	\N		1	2025-05-18 16:23:19.104707+00	admin	2025-05-18 16:23:19.104707+00	admin
47	14	CUTTING	5	\N	pending	\N	\N		1	2025-05-18 16:23:19.123401+00	admin	2025-05-18 16:23:19.123401+00	admin
48	14	SEWING	6	\N	pending	\N	\N		1	2025-05-18 16:23:19.143306+00	admin	2025-05-18 16:23:19.143306+00	admin
49	14	FINISHING	7	\N	pending	\N	\N		1	2025-05-18 16:23:19.162718+00	admin	2025-05-18 16:23:19.162718+00	admin
50	15	LAYOUT	1	\N	pending	\N	\N		1	2025-05-23 02:24:43.35743+00	admin	2025-05-23 02:24:43.35743+00	admin
51	15	PRINTING	2	\N	pending	\N	\N		1	2025-05-23 02:24:43.412512+00	admin	2025-05-23 02:24:43.412512+00	admin
52	15	PREPARING	3	\N	pending	\N	\N		1	2025-05-23 02:24:43.429333+00	admin	2025-05-23 02:24:43.429333+00	admin
53	15	PRESSING	4	\N	pending	\N	\N		1	2025-05-23 02:24:43.443909+00	admin	2025-05-23 02:24:43.443909+00	admin
54	15	CUTTING	5	\N	pending	\N	\N		1	2025-05-23 02:24:43.461617+00	admin	2025-05-23 02:24:43.461617+00	admin
55	15	SEWING	6	\N	pending	\N	\N		1	2025-05-23 02:24:43.47736+00	admin	2025-05-23 02:24:43.47736+00	admin
56	15	FINISHING	7	\N	pending	\N	\N		1	2025-05-23 02:24:43.493374+00	admin	2025-05-23 02:24:43.493374+00	admin
57	16	LAYOUT	1	\N	pending	\N	\N		1	2025-05-23 02:28:52.809645+00	admin	2025-05-23 02:28:52.809645+00	admin
58	16	PRINTING	2	\N	pending	\N	\N		1	2025-05-23 02:28:52.826737+00	admin	2025-05-23 02:28:52.826737+00	admin
59	16	PREPARING	3	\N	pending	\N	\N		1	2025-05-23 02:28:52.842872+00	admin	2025-05-23 02:28:52.842872+00	admin
60	16	PRESSING	4	\N	pending	\N	\N		1	2025-05-23 02:28:52.85952+00	admin	2025-05-23 02:28:52.85952+00	admin
61	16	CUTTING	5	\N	pending	\N	\N		1	2025-05-23 02:28:52.877773+00	admin	2025-05-23 02:28:52.877773+00	admin
62	16	SEWING	6	\N	pending	\N	\N		1	2025-05-23 02:28:52.895298+00	admin	2025-05-23 02:28:52.895298+00	admin
63	16	FINISHING	7	\N	pending	\N	\N		1	2025-05-23 02:28:52.911376+00	admin	2025-05-23 02:28:52.911376+00	admin
\.


--
-- TOC entry 4091 (class 0 OID 24851)
-- Dependencies: 267
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.purchase_order_items (id, purchase_order_id, item_id, quantity, unit_price, subtotal, received_quantity, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	1	100	30.00	3000.00	0	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
2	1	2	50	40.00	2000.00	0	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
3	2	3	60	50.00	3000.00	0	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
\.


--
-- TOC entry 4093 (class 0 OID 24861)
-- Dependencies: 269
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.purchase_orders (id, po_number, supplier_id, order_date, delivery_date, subtotal, tax_amount, total_amount, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	PO-2024-001	1	2024-04-01	2024-04-08	5000.00	500.00	5500.00	approved	\N	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
2	PO-2024-002	2	2024-04-02	2024-04-09	3000.00	300.00	3300.00	pending	\N	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
\.


--
-- TOC entry 4096 (class 0 OID 24873)
-- Dependencies: 272
-- Data for Name: role_menus; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.role_menus (id, role_id, menu_id, created_at, created_by, updated_by) FROM stdin;
1	1	1	2025-03-22 07:25:18.170058	system	system
2	1	2	2025-03-22 07:25:18.170058	system	system
3	1	3	2025-03-22 07:25:18.170058	system	system
4	1	4	2025-03-22 07:25:18.170058	system	system
5	1	5	2025-03-22 07:25:18.170058	system	system
6	1	6	2025-03-22 07:25:18.170058	system	system
7	1	7	2025-03-22 07:25:18.170058	system	system
8	1	8	2025-03-22 07:25:18.170058	system	system
9	1	9	2025-03-22 07:25:18.170058	system	system
10	1	10	2025-03-22 07:25:18.170058	system	system
11	1	11	2025-03-22 07:25:18.170058	system	system
12	1	12	2025-03-22 07:25:18.170058	system	system
13	1	13	2025-03-22 07:25:18.170058	system	system
27	1	14	2025-03-22 08:01:33.579056	system	system
28	1	15	2025-03-22 08:01:33.579056	system	system
29	1	16	2025-03-22 08:01:33.579056	system	system
30	1	17	2025-03-22 08:01:33.579056	system	system
33	1	20	2025-03-22 08:01:33.579056	system	system
56	1	22	2025-03-22 08:05:53.211416	system	system
58	1	24	2025-03-22 08:05:53.211416	system	system
59	1	25	2025-03-22 08:05:53.211416	system	system
60	1	26	2025-03-22 08:05:53.211416	system	system
61	1	27	2025-03-22 08:05:53.211416	system	system
62	1	28	2025-03-22 08:05:53.211416	system	system
63	1	29	2025-03-22 08:05:53.211416	system	system
64	1	30	2025-03-22 08:05:53.211416	system	system
65	1	31	2025-03-22 08:05:53.211416	system	system
66	1	32	2025-03-22 08:05:53.211416	system	system
67	1	33	2025-03-22 08:05:53.211416	system	system
68	1	34	2025-03-22 08:05:53.211416	system	system
71	2	41	2025-03-23 08:13:03.43411	system	system
72	2	40	2025-03-23 08:14:14.063347	system	system
73	2	42	2025-03-26 16:37:41.986296	system	system
74	1	46	2025-04-06 15:05:27.822436	system	system
75	1	47	2025-04-06 15:55:33.350542	system	system
77	2	48	2025-04-07 08:14:29.598363	system	system
76	2	49	2025-04-07 08:14:17.173359	system	system
\.


--
-- TOC entry 4098 (class 0 OID 24881)
-- Dependencies: 274
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.role_permissions (id, role_id, permission_id, created_at, created_by, updated_by, updated_at) FROM stdin;
5	1	9	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
6	1	10	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
7	1	11	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
8	1	12	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
9	1	13	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
10	1	14	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
11	1	15	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
12	1	16	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
13	1	17	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
14	1	18	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
15	1	19	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
16	1	20	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
17	1	21	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
18	1	22	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
19	1	23	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
20	1	24	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
21	1	25	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
22	1	26	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
23	1	27	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
24	1	28	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
25	1	29	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
26	1	30	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
27	1	31	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
28	1	32	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
29	1	33	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
30	1	34	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
31	1	35	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
32	1	36	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
33	1	37	2025-03-23 17:49:34.448035	system	system	2025-03-23 17:49:34.448035
43	2	38	2025-03-24 23:48:37.872075	admin	admin	2025-03-24 23:48:37.872075
44	2	17	2025-03-24 23:48:37.87498	admin	admin	2025-03-24 23:48:37.87498
\.


--
-- TOC entry 4099 (class 0 OID 24889)
-- Dependencies: 275
-- Data for Name: sales_invoices; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.sales_invoices (id, invoice_number, order_id, invoice_date, due_date, subtotal, tax_amount, total_amount, paid_amount, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	INV-2024-001	3	2024-04-01	2024-04-15	1612.18	0.00	1612.18	0.00	partial	\N	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
\.


--
-- TOC entry 4101 (class 0 OID 24901)
-- Dependencies: 277
-- Data for Name: sales_payments; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.sales_payments (id, invoice_id, payment_date, amount, payment_method, reference_number, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	2024-04-01	899.87	bank_transfer	TRX-2024-001-DP	\N	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
2	1	2024-04-02	449.94	bank_transfer	TRX-2024-001-PP1	\N	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
\.


--
-- TOC entry 4103 (class 0 OID 24909)
-- Dependencies: 279
-- Data for Name: stock_opname; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.stock_opname (id, opname_number, opname_date, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	SO-2024-001	2024-03-15	completed	Monthly stock taking - March 2024	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
2	SO-2024-002	2024-03-30	in_progress	Emergency stock count - Fabric section	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
\.


--
-- TOC entry 4104 (class 0 OID 24918)
-- Dependencies: 280
-- Data for Name: stock_opname_detail; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.stock_opname_detail (id, stock_opname_id, item_id, system_qty, actual_qty, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	1	1200	1180	Minor discrepancy in fabric count	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
2	1	2	900	900	Count matches system	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
3	1	3	600	595	Small difference found	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
4	1	4	60	58	Two spools missing	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
5	2	1	1000	980	Counting in progress	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
6	2	2	850	850	Verified count	1	2025-04-06 10:44:03.215723+00	system	2025-04-06 10:44:03.215723+00	system
\.


--
-- TOC entry 4107 (class 0 OID 24930)
-- Dependencies: 283
-- Data for Name: task_history; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.task_history (id, task_id, employee_id, status_change, comment, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	7	pending->in_progress	Starting layout for captain jersey	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
2	1	7	in_progress->completed	Layout completed and approved by supervisor	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
3	2	10	pending->in_progress	Beginning printing process for captain jersey	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
4	8	7	pending->in_progress	Starting layout for standard jersey	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
5	8	7	in_progress->completed	Layout completed - standard template	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
6	9	10	pending->in_progress	Starting printing process	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
7	9	10	in_progress->completed	Printing completed successfully	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
8	10	19	pending->in_progress	Beginning cutting process	1	2025-04-01 10:30:22.109029+00	system	2025-04-01 10:30:22.109029+00	system
\.


--
-- TOC entry 4109 (class 0 OID 24938)
-- Dependencies: 285
-- Data for Name: transaction_categories; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.transaction_categories (id, code, name, type, description, is_active, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	INC-SALES	Sales Income	income	Income from product sales	t	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
2	INC-OTHER	Other Income	income	Other sources of income	t	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
3	EXP-MAT	Material Purchase	expense	Expenses for raw materials	t	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
4	EXP-UTIL	Utilities	expense	Utility expenses	t	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
5	EXP-SAL	Salaries	expense	Employee salaries	t	1	2025-04-11 03:21:51.63462+00	system	2025-04-11 03:21:51.63462+00	system
\.


--
-- TOC entry 4111 (class 0 OID 24948)
-- Dependencies: 287
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.users (id, username, email, password, role_id, created_at, updated_at, tenant_id, created_by, updated_by) FROM stdin;
2edc5fea-66b5-42b3-b43e-c62cffce2827	admin	admin@vomo.com	$2a$10$l3Z707FqsWjwr5/eu6ZhJOs2khyvl/nvPGxGqvHkaMC0GAZiD/0SC	1	2025-03-22 07:46:34.636008+00	2025-03-22 07:46:34.636008+00	1	system	system
4578c1ad-3f61-40a4-b50d-edd103c0998a	developer	developer@vomo.com	$2a$10$l3Z707FqsWjwr5/eu6ZhJOs2khyvl/nvPGxGqvHkaMC0GAZiD/0SC	2	2025-03-23 17:54:53.830827+00	2025-03-23 17:54:53.830827+00	1	system	system
a31debd8-ef47-4b2a-bb08-e7ca49fbbd88	admin2	admin2@vomo.com	$2a$10$rStpWqylI8QAFMYU2cdrVu85iwKXaMgwSrXv0M9iqECKEUgiE4zLW	1	2025-04-01 09:33:30.538388+00	2025-04-01 09:33:30.538388+00	1	admin	admin
\.


--
-- TOC entry 4112 (class 0 OID 24956)
-- Dependencies: 288
-- Data for Name: work_order_items; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.work_order_items (id, work_order_id, item_id, description, quantity, unit_price, total_price, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	1	Polyester Mesh Fabric for jerseys	100	15.00	1500.00	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
2	1	2	Dri-Fit Material for inner lining	50	10.00	500.00	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
\.


--
-- TOC entry 4114 (class 0 OID 24964)
-- Dependencies: 290
-- Data for Name: work_order_tasks; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.work_order_tasks (id, work_order_id, task_name, description, assigned_to, start_date, end_date, status, notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	1	Material Preparation	Prepare and inspect all required materials	13	2025-04-01 08:00:00	2025-04-01 17:00:00	completed	\N	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
2	1	Cutting Process	Cut materials according to size specifications	19	2025-04-02 08:00:00	2025-04-02 17:00:00	in_progress	\N	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
3	1	Sewing Process	Sew jersey components together	22	2025-04-03 08:00:00	2025-04-04 17:00:00	pending	\N	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
4	1	Quality Check	Final quality inspection	25	2025-04-05 08:00:00	2025-04-05 17:00:00	pending	\N	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
\.


--
-- TOC entry 4116 (class 0 OID 24974)
-- Dependencies: 292
-- Data for Name: work_orders; Type: TABLE DATA; Schema: public; Owner: zentra_api_admin
--

COPY public.work_orders (id, spk_number, order_id, customer_name, work_type, description, start_date, end_date, status, assigned_to, estimated_cost, actual_cost, completion_notes, tenant_id, created_at, created_by, updated_at, updated_by) FROM stdin;
1	SPK-2024-001	3	Manchester United FC	production	Team jersey production for new season - 35 jerseys total	2025-04-01 08:00:00	2025-04-08 17:00:00	in_progress	7	2000.00	\N	\N	1	2025-04-11 10:05:34.306599	system	2025-04-11 10:05:34.306599	system
\.


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 216
-- Name: audit_trail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.audit_trail_id_seq', 287, true);


--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 218
-- Name: backup_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.backup_id_seq', 41, true);


--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 220
-- Name: cash_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.cash_flow_id_seq', 13, true);


--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 222
-- Name: item_stock_movement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.item_stock_movement_id_seq', 6, true);


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 224
-- Name: master_channel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_channel_id_seq', 19, true);


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 294
-- Name: master_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_customer_id_seq', 2, true);


--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 225
-- Name: master_division_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_division_id_seq', 11, true);


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 227
-- Name: master_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_employee_id_seq', 39, true);


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 230
-- Name: master_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_item_id_seq', 15, true);


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 232
-- Name: master_menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_menu_id_seq', 49, true);


--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 234
-- Name: master_office_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_office_id_seq', 34, true);


--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 235
-- Name: master_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_permission_id_seq', 41, true);


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 239
-- Name: master_product_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_product_category_id_seq', 9, true);


--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 237
-- Name: master_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_product_id_seq', 12, true);


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 241
-- Name: master_region_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_region_id_seq', 18, true);


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 243
-- Name: master_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_role_id_seq', 7, true);


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 246
-- Name: master_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_supplier_id_seq', 4, true);


--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 248
-- Name: master_tenant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_tenant_id_seq', 1, true);


--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 249
-- Name: master_user_menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_user_menu_id_seq', 1, false);


--
-- TOC entry 4178 (class 0 OID 0)
-- Dependencies: 251
-- Name: master_zone_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.master_zone_id_seq', 42, true);


--
-- TOC entry 4179 (class 0 OID 0)
-- Dependencies: 254
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.order_items_id_seq', 16, true);


--
-- TOC entry 4180 (class 0 OID 0)
-- Dependencies: 256
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.orders_id_seq', 15, true);


--
-- TOC entry 4181 (class 0 OID 0)
-- Dependencies: 258
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.payments_id_seq', 4, true);


--
-- TOC entry 4182 (class 0 OID 0)
-- Dependencies: 260
-- Name: petty_cash_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.petty_cash_id_seq', 3, true);


--
-- TOC entry 4183 (class 0 OID 0)
-- Dependencies: 262
-- Name: petty_cash_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.petty_cash_requests_id_seq', 3, true);


--
-- TOC entry 4184 (class 0 OID 0)
-- Dependencies: 264
-- Name: product_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.product_images_id_seq', 19, true);


--
-- TOC entry 4185 (class 0 OID 0)
-- Dependencies: 266
-- Name: production_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.production_tasks_id_seq', 63, true);


--
-- TOC entry 4186 (class 0 OID 0)
-- Dependencies: 268
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 3, true);


--
-- TOC entry 4187 (class 0 OID 0)
-- Dependencies: 270
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 2, true);


--
-- TOC entry 4188 (class 0 OID 0)
-- Dependencies: 271
-- Name: role_menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.role_menus_id_seq', 77, true);


--
-- TOC entry 4189 (class 0 OID 0)
-- Dependencies: 273
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 71, true);


--
-- TOC entry 4190 (class 0 OID 0)
-- Dependencies: 276
-- Name: sales_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.sales_invoices_id_seq', 1, true);


--
-- TOC entry 4191 (class 0 OID 0)
-- Dependencies: 278
-- Name: sales_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.sales_payments_id_seq', 2, true);


--
-- TOC entry 4192 (class 0 OID 0)
-- Dependencies: 281
-- Name: stock_opname_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.stock_opname_detail_id_seq', 6, true);


--
-- TOC entry 4193 (class 0 OID 0)
-- Dependencies: 282
-- Name: stock_opname_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.stock_opname_id_seq', 2, true);


--
-- TOC entry 4194 (class 0 OID 0)
-- Dependencies: 284
-- Name: task_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.task_history_id_seq', 8, true);


--
-- TOC entry 4195 (class 0 OID 0)
-- Dependencies: 286
-- Name: transaction_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.transaction_categories_id_seq', 7, true);


--
-- TOC entry 4196 (class 0 OID 0)
-- Dependencies: 289
-- Name: work_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.work_order_items_id_seq', 2, true);


--
-- TOC entry 4197 (class 0 OID 0)
-- Dependencies: 291
-- Name: work_order_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.work_order_tasks_id_seq', 4, true);


--
-- TOC entry 4198 (class 0 OID 0)
-- Dependencies: 293
-- Name: work_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zentra_api_admin
--

SELECT pg_catalog.setval('public.work_orders_id_seq', 1, true);


--
-- TOC entry 3599 (class 2606 OID 25013)
-- Name: audit_trail audit_trail_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_pkey PRIMARY KEY (id);


--
-- TOC entry 3604 (class 2606 OID 25015)
-- Name: backup backup_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.backup
    ADD CONSTRAINT backup_pkey PRIMARY KEY (id);


--
-- TOC entry 3608 (class 2606 OID 25017)
-- Name: cash_flow cash_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow
    ADD CONSTRAINT cash_flow_pkey PRIMARY KEY (id);


--
-- TOC entry 3619 (class 2606 OID 25019)
-- Name: item_stock_movement item_stock_movement_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.item_stock_movement
    ADD CONSTRAINT item_stock_movement_pkey PRIMARY KEY (id);


--
-- TOC entry 3812 (class 2606 OID 32780)
-- Name: master_customer master_customer_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_customer
    ADD CONSTRAINT master_customer_pkey PRIMARY KEY (id);


--
-- TOC entry 3814 (class 2606 OID 32782)
-- Name: master_customer master_customer_tenant_id_customer_number_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_customer
    ADD CONSTRAINT master_customer_tenant_id_customer_number_key UNIQUE (tenant_id, customer_number);


--
-- TOC entry 3626 (class 2606 OID 25021)
-- Name: master_division master_division_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_division
    ADD CONSTRAINT master_division_pkey PRIMARY KEY (id);


--
-- TOC entry 3629 (class 2606 OID 25023)
-- Name: master_employee master_employee_email_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_employee
    ADD CONSTRAINT master_employee_email_key UNIQUE (email);


--
-- TOC entry 3631 (class 2606 OID 25025)
-- Name: master_employee master_employee_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_employee
    ADD CONSTRAINT master_employee_pkey PRIMARY KEY (id);


--
-- TOC entry 3636 (class 2606 OID 25027)
-- Name: master_item master_item_code_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_item
    ADD CONSTRAINT master_item_code_tenant_id_key UNIQUE (code, tenant_id);


--
-- TOC entry 3638 (class 2606 OID 25029)
-- Name: master_item master_item_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_item
    ADD CONSTRAINT master_item_pkey PRIMARY KEY (id);


--
-- TOC entry 3641 (class 2606 OID 25031)
-- Name: master_menu master_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_menu
    ADD CONSTRAINT master_menu_pkey PRIMARY KEY (id);


--
-- TOC entry 3643 (class 2606 OID 25033)
-- Name: master_office master_office_code_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office
    ADD CONSTRAINT master_office_code_key UNIQUE (code);


--
-- TOC entry 3645 (class 2606 OID 25035)
-- Name: master_office master_office_email_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office
    ADD CONSTRAINT master_office_email_key UNIQUE (email);


--
-- TOC entry 3647 (class 2606 OID 25037)
-- Name: master_office master_office_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office
    ADD CONSTRAINT master_office_pkey PRIMARY KEY (id);


--
-- TOC entry 3651 (class 2606 OID 25039)
-- Name: master_permission master_permission_code_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_permission
    ADD CONSTRAINT master_permission_code_key UNIQUE (code);


--
-- TOC entry 3653 (class 2606 OID 25041)
-- Name: master_permission master_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_permission
    ADD CONSTRAINT master_permission_pkey PRIMARY KEY (id);


--
-- TOC entry 3665 (class 2606 OID 25043)
-- Name: master_product_category master_product_category_code_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product_category
    ADD CONSTRAINT master_product_category_code_key UNIQUE (code, tenant_id);


--
-- TOC entry 3667 (class 2606 OID 25045)
-- Name: master_product_category master_product_category_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product_category
    ADD CONSTRAINT master_product_category_pkey PRIMARY KEY (id);


--
-- TOC entry 3659 (class 2606 OID 25047)
-- Name: master_product master_product_code_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product
    ADD CONSTRAINT master_product_code_key UNIQUE (code, tenant_id);


--
-- TOC entry 3661 (class 2606 OID 25049)
-- Name: master_product master_product_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product
    ADD CONSTRAINT master_product_pkey PRIMARY KEY (id);


--
-- TOC entry 3670 (class 2606 OID 25051)
-- Name: master_region master_region_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_region
    ADD CONSTRAINT master_region_pkey PRIMARY KEY (id);


--
-- TOC entry 3673 (class 2606 OID 25053)
-- Name: master_role master_role_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_role
    ADD CONSTRAINT master_role_pkey PRIMARY KEY (id);


--
-- TOC entry 3677 (class 2606 OID 25055)
-- Name: master_supplier master_supplier_code_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_supplier
    ADD CONSTRAINT master_supplier_code_tenant_id_key UNIQUE (code, tenant_id);


--
-- TOC entry 3679 (class 2606 OID 25057)
-- Name: master_supplier master_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_supplier
    ADD CONSTRAINT master_supplier_pkey PRIMARY KEY (id);


--
-- TOC entry 3681 (class 2606 OID 25059)
-- Name: master_tenant master_tenant_domain_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_tenant
    ADD CONSTRAINT master_tenant_domain_key UNIQUE (domain);


--
-- TOC entry 3683 (class 2606 OID 25061)
-- Name: master_tenant master_tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_tenant
    ADD CONSTRAINT master_tenant_pkey PRIMARY KEY (id);


--
-- TOC entry 3685 (class 2606 OID 25063)
-- Name: master_user_menu master_user_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_user_menu
    ADD CONSTRAINT master_user_menu_pkey PRIMARY KEY (id);


--
-- TOC entry 3688 (class 2606 OID 25065)
-- Name: master_zone master_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_zone
    ADD CONSTRAINT master_zone_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 25067)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3701 (class 2606 OID 25069)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 3703 (class 2606 OID 25071)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3708 (class 2606 OID 25073)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3621 (class 2606 OID 25075)
-- Name: master_channel pk_master_channel; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_channel
    ADD CONSTRAINT pk_master_channel PRIMARY KEY (id);


--
-- TOC entry 3713 (class 2606 OID 25077)
-- Name: petty_cash pk_petty_cash; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT pk_petty_cash PRIMARY KEY (id);


--
-- TOC entry 3720 (class 2606 OID 25079)
-- Name: petty_cash_requests pk_petty_cash_requests; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT pk_petty_cash_requests PRIMARY KEY (id);


--
-- TOC entry 3724 (class 2606 OID 25081)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 3731 (class 2606 OID 25083)
-- Name: production_tasks production_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3736 (class 2606 OID 25085)
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3742 (class 2606 OID 25087)
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3744 (class 2606 OID 25089)
-- Name: purchase_orders purchase_orders_po_number_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_tenant_id_key UNIQUE (po_number, tenant_id);


--
-- TOC entry 3746 (class 2606 OID 25091)
-- Name: role_menus role_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_menus
    ADD CONSTRAINT role_menus_pkey PRIMARY KEY (id);


--
-- TOC entry 3748 (class 2606 OID 25093)
-- Name: role_menus role_menus_role_id_menu_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_menus
    ADD CONSTRAINT role_menus_role_id_menu_id_key UNIQUE (role_id, menu_id);


--
-- TOC entry 3750 (class 2606 OID 25095)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3752 (class 2606 OID 25097)
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- TOC entry 3758 (class 2606 OID 25099)
-- Name: sales_invoices sales_invoices_invoice_number_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_invoice_number_tenant_id_key UNIQUE (invoice_number, tenant_id);


--
-- TOC entry 3760 (class 2606 OID 25101)
-- Name: sales_invoices sales_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 3765 (class 2606 OID 25103)
-- Name: sales_payments sales_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_payments
    ADD CONSTRAINT sales_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3777 (class 2606 OID 25105)
-- Name: stock_opname_detail stock_opname_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname_detail
    ADD CONSTRAINT stock_opname_detail_pkey PRIMARY KEY (id);


--
-- TOC entry 3770 (class 2606 OID 25107)
-- Name: stock_opname stock_opname_opname_number_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname
    ADD CONSTRAINT stock_opname_opname_number_tenant_id_key UNIQUE (opname_number, tenant_id);


--
-- TOC entry 3772 (class 2606 OID 25109)
-- Name: stock_opname stock_opname_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname
    ADD CONSTRAINT stock_opname_pkey PRIMARY KEY (id);


--
-- TOC entry 3782 (class 2606 OID 25111)
-- Name: task_history task_history_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3784 (class 2606 OID 25113)
-- Name: transaction_categories transaction_categories_code_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_code_tenant_id_key UNIQUE (code, tenant_id);


--
-- TOC entry 3786 (class 2606 OID 25115)
-- Name: transaction_categories transaction_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3623 (class 2606 OID 25117)
-- Name: master_channel uq_master_channel_code; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_channel
    ADD CONSTRAINT uq_master_channel_code UNIQUE (code, tenant_id);


--
-- TOC entry 3789 (class 2606 OID 25119)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3791 (class 2606 OID 25121)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3796 (class 2606 OID 25123)
-- Name: work_order_items work_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3802 (class 2606 OID 25125)
-- Name: work_order_tasks work_order_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_tasks
    ADD CONSTRAINT work_order_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3808 (class 2606 OID 25127)
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3810 (class 2606 OID 25129)
-- Name: work_orders work_orders_spk_number_key; Type: CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_spk_number_key UNIQUE (spk_number);


--
-- TOC entry 3600 (class 1259 OID 25130)
-- Name: idx_audit_trail_created_at; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_audit_trail_created_at ON public.audit_trail USING btree (created_at);


--
-- TOC entry 3601 (class 1259 OID 25131)
-- Name: idx_audit_trail_entity; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_audit_trail_entity ON public.audit_trail USING btree (entity_type, entity_id);


--
-- TOC entry 3602 (class 1259 OID 25132)
-- Name: idx_audit_trail_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_audit_trail_tenant ON public.audit_trail USING btree (tenant_id);


--
-- TOC entry 3605 (class 1259 OID 25133)
-- Name: idx_backup_created_at; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_backup_created_at ON public.backup USING btree (created_at);


--
-- TOC entry 3606 (class 1259 OID 25134)
-- Name: idx_backup_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_backup_tenant ON public.backup USING btree (tenant_id);


--
-- TOC entry 3609 (class 1259 OID 25135)
-- Name: idx_cash_flow_category; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_cash_flow_category ON public.cash_flow USING btree (category_id);


--
-- TOC entry 3610 (class 1259 OID 25136)
-- Name: idx_cash_flow_date; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_cash_flow_date ON public.cash_flow USING btree (transaction_date);


--
-- TOC entry 3611 (class 1259 OID 40962)
-- Name: idx_cash_flow_payment; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_cash_flow_payment ON public.cash_flow USING btree (payment_id);


--
-- TOC entry 3612 (class 1259 OID 25138)
-- Name: idx_cash_flow_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_cash_flow_tenant ON public.cash_flow USING btree (tenant_id);


--
-- TOC entry 3613 (class 1259 OID 25139)
-- Name: idx_cash_flow_type; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_cash_flow_type ON public.cash_flow USING btree (transaction_type);


--
-- TOC entry 3624 (class 1259 OID 25140)
-- Name: idx_division_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_division_tenant ON public.master_division USING btree (tenant_id);


--
-- TOC entry 3627 (class 1259 OID 25141)
-- Name: idx_employee_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_employee_tenant ON public.master_employee USING btree (tenant_id);


--
-- TOC entry 3614 (class 1259 OID 25142)
-- Name: idx_item_stock_movement_item; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_item_stock_movement_item ON public.item_stock_movement USING btree (item_id);


--
-- TOC entry 3615 (class 1259 OID 25143)
-- Name: idx_item_stock_movement_reference; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_item_stock_movement_reference ON public.item_stock_movement USING btree (reference_type, reference_id);


--
-- TOC entry 3616 (class 1259 OID 25144)
-- Name: idx_item_stock_movement_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_item_stock_movement_tenant ON public.item_stock_movement USING btree (tenant_id);


--
-- TOC entry 3617 (class 1259 OID 25145)
-- Name: idx_item_stock_movement_type; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_item_stock_movement_type ON public.item_stock_movement USING btree (movement_type);


--
-- TOC entry 3632 (class 1259 OID 25146)
-- Name: idx_master_item_category; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_master_item_category ON public.master_item USING btree (category);


--
-- TOC entry 3633 (class 1259 OID 25147)
-- Name: idx_master_item_code; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_master_item_code ON public.master_item USING btree (code);


--
-- TOC entry 3634 (class 1259 OID 25148)
-- Name: idx_master_item_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_master_item_tenant ON public.master_item USING btree (tenant_id);


--
-- TOC entry 3674 (class 1259 OID 25149)
-- Name: idx_master_supplier_code; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_master_supplier_code ON public.master_supplier USING btree (code);


--
-- TOC entry 3675 (class 1259 OID 25150)
-- Name: idx_master_supplier_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_master_supplier_tenant ON public.master_supplier USING btree (tenant_id);


--
-- TOC entry 3639 (class 1259 OID 25151)
-- Name: idx_menu_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_menu_tenant ON public.master_menu USING btree (tenant_id);


--
-- TOC entry 3689 (class 1259 OID 25152)
-- Name: idx_order_items_current_task; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_order_items_current_task ON public.order_items USING btree (current_task);


--
-- TOC entry 3690 (class 1259 OID 25153)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 3691 (class 1259 OID 25154)
-- Name: idx_order_items_product; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);


--
-- TOC entry 3692 (class 1259 OID 25155)
-- Name: idx_order_items_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_order_items_status ON public.order_items USING btree (production_status);


--
-- TOC entry 3693 (class 1259 OID 25156)
-- Name: idx_order_items_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_order_items_tenant ON public.order_items USING btree (tenant_id);


--
-- TOC entry 3696 (class 1259 OID 25158)
-- Name: idx_orders_number; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_orders_number ON public.orders USING btree (order_number);


--
-- TOC entry 3697 (class 1259 OID 25159)
-- Name: idx_orders_payment_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);


--
-- TOC entry 3698 (class 1259 OID 25160)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 3699 (class 1259 OID 25161)
-- Name: idx_orders_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_orders_tenant ON public.orders USING btree (tenant_id);


--
-- TOC entry 3704 (class 1259 OID 25162)
-- Name: idx_payments_order; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);


--
-- TOC entry 3705 (class 1259 OID 25163)
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- TOC entry 3706 (class 1259 OID 25164)
-- Name: idx_payments_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_payments_tenant ON public.payments USING btree (tenant_id);


--
-- TOC entry 3648 (class 1259 OID 25165)
-- Name: idx_permission_code; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_permission_code ON public.master_permission USING btree (code);


--
-- TOC entry 3649 (class 1259 OID 25166)
-- Name: idx_permission_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_permission_tenant ON public.master_permission USING btree (tenant_id);


--
-- TOC entry 3709 (class 1259 OID 25167)
-- Name: idx_petty_cash_channel; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_channel ON public.petty_cash USING btree (channel_id);


--
-- TOC entry 3710 (class 1259 OID 25168)
-- Name: idx_petty_cash_division; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_division ON public.petty_cash USING btree (division_id);


--
-- TOC entry 3711 (class 1259 OID 25169)
-- Name: idx_petty_cash_office; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_office ON public.petty_cash USING btree (office_id);


--
-- TOC entry 3714 (class 1259 OID 25170)
-- Name: idx_petty_cash_requests_channel; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_requests_channel ON public.petty_cash_requests USING btree (channel_id);


--
-- TOC entry 3715 (class 1259 OID 25171)
-- Name: idx_petty_cash_requests_division; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_requests_division ON public.petty_cash_requests USING btree (division_id);


--
-- TOC entry 3716 (class 1259 OID 25172)
-- Name: idx_petty_cash_requests_employee; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_requests_employee ON public.petty_cash_requests USING btree (employee_id);


--
-- TOC entry 3717 (class 1259 OID 25173)
-- Name: idx_petty_cash_requests_office; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_requests_office ON public.petty_cash_requests USING btree (office_id);


--
-- TOC entry 3718 (class 1259 OID 25174)
-- Name: idx_petty_cash_requests_petty_cash; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_petty_cash_requests_petty_cash ON public.petty_cash_requests USING btree (petty_cash_id);


--
-- TOC entry 3654 (class 1259 OID 25175)
-- Name: idx_product_category; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_category ON public.master_product USING btree (category_id);


--
-- TOC entry 3662 (class 1259 OID 25176)
-- Name: idx_product_category_code; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_category_code ON public.master_product_category USING btree (code);


--
-- TOC entry 3663 (class 1259 OID 25177)
-- Name: idx_product_category_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_category_tenant ON public.master_product_category USING btree (tenant_id);


--
-- TOC entry 3655 (class 1259 OID 25178)
-- Name: idx_product_code; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_code ON public.master_product USING btree (code);


--
-- TOC entry 3721 (class 1259 OID 25179)
-- Name: idx_product_images_product_id; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_images_product_id ON public.product_images USING btree (product_id);


--
-- TOC entry 3722 (class 1259 OID 25180)
-- Name: idx_product_images_tenant_id; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_images_tenant_id ON public.product_images USING btree (tenant_id);


--
-- TOC entry 3656 (class 1259 OID 25181)
-- Name: idx_product_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_status ON public.master_product USING btree (stock_status);


--
-- TOC entry 3657 (class 1259 OID 25182)
-- Name: idx_product_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_product_tenant ON public.master_product USING btree (tenant_id);


--
-- TOC entry 3725 (class 1259 OID 25183)
-- Name: idx_production_tasks_employee; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_production_tasks_employee ON public.production_tasks USING btree (employee_id);


--
-- TOC entry 3726 (class 1259 OID 25184)
-- Name: idx_production_tasks_order_item; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_production_tasks_order_item ON public.production_tasks USING btree (order_item_id);


--
-- TOC entry 3727 (class 1259 OID 25185)
-- Name: idx_production_tasks_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_production_tasks_status ON public.production_tasks USING btree (status);


--
-- TOC entry 3728 (class 1259 OID 25186)
-- Name: idx_production_tasks_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_production_tasks_tenant ON public.production_tasks USING btree (tenant_id);


--
-- TOC entry 3729 (class 1259 OID 25187)
-- Name: idx_production_tasks_type; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_production_tasks_type ON public.production_tasks USING btree (task_type);


--
-- TOC entry 3732 (class 1259 OID 25188)
-- Name: idx_purchase_order_items_item; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_order_items_item ON public.purchase_order_items USING btree (item_id);


--
-- TOC entry 3733 (class 1259 OID 25189)
-- Name: idx_purchase_order_items_po; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_order_items_po ON public.purchase_order_items USING btree (purchase_order_id);


--
-- TOC entry 3734 (class 1259 OID 25190)
-- Name: idx_purchase_order_items_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_order_items_tenant ON public.purchase_order_items USING btree (tenant_id);


--
-- TOC entry 3737 (class 1259 OID 25191)
-- Name: idx_purchase_orders_number; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_orders_number ON public.purchase_orders USING btree (po_number);


--
-- TOC entry 3738 (class 1259 OID 25192)
-- Name: idx_purchase_orders_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_orders_status ON public.purchase_orders USING btree (status);


--
-- TOC entry 3739 (class 1259 OID 25193)
-- Name: idx_purchase_orders_supplier; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders USING btree (supplier_id);


--
-- TOC entry 3740 (class 1259 OID 25194)
-- Name: idx_purchase_orders_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_purchase_orders_tenant ON public.purchase_orders USING btree (tenant_id);


--
-- TOC entry 3668 (class 1259 OID 25195)
-- Name: idx_region_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_region_tenant ON public.master_region USING btree (tenant_id);


--
-- TOC entry 3671 (class 1259 OID 25196)
-- Name: idx_role_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_role_tenant ON public.master_role USING btree (tenant_id);


--
-- TOC entry 3753 (class 1259 OID 25197)
-- Name: idx_sales_invoices_number; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_invoices_number ON public.sales_invoices USING btree (invoice_number);


--
-- TOC entry 3754 (class 1259 OID 25198)
-- Name: idx_sales_invoices_order; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_invoices_order ON public.sales_invoices USING btree (order_id);


--
-- TOC entry 3755 (class 1259 OID 25199)
-- Name: idx_sales_invoices_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_invoices_status ON public.sales_invoices USING btree (status);


--
-- TOC entry 3756 (class 1259 OID 25200)
-- Name: idx_sales_invoices_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_invoices_tenant ON public.sales_invoices USING btree (tenant_id);


--
-- TOC entry 3761 (class 1259 OID 25201)
-- Name: idx_sales_payments_date; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_payments_date ON public.sales_payments USING btree (payment_date);


--
-- TOC entry 3762 (class 1259 OID 25202)
-- Name: idx_sales_payments_invoice; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_payments_invoice ON public.sales_payments USING btree (invoice_id);


--
-- TOC entry 3763 (class 1259 OID 25203)
-- Name: idx_sales_payments_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_sales_payments_tenant ON public.sales_payments USING btree (tenant_id);


--
-- TOC entry 3766 (class 1259 OID 25204)
-- Name: idx_stock_opname_date; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_date ON public.stock_opname USING btree (opname_date);


--
-- TOC entry 3773 (class 1259 OID 25205)
-- Name: idx_stock_opname_detail_item; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_detail_item ON public.stock_opname_detail USING btree (item_id);


--
-- TOC entry 3774 (class 1259 OID 25206)
-- Name: idx_stock_opname_detail_opname; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_detail_opname ON public.stock_opname_detail USING btree (stock_opname_id);


--
-- TOC entry 3775 (class 1259 OID 25207)
-- Name: idx_stock_opname_detail_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_detail_tenant ON public.stock_opname_detail USING btree (tenant_id);


--
-- TOC entry 3767 (class 1259 OID 25208)
-- Name: idx_stock_opname_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_status ON public.stock_opname USING btree (status);


--
-- TOC entry 3768 (class 1259 OID 25209)
-- Name: idx_stock_opname_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_stock_opname_tenant ON public.stock_opname USING btree (tenant_id);


--
-- TOC entry 3778 (class 1259 OID 25210)
-- Name: idx_task_history_employee; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_task_history_employee ON public.task_history USING btree (employee_id);


--
-- TOC entry 3779 (class 1259 OID 25211)
-- Name: idx_task_history_task; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_task_history_task ON public.task_history USING btree (task_id);


--
-- TOC entry 3780 (class 1259 OID 25212)
-- Name: idx_task_history_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_task_history_tenant ON public.task_history USING btree (tenant_id);


--
-- TOC entry 3787 (class 1259 OID 25213)
-- Name: idx_users_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);


--
-- TOC entry 3792 (class 1259 OID 25214)
-- Name: idx_work_order_items_item; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_items_item ON public.work_order_items USING btree (item_id);


--
-- TOC entry 3793 (class 1259 OID 25215)
-- Name: idx_work_order_items_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_items_tenant ON public.work_order_items USING btree (tenant_id);


--
-- TOC entry 3794 (class 1259 OID 25216)
-- Name: idx_work_order_items_work_order; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_items_work_order ON public.work_order_items USING btree (work_order_id);


--
-- TOC entry 3797 (class 1259 OID 25217)
-- Name: idx_work_order_tasks_assigned_to; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_tasks_assigned_to ON public.work_order_tasks USING btree (assigned_to);


--
-- TOC entry 3798 (class 1259 OID 25218)
-- Name: idx_work_order_tasks_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_tasks_status ON public.work_order_tasks USING btree (status);


--
-- TOC entry 3799 (class 1259 OID 25219)
-- Name: idx_work_order_tasks_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_tasks_tenant ON public.work_order_tasks USING btree (tenant_id);


--
-- TOC entry 3800 (class 1259 OID 25220)
-- Name: idx_work_order_tasks_work_order; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_order_tasks_work_order ON public.work_order_tasks USING btree (work_order_id);


--
-- TOC entry 3803 (class 1259 OID 25221)
-- Name: idx_work_orders_assigned_to; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_orders_assigned_to ON public.work_orders USING btree (assigned_to);


--
-- TOC entry 3804 (class 1259 OID 25222)
-- Name: idx_work_orders_order_id; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_orders_order_id ON public.work_orders USING btree (order_id);


--
-- TOC entry 3805 (class 1259 OID 25223)
-- Name: idx_work_orders_status; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_orders_status ON public.work_orders USING btree (status);


--
-- TOC entry 3806 (class 1259 OID 25224)
-- Name: idx_work_orders_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_work_orders_tenant ON public.work_orders USING btree (tenant_id);


--
-- TOC entry 3686 (class 1259 OID 25225)
-- Name: idx_zone_tenant; Type: INDEX; Schema: public; Owner: zentra_api_admin
--

CREATE INDEX idx_zone_tenant ON public.master_zone USING btree (tenant_id);


--
-- TOC entry 3896 (class 2620 OID 25226)
-- Name: petty_cash_requests tr_update_petty_cash_balance; Type: TRIGGER; Schema: public; Owner: zentra_api_admin
--

CREATE TRIGGER tr_update_petty_cash_balance AFTER UPDATE ON public.petty_cash_requests FOR EACH ROW EXECUTE FUNCTION public.update_petty_cash_balance();


--
-- TOC entry 3815 (class 2606 OID 25227)
-- Name: audit_trail audit_trail_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.audit_trail
    ADD CONSTRAINT audit_trail_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3816 (class 2606 OID 25232)
-- Name: backup backup_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.backup
    ADD CONSTRAINT backup_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3817 (class 2606 OID 25237)
-- Name: cash_flow cash_flow_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow
    ADD CONSTRAINT cash_flow_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id);


--
-- TOC entry 3818 (class 2606 OID 25242)
-- Name: cash_flow cash_flow_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow
    ADD CONSTRAINT cash_flow_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.master_office(id);


--
-- TOC entry 3819 (class 2606 OID 40963)
-- Name: cash_flow cash_flow_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow
    ADD CONSTRAINT cash_flow_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- TOC entry 3820 (class 2606 OID 25252)
-- Name: cash_flow cash_flow_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.cash_flow
    ADD CONSTRAINT cash_flow_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3849 (class 2606 OID 25257)
-- Name: petty_cash fk_petty_cash_channel; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_channel FOREIGN KEY (channel_id) REFERENCES public.master_channel(id);


--
-- TOC entry 3850 (class 2606 OID 25262)
-- Name: petty_cash fk_petty_cash_division; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_division FOREIGN KEY (division_id) REFERENCES public.master_division(id);


--
-- TOC entry 3851 (class 2606 OID 25267)
-- Name: petty_cash fk_petty_cash_office; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_office FOREIGN KEY (office_id) REFERENCES public.master_office(id);


--
-- TOC entry 3853 (class 2606 OID 25272)
-- Name: petty_cash_requests fk_petty_cash_requests_category; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_category FOREIGN KEY (category_id) REFERENCES public.transaction_categories(id);


--
-- TOC entry 3854 (class 2606 OID 25277)
-- Name: petty_cash_requests fk_petty_cash_requests_channel; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_channel FOREIGN KEY (channel_id) REFERENCES public.master_channel(id);


--
-- TOC entry 3855 (class 2606 OID 25282)
-- Name: petty_cash_requests fk_petty_cash_requests_division; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_division FOREIGN KEY (division_id) REFERENCES public.master_division(id);


--
-- TOC entry 3856 (class 2606 OID 25287)
-- Name: petty_cash_requests fk_petty_cash_requests_employee; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_employee FOREIGN KEY (employee_id) REFERENCES public.master_employee(id);


--
-- TOC entry 3857 (class 2606 OID 25292)
-- Name: petty_cash_requests fk_petty_cash_requests_office; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_office FOREIGN KEY (office_id) REFERENCES public.master_office(id);


--
-- TOC entry 3858 (class 2606 OID 25297)
-- Name: petty_cash_requests fk_petty_cash_requests_petty_cash; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_petty_cash FOREIGN KEY (petty_cash_id) REFERENCES public.petty_cash(id);


--
-- TOC entry 3859 (class 2606 OID 25302)
-- Name: petty_cash_requests fk_petty_cash_requests_tenant; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash_requests
    ADD CONSTRAINT fk_petty_cash_requests_tenant FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3852 (class 2606 OID 25307)
-- Name: petty_cash fk_petty_cash_tenant; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.petty_cash
    ADD CONSTRAINT fk_petty_cash_tenant FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3821 (class 2606 OID 25312)
-- Name: item_stock_movement item_stock_movement_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.item_stock_movement
    ADD CONSTRAINT item_stock_movement_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.master_item(id);


--
-- TOC entry 3822 (class 2606 OID 25317)
-- Name: item_stock_movement item_stock_movement_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.item_stock_movement
    ADD CONSTRAINT item_stock_movement_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3895 (class 2606 OID 32783)
-- Name: master_customer master_customer_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_customer
    ADD CONSTRAINT master_customer_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3823 (class 2606 OID 25322)
-- Name: master_division master_division_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_division
    ADD CONSTRAINT master_division_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3824 (class 2606 OID 25327)
-- Name: master_employee master_employee_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_employee
    ADD CONSTRAINT master_employee_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.master_division(id);


--
-- TOC entry 3825 (class 2606 OID 25332)
-- Name: master_employee master_employee_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_employee
    ADD CONSTRAINT master_employee_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3826 (class 2606 OID 25337)
-- Name: master_item master_item_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_item
    ADD CONSTRAINT master_item_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3827 (class 2606 OID 25342)
-- Name: master_menu master_menu_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_menu
    ADD CONSTRAINT master_menu_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.master_menu(id);


--
-- TOC entry 3828 (class 2606 OID 25347)
-- Name: master_menu master_menu_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_menu
    ADD CONSTRAINT master_menu_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3829 (class 2606 OID 25352)
-- Name: master_office master_office_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office
    ADD CONSTRAINT master_office_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3830 (class 2606 OID 25357)
-- Name: master_office master_office_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_office
    ADD CONSTRAINT master_office_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.master_zone(id);


--
-- TOC entry 3831 (class 2606 OID 25362)
-- Name: master_permission master_permission_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_permission
    ADD CONSTRAINT master_permission_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3832 (class 2606 OID 25367)
-- Name: master_product master_product_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product
    ADD CONSTRAINT master_product_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.master_product_category(id);


--
-- TOC entry 3834 (class 2606 OID 25372)
-- Name: master_product_category master_product_category_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product_category
    ADD CONSTRAINT master_product_category_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3833 (class 2606 OID 25377)
-- Name: master_product master_product_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_product
    ADD CONSTRAINT master_product_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3835 (class 2606 OID 25382)
-- Name: master_region master_region_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_region
    ADD CONSTRAINT master_region_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3836 (class 2606 OID 25387)
-- Name: master_role master_role_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_role
    ADD CONSTRAINT master_role_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3837 (class 2606 OID 25392)
-- Name: master_supplier master_supplier_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_supplier
    ADD CONSTRAINT master_supplier_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3838 (class 2606 OID 25397)
-- Name: master_user_menu master_user_menu_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_user_menu
    ADD CONSTRAINT master_user_menu_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.master_menu(id);


--
-- TOC entry 3839 (class 2606 OID 25402)
-- Name: master_zone master_zone_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_zone
    ADD CONSTRAINT master_zone_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.master_region(id);


--
-- TOC entry 3840 (class 2606 OID 25407)
-- Name: master_zone master_zone_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.master_zone
    ADD CONSTRAINT master_zone_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3841 (class 2606 OID 25412)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3842 (class 2606 OID 25417)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.master_product(id);


--
-- TOC entry 3843 (class 2606 OID 25422)
-- Name: order_items order_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3844 (class 2606 OID 32788)
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.master_customer(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3845 (class 2606 OID 25427)
-- Name: orders orders_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_office_id_fkey FOREIGN KEY (office_id) REFERENCES public.master_office(id);


--
-- TOC entry 3846 (class 2606 OID 25432)
-- Name: orders orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3847 (class 2606 OID 25437)
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 3848 (class 2606 OID 25442)
-- Name: payments payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3860 (class 2606 OID 25447)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.master_product(id) ON DELETE CASCADE;


--
-- TOC entry 3861 (class 2606 OID 25452)
-- Name: production_tasks production_tasks_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.master_employee(id);


--
-- TOC entry 3862 (class 2606 OID 25457)
-- Name: production_tasks production_tasks_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 3863 (class 2606 OID 25462)
-- Name: production_tasks production_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.production_tasks
    ADD CONSTRAINT production_tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3864 (class 2606 OID 25467)
-- Name: purchase_order_items purchase_order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.master_item(id);


--
-- TOC entry 3865 (class 2606 OID 25472)
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3866 (class 2606 OID 25477)
-- Name: purchase_order_items purchase_order_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3867 (class 2606 OID 25482)
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.master_supplier(id);


--
-- TOC entry 3868 (class 2606 OID 25487)
-- Name: purchase_orders purchase_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3869 (class 2606 OID 25492)
-- Name: role_menus role_menus_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_menus
    ADD CONSTRAINT role_menus_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.master_menu(id);


--
-- TOC entry 3870 (class 2606 OID 25497)
-- Name: role_menus role_menus_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_menus
    ADD CONSTRAINT role_menus_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.master_role(id);


--
-- TOC entry 3871 (class 2606 OID 25502)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.master_permission(id);


--
-- TOC entry 3872 (class 2606 OID 25507)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.master_role(id);


--
-- TOC entry 3873 (class 2606 OID 25512)
-- Name: sales_invoices sales_invoices_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3874 (class 2606 OID 25517)
-- Name: sales_invoices sales_invoices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_invoices
    ADD CONSTRAINT sales_invoices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3875 (class 2606 OID 25522)
-- Name: sales_payments sales_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_payments
    ADD CONSTRAINT sales_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales_invoices(id);


--
-- TOC entry 3876 (class 2606 OID 25527)
-- Name: sales_payments sales_payments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.sales_payments
    ADD CONSTRAINT sales_payments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3878 (class 2606 OID 25532)
-- Name: stock_opname_detail stock_opname_detail_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname_detail
    ADD CONSTRAINT stock_opname_detail_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.master_item(id);


--
-- TOC entry 3879 (class 2606 OID 25537)
-- Name: stock_opname_detail stock_opname_detail_stock_opname_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname_detail
    ADD CONSTRAINT stock_opname_detail_stock_opname_id_fkey FOREIGN KEY (stock_opname_id) REFERENCES public.stock_opname(id) ON DELETE CASCADE;


--
-- TOC entry 3880 (class 2606 OID 25542)
-- Name: stock_opname_detail stock_opname_detail_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname_detail
    ADD CONSTRAINT stock_opname_detail_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3877 (class 2606 OID 25547)
-- Name: stock_opname stock_opname_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.stock_opname
    ADD CONSTRAINT stock_opname_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3881 (class 2606 OID 25552)
-- Name: task_history task_history_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.master_employee(id);


--
-- TOC entry 3882 (class 2606 OID 25557)
-- Name: task_history task_history_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.production_tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3883 (class 2606 OID 25562)
-- Name: task_history task_history_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.task_history
    ADD CONSTRAINT task_history_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3884 (class 2606 OID 25567)
-- Name: transaction_categories transaction_categories_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.transaction_categories
    ADD CONSTRAINT transaction_categories_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3885 (class 2606 OID 25572)
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3886 (class 2606 OID 25577)
-- Name: work_order_items work_order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.master_item(id);


--
-- TOC entry 3887 (class 2606 OID 25582)
-- Name: work_order_items work_order_items_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3888 (class 2606 OID 25587)
-- Name: work_order_items work_order_items_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_items
    ADD CONSTRAINT work_order_items_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3889 (class 2606 OID 25592)
-- Name: work_order_tasks work_order_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_tasks
    ADD CONSTRAINT work_order_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.master_employee(id);


--
-- TOC entry 3890 (class 2606 OID 25597)
-- Name: work_order_tasks work_order_tasks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_tasks
    ADD CONSTRAINT work_order_tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


--
-- TOC entry 3891 (class 2606 OID 25602)
-- Name: work_order_tasks work_order_tasks_work_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_order_tasks
    ADD CONSTRAINT work_order_tasks_work_order_id_fkey FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- TOC entry 3892 (class 2606 OID 25607)
-- Name: work_orders work_orders_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.master_employee(id);


--
-- TOC entry 3893 (class 2606 OID 25612)
-- Name: work_orders work_orders_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3894 (class 2606 OID 25617)
-- Name: work_orders work_orders_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zentra_api_admin
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.master_tenant(id);


-- Completed on 2025-05-24 10:13:54 UTC

--
-- PostgreSQL database dump complete
--

