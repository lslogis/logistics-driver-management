--
-- PostgreSQL database dump
--

\restrict RKGtClmhYaTrF691BbzRRHAsP89hfrvJOL0nanIL8hwcYCBxkNrq6efPt9KiRXQ

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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

DROP DATABASE IF EXISTS logistics;
--
-- Name: logistics; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE logistics WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE logistics OWNER TO postgres;

\unrestrict RKGtClmhYaTrF691BbzRRHAsP89hfrvJOL0nanIL8hwcYCBxkNrq6efPt9KiRXQ
\connect logistics
\restrict RKGtClmhYaTrF691BbzRRHAsP89hfrvJOL0nanIL8hwcYCBxkNrq6efPt9KiRXQ

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'IMPORT',
    'EXPORT',
    'CONFIRM',
    'ACTIVATE',
    'DEACTIVATE',
    'LOGIN',
    'LOGOUT'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- Name: ContractType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContractType" AS ENUM (
    'FIXED_DAILY',
    'FIXED_MONTHLY',
    'CONSIGNED_MONTHLY',
    'CHARTER_PER_RIDE'
);


ALTER TYPE public."ContractType" OWNER TO postgres;

--
-- Name: FareType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FareType" AS ENUM (
    'BASIC',
    'STOP_FEE'
);


ALTER TYPE public."FareType" OWNER TO postgres;

--
-- Name: SettlementItemType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SettlementItemType" AS ENUM (
    'TRIP',
    'DEDUCTION',
    'ADDITION',
    'ADJUSTMENT'
);


ALTER TYPE public."SettlementItemType" OWNER TO postgres;

--
-- Name: SettlementStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SettlementStatus" AS ENUM (
    'DRAFT',
    'CONFIRMED',
    'PAID'
);


ALTER TYPE public."SettlementStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'DISPATCHER',
    'ACCOUNTANT'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    "userName" text NOT NULL,
    action public."AuditAction" NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    changes jsonb,
    metadata jsonb,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: center_fares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.center_fares (
    id text NOT NULL,
    "vehicleType" text NOT NULL,
    region text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "fareType" public."FareType" NOT NULL,
    "baseFare" integer,
    "extraStopFee" integer,
    "extraRegionFee" integer,
    "centerName" text NOT NULL,
    CONSTRAINT chk_region_by_fare_type CHECK (((("fareType" = 'BASIC'::public."FareType") AND (region IS NOT NULL) AND (btrim(region) <> ''::text)) OR (("fareType" = 'STOP_FEE'::public."FareType") AND (region IS NULL))))
);


ALTER TABLE public.center_fares OWNER TO postgres;

--
-- Name: centers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.centers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(200),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.centers OWNER TO postgres;

--
-- Name: centers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.centers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.centers_id_seq OWNER TO postgres;

--
-- Name: centers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.centers_id_seq OWNED BY public.centers.id;


--
-- Name: charter_destinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charter_destinations (
    id text NOT NULL,
    "requestId" text NOT NULL,
    region text NOT NULL,
    "order" integer NOT NULL
);


ALTER TABLE public.charter_destinations OWNER TO postgres;

--
-- Name: charter_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charter_requests (
    id text NOT NULL,
    "centerId" text NOT NULL,
    "vehicleType" text NOT NULL,
    date date NOT NULL,
    "isNegotiated" boolean DEFAULT false NOT NULL,
    "negotiatedFare" integer,
    "baseFare" integer,
    "regionFare" integer,
    "stopFare" integer,
    "extraFare" integer,
    "totalFare" integer NOT NULL,
    "driverId" text NOT NULL,
    "driverFare" integer NOT NULL,
    notes text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.charter_requests OWNER TO postgres;

--
-- Name: dispatches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dispatches (
    id text NOT NULL,
    "requestId" text NOT NULL,
    "driverId" text,
    "driverName" text NOT NULL,
    "driverPhone" text NOT NULL,
    "driverVehicle" text NOT NULL,
    "deliveryTime" text,
    "driverFee" integer NOT NULL,
    "driverNotes" text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.dispatches OWNER TO postgres;

--
-- Name: drivers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "businessNumber" text,
    "bankName" text,
    "accountNumber" text,
    remarks text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "vehicleNumber" text NOT NULL,
    "businessName" text,
    representative text
);


ALTER TABLE public.drivers OWNER TO postgres;

--
-- Name: fixed_contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fixed_contracts (
    id text NOT NULL,
    "driverId" text,
    "loadingPointId" text NOT NULL,
    "routeName" text NOT NULL,
    "centerContractType" public."ContractType" NOT NULL,
    "driverContractType" public."ContractType",
    "centerAmount" numeric(12,2) NOT NULL,
    "driverAmount" numeric(12,2),
    "operatingDays" integer[],
    "startDate" date,
    "specialConditions" text,
    remarks text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "createdBy" text,
    "endDate" date
);


ALTER TABLE public.fixed_contracts OWNER TO postgres;

--
-- Name: loading_points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loading_points (
    id text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "centerName" text NOT NULL,
    "loadingPointName" text NOT NULL,
    "lotAddress" text,
    "roadAddress" text,
    manager1 text,
    manager2 text,
    phone1 text,
    phone2 text,
    remarks text
);


ALTER TABLE public.loading_points OWNER TO postgres;

--
-- Name: region_aliases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.region_aliases (
    id text NOT NULL,
    "rawText" text NOT NULL,
    "normalizedText" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.region_aliases OWNER TO postgres;

--
-- Name: requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requests (
    id text NOT NULL,
    "requestDate" date NOT NULL,
    "centerCarNo" character varying(50) NOT NULL,
    "vehicleTon" numeric(3,1) NOT NULL,
    regions jsonb NOT NULL,
    stops integer NOT NULL,
    notes text,
    "extraAdjustment" integer DEFAULT 0 NOT NULL,
    "adjustmentReason" text,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "createdBy" text,
    center_id integer NOT NULL
);


ALTER TABLE public.requests OWNER TO postgres;

--
-- Name: route_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.route_templates (
    id text NOT NULL,
    name text NOT NULL,
    "loadingPoint" text NOT NULL,
    distance double precision,
    "driverFare" numeric(12,2) NOT NULL,
    "billingFare" numeric(12,2) NOT NULL,
    "weekdayPattern" integer[],
    "defaultDriverId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "loadingPointId" text
);


ALTER TABLE public.route_templates OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settlement_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlement_items (
    id text NOT NULL,
    "settlementId" text NOT NULL,
    type public."SettlementItemType" NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    date date NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.settlement_items OWNER TO postgres;

--
-- Name: settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settlements (
    id text NOT NULL,
    "yearMonth" text NOT NULL,
    "driverId" text NOT NULL,
    status public."SettlementStatus" DEFAULT 'DRAFT'::public."SettlementStatus" NOT NULL,
    "totalTrips" integer DEFAULT 0 NOT NULL,
    "totalBaseFare" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalDeductions" numeric(12,2) DEFAULT 0 NOT NULL,
    "totalAdditions" numeric(12,2) DEFAULT 0 NOT NULL,
    "finalAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    "confirmedAt" timestamp(6) with time zone,
    "confirmedBy" text,
    "paidAt" timestamp(6) with time zone,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "createdBy" text
);


ALTER TABLE public.settlements OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text,
    role public."UserRole" DEFAULT 'DISPATCHER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(6) with time zone NOT NULL,
    "lastLogin" timestamp(6) with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verificationtokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verificationtokens (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.verificationtokens OWNER TO postgres;

--
-- Name: centers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.centers ALTER COLUMN id SET DEFAULT nextval('public.centers_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
baee9176-0e1b-4ca8-8c4f-45d81ea83df3	f62481041f2dedc15c647b3db5a86e83fe475e0d6d7e1d7814cafaced463ff0d	2025-09-16 06:22:58.506914+09	20250910032616_initial_schema_db001		\N	2025-09-16 06:22:58.506914+09	0
861138b7-7c2e-44b2-8117-758c6558ec74	89a124bb25b2b0c9f8960215df54da076f050324e88c3ea08c7457d3dee851da	2025-09-16 06:23:14.117011+09	20250911000000_update_driver_schema_to_9_columns		\N	2025-09-16 06:23:14.117011+09	0
96e1badd-80b0-4232-baa3-0c3142578130	d9c120aa145c1ab69157740d6a416d1936be156a600e9aa97f326ef889bf8d53	2025-09-16 06:23:23.042327+09	20250912000105_add_loading_points		\N	2025-09-16 06:23:23.042327+09	0
5812bd86-4788-4eff-8610-634334ba5bb4	4bf9cafd04ea3b0cc874cd43cdc3e91bf09540e0fa6eba11f2766b07b2585df0	2025-09-16 06:23:25.180272+09	20250912100000_update_loading_point_fields		\N	2025-09-16 06:23:25.180272+09	0
308c3bc6-b92e-4700-aac7-d62961a3c479	34c02aa066efb6db7611aa1a6d984a5f20024c9619fa32a015ea52af8a89cba0	2025-09-16 06:23:27.247732+09	20250912132216_add_remarks_to_loading_points		\N	2025-09-16 06:23:27.247732+09	0
157bbc4a-dcfc-427f-b50d-520fc44a744c	ccf8fa40d3102c26ecbb409ebee3457b3ab107be170b4bde81470e10529631ae	2025-09-16 06:23:29.322873+09	20250912200000_add_fixed_routes		\N	2025-09-16 06:23:29.322873+09	0
d02ad0a6-e576-4e9c-93e1-eb933e16896c	87d0fb74cf702af01023603b9f1a23c7aa684845d76b07c9151c8cded093c733	2025-09-16 06:25:07.903077+09	20250913201934_add_rate_calculation_system		\N	2025-09-16 06:25:07.903077+09	0
06943c16-1cf0-477c-a510-55e7fa875686	8517a13fa1366d52c10a8bef7f45cf6b4302f2da4dc6910f113afd6226ad652c	2025-09-16 06:25:11.062011+09	20250914024234_add_center_id_to_trips_and_optional_driver_vehicle		\N	2025-09-16 06:25:11.062011+09	0
f75ea000-90bc-4320-bb92-fbf255ff0759	ea7fd107e053f5c8f84f9146ff19b913583dab242aab0b31dc81906fa0d9c8ff	2025-09-16 06:25:14.07553+09	20250914091334_rates_two_tables		\N	2025-09-16 06:25:14.07553+09	0
3704e38b-2626-4000-a64c-debfee12cc7b	5c1e84efeed6badf60c1f1e37cc6bdfe04f893f941a4e00080fdbaddd4c3e2af	2025-09-16 06:25:17.229469+09	20250914102935_remove_vehicle_system		\N	2025-09-16 06:25:17.229469+09	0
932e87cb-0f68-40bc-83d7-81bc217c43f8	e8249699880f1af9587b9cb39aad9e11a4c7fa474af6cbd0794c1d4b61f0abb8	2025-09-16 06:25:20.341338+09	20250914120443_remove_route_template_and_custom_route		\N	2025-09-16 06:25:20.341338+09	0
45716d3e-b564-43aa-87d5-da17cfafe579	df0f9e44d4abc5fe3607a82b459a8a0b45f2a08fa80d638896c330facdc73ba2	2025-09-16 06:25:23.479741+09	20250914213000_add_vehicle_number_total_stops_remove_operation_date		\N	2025-09-16 06:25:23.479741+09	0
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "userId", "userName", action, "entityType", "entityId", changes, metadata, "createdAt") FROM stdin;
cmfl4b8mk001jyjgf2fmkmd8i	cmfkappr50000erc0bzin67q5	관리자	DEACTIVATE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"after": {"isActive": false}, "before": {"isActive": true}}	{"source": "web_api"}	2025-09-15 21:46:17.708+09
cmfl4goyz001pyjgfvgqsgr9c	cmfkappr50000erc0bzin67q5	관리자	ACTIVATE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"after": {"isActive": true}, "before": {"isActive": false}}	{"source": "web_api"}	2025-09-15 21:50:32.171+09
cmfkrcveh00016hl1axvutkcy	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T06:43:38.873Z", "userAgent": "Unknown"}	\N	2025-09-15 15:43:38.874+09
cmfkv6fka00036hl1mxvs9lql	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T08:30:36.862Z"}	\N	2025-09-15 17:30:36.864+09
cmfkvnkhf00056hl1czx85po6	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T08:43:56.402Z", "userAgent": "Unknown"}	\N	2025-09-15 17:43:56.404+09
cmfkvnz5a00076hl1reya95ne	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T08:44:15.405Z"}	\N	2025-09-15 17:44:15.406+09
cmfkwgesx0001j08zpw79z8ox	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:06:22.064Z", "userAgent": "Unknown"}	\N	2025-09-15 18:06:22.065+09
cmfkwrpwo0001o8gto17trszy	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T09:15:09.671Z"}	\N	2025-09-15 18:15:09.672+09
cmfkwrwts0003o8gtorkias5x	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:15:18.640Z", "userAgent": "Unknown"}	\N	2025-09-15 18:15:18.641+09
cmfkx258s0005o8gtz9iwsp3h	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T09:23:16.107Z"}	\N	2025-09-15 18:23:16.109+09
cmfkx2glt0007o8gtw3kostxb	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:23:30.832Z", "userAgent": "Unknown"}	\N	2025-09-15 18:23:30.833+09
cmfkxejv80001cnjwnw3atdlp	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:32:54.931Z", "userAgent": "Unknown"}	\N	2025-09-15 18:32:54.932+09
cmfkxz09p0001q1ao2fvc67p0	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T09:48:49.307Z"}	\N	2025-09-15 18:48:49.309+09
cmfkxz7qv0003q1aopixmo7is	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:48:58.998Z", "userAgent": "Unknown"}	\N	2025-09-15 18:48:58.999+09
cmfky87j30001lxq5tmh1hhup	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T09:55:58.621Z"}	\N	2025-09-15 18:55:58.623+09
cmfky8w9z0003lxq56cqu3yp3	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T09:56:30.693Z", "userAgent": "Unknown"}	\N	2025-09-15 18:56:30.695+09
cmfkyfd3n0001jko95ekxj2cl	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T10:01:32.352Z"}	\N	2025-09-15 19:01:32.434+09
cmfkyfsyl0003jko9ilu7gkr5	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T10:01:52.989Z", "userAgent": "Unknown"}	\N	2025-09-15 19:01:52.99+09
cmfkyul9q00024ueyphwviy9v	cmfkappr50000erc0bzin67q5	관리자	CREATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"created": {"driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 19:13:22.863+09
cmfl0dlw3000111bwd8igm0ia	cmfkappr50000erc0bzin67q5	관리자	UPDATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"after": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-15", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "before": {"id": "cmfkyul9d00004ueyi34cjyru", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T10:13:22.850Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": null, "updatedAt": "2025-09-15T10:13:22.850Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "changes": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-15", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 19:56:09.747+09
cmflx59ib000ahjvejwphn0jo	cmfkappr50000erc0bzin67q5	관리자	DELETE	CharterRequest	cmflmxrlm002yhas85xcvzq8g	{"deleted": {"id": "cmflmxrlm002yhas85xcvzq8g", "date": "2025-09-16T00:00:00.000Z", "notes": "샘플 용차 요청 3", "center": {"id": "cmflmw0au0002hf5diljy4sbw", "centerName": "대구센터"}, "driver": {"id": "cmflmxrl2002qhas8r4d697wk", "name": "박기사", "phone": "010-5555-1234", "vehicleNumber": "대구56다9012"}, "creator": null, "baseFare": 120000, "centerId": "cmflmw0au0002hf5diljy4sbw", "driverId": "cmflmxrl2002qhas8r4d697wk", "stopFare": 0, "createdAt": "2025-09-15T21:27:41.818Z", "createdBy": null, "extraFare": 0, "totalFare": 120000, "updatedAt": "2025-09-15T21:27:41.818Z", "driverFare": 102000, "regionFare": 0, "vehicleType": "2.5톤", "destinations": [{"id": "cmflmxrlm002zhas8d6wtwho9", "order": 1, "region": "서울", "requestId": "cmflmxrlm002yhas85xcvzq8g"}], "isNegotiated": false, "negotiatedFare": null}}	{"source": "web_api"}	2025-09-16 11:13:27.779+09
cmfl0sndv0001iosec21ypcq1	cmfkappr50000erc0bzin67q5	관리자	UPDATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"after": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "before": {"id": "cmfkyul9d00004ueyi34cjyru", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T10:13:22.850Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-09-15T00:00:00.000Z", "updatedAt": "2025-09-15T10:56:09.729Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "changes": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 20:07:51.523+09
cmfl10jes0003iose2crwdqp1	cmfkappr50000erc0bzin67q5	관리자	UPDATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"after": {"remarks": "1", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "before": {"id": "cmfkyul9d00004ueyi34cjyru", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T10:13:22.850Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-09-01T00:00:00.000Z", "updatedAt": "2025-09-15T11:07:51.509Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "changes": {"remarks": "1", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 20:13:59.621+09
cmfl10oj10005iose928peujr	cmfkappr50000erc0bzin67q5	관리자	UPDATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"after": {"remarks": "2", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "1", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "before": {"id": "cmfkyul9d00004ueyi34cjyru", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": "1", "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T10:13:22.850Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-09-01T00:00:00.000Z", "updatedAt": "2025-09-15T11:13:59.609Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "changes": {"remarks": "2", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "1", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 20:14:06.254+09
cmfl54r5i001zyjgf4723iem7	cmfkappr50000erc0bzin67q5	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-15T13:09:14.741Z"}	\N	2025-09-15 22:09:14.742+09
cmflq8a370001ubnn4tvqbxzy	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T22:59:51.186Z", "userAgent": "Unknown"}	\N	2025-09-16 07:59:51.188+09
cmfls8ami0001xj3oqmpifkcl	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-15T23:55:51.113Z", "userAgent": "Unknown"}	\N	2025-09-16 08:55:51.114+09
cmfm72f09000r2rbfa46w15y8	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrl2002qhas8r4d697wk	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:51:11.097+09
cmfl168qr0007iosew78pohwc	cmfkappr50000erc0bzin67q5	관리자	UPDATE	FixedContract	cmfkyul9d00004ueyi34cjyru	{"after": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "before": {"id": "cmfkyul9d00004ueyi34cjyru", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": "2", "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T10:13:22.850Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-09-01T00:00:00.000Z", "updatedAt": "2025-09-15T11:14:06.240Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "1", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}, "changes": {"remarks": "", "driverId": "cmfkaxjiy000610845ncrvwdr", "routeName": "마트킹", "startDate": "2025-09-01", "centerAmount": 180000, "driverAmount": 160000, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": "", "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 20:18:25.731+09
cmfl4g1sz001lyjgfq9thsfhl	cmfkappr50000erc0bzin67q5	관리자	DELETE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"deleted": {"id": "cmfl48fyb0019yjgf39fkikev", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": false, "createdAt": "2025-09-15T12:44:07.236Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-08-31T00:00:00.000Z", "updatedAt": "2025-09-15T12:46:17.697Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 21:50:02.147+09
cmfl4g1t0001nyjgf232qi1fm	cmfkappr50000erc0bzin67q5	관리자	DELETE	FixedContract	cmfl48fsw0001yjgfqm7zvl9b	{"deleted": {"id": "cmfl48fsw0001yjgfqm7zvl9b", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": true, "createdAt": "2025-09-15T12:44:07.039Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-08-31T00:00:00.000Z", "updatedAt": "2025-09-15T12:44:07.039Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 21:50:02.149+09
cmfl4gt1j001ryjgfrym7z6kw	cmfkappr50000erc0bzin67q5	관리자	DEACTIVATE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"after": {"isActive": false}, "before": {"isActive": true}}	{"source": "web_api"}	2025-09-15 21:50:37.448+09
cmfl4gw1l001tyjgfbz6fkcyx	cmfkappr50000erc0bzin67q5	관리자	DELETE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"deleted": {"id": "cmfl48fyb0019yjgf39fkikev", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": false, "createdAt": "2025-09-15T12:44:07.236Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-08-31T00:00:00.000Z", "updatedAt": "2025-09-15T12:50:37.440Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 21:50:41.337+09
cmfl4icdk001vyjgfxng1jnzu	cmfkappr50000erc0bzin67q5	관리자	DELETE	FixedContract	cmfl48fyb0019yjgf39fkikev	{"deleted": {"id": "cmfl48fyb0019yjgf39fkikev", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": false, "createdAt": "2025-09-15T12:44:07.236Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-08-31T00:00:00.000Z", "updatedAt": "2025-09-15T12:50:41.333Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 21:51:49.16+09
cmfl4if03001xyjgfwhcldz98	cmfkappr50000erc0bzin67q5	관리자	DELETE	FixedContract	cmfl48fsw0001yjgfqm7zvl9b	{"deleted": {"id": "cmfl48fsw0001yjgfqm7zvl9b", "driver": {"id": "cmfkaxjiy000610845ncrvwdr", "name": "권수범", "phone": "01090383870", "vehicleNumber": "경기87바6141"}, "creator": {"id": "cmfkappr50000erc0bzin67q4", "name": "관리자"}, "remarks": null, "driverId": "cmfkaxjiy000610845ncrvwdr", "isActive": false, "createdAt": "2025-09-15T12:44:07.039Z", "createdBy": "cmfkappr50000erc0bzin67q4", "routeName": "마트킹", "startDate": "2025-08-31T00:00:00.000Z", "updatedAt": "2025-09-15T12:50:02.141Z", "centerAmount": 180000.0, "driverAmount": 160000.0, "loadingPoint": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "operatingDays": [1, 2, 3, 4, 5, 6], "loadingPointId": "cmfkay8os002g1084028wodiv", "specialConditions": null, "centerContractType": "FIXED_DAILY", "driverContractType": "FIXED_DAILY"}}	{"source": "web_api"}	2025-09-15 21:51:52.563+09
cmflwjip10006hjvemb7njk6e	cmfkappr50000erc0bzin67q5	관리자	CREATE	CharterRequest	cmflwjioc0002hjveah43t305	{"created": {"date": "2025-09-16T00:00:00.000Z", "notes": "", "baseFare": 0, "centerId": "cmfkay8os002g1084028wodiv", "driverId": "cmflmxrl2002qhas8r4d697wk", "stopFare": 0, "extraFare": 0, "totalFare": 0, "driverFare": 0, "regionFare": 0, "vehicleType": "TRUCK_1T", "destinations": [{"order": 1, "region": "남양주"}, {"order": 2, "region": "강남"}], "isNegotiated": false}}	{"source": "web_api"}	2025-09-16 10:56:33.253+09
cmflx5ipu000chjve6oxk12ca	cmfkappr50000erc0bzin67q5	관리자	DELETE	CharterRequest	cmflmxrlh002vhas8w1n88cj5	{"deleted": {"id": "cmflmxrlh002vhas8w1n88cj5", "date": "2025-09-16T00:00:00.000Z", "notes": "샘플 용차 요청 2", "center": {"id": "cmflmw0ap0001hf5ddat96ln0", "centerName": "부산센터"}, "driver": {"id": "cmflmxrky002phas8ds0ps8ke", "name": "이기사", "phone": "010-9876-5432", "vehicleNumber": "부산34나5678"}, "creator": null, "baseFare": 176000, "centerId": "cmflmw0ap0001hf5ddat96ln0", "driverId": "cmflmxrky002phas8ds0ps8ke", "stopFare": 0, "createdAt": "2025-09-15T21:27:41.813Z", "createdBy": null, "extraFare": 0, "totalFare": 176000, "updatedAt": "2025-09-15T21:27:41.813Z", "driverFare": 149600, "regionFare": 0, "vehicleType": "5톤", "destinations": [{"id": "cmflmxrlh002whas8e17nzu2y", "order": 1, "region": "서울", "requestId": "cmflmxrlh002vhas8w1n88cj5"}], "isNegotiated": false, "negotiatedFare": null}}	{"source": "web_api"}	2025-09-16 11:13:39.714+09
cmfm3fzqj000113r7n5tpnf23	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-16T05:09:46.026Z", "userAgent": "Unknown"}	\N	2025-09-16 14:09:46.027+09
cmfm3n9hj000713r7m49t8xdb	cmfkappr50000erc0bzin67q5	관리자	CREATE	CharterRequest	cmfm3n9gt000413r7felbbrr8	{"created": {"date": "2025-09-16T00:00:00.000Z", "notes": "", "baseFare": 0, "centerId": "cmfkay8ov002h1084qprpwjfi", "driverId": "cmflmxrl2002qhas8r4d697wk", "stopFare": 0, "extraFare": 0, "totalFare": 0, "driverFare": 0, "regionFare": 0, "vehicleType": "TRUCK_1T", "destinations": [{"order": 1, "region": "남양주"}], "isNegotiated": false}}	{"source": "web_api"}	2025-09-16 14:15:25.255+09
cmfm6yjix00012rbfpbll498h	cmfkappr50000erc0bzin67q5	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-16T06:48:10.328Z", "userAgent": "Unknown"}	\N	2025-09-16 15:48:10.33+09
cmfm70xyx00032rbfxv7dq2ao	cmfkappr50000erc0bzin67q5	관리자2	LOGIN	User	cmfkappr50000erc0bzin67q5	{"loginTime": "2025-09-16T06:50:02.359Z", "userAgent": "Unknown"}	\N	2025-09-16 15:50:02.361+09
cmfm71chm00052rbfhqlgb6ii	cmfkappr50000erc0bzin67q4	관리자	DELETE	CharterRequest	cmflmxrl6002shas81eb88h7t	{"deleted": {"id": "cmflmxrl6002shas81eb88h7t", "date": "2025-09-16T00:00:00.000Z", "notes": "샘플 용차 요청 1", "center": {"id": "cmflmw0ai0000hf5djyc0zrop", "centerName": "서울센터"}, "driver": {"id": "cmflmxrks002ohas87352bpgu", "name": "김기사", "phone": "010-1234-5678", "vehicleNumber": "서울12가1234"}, "creator": null, "baseFare": 144000, "centerId": "cmflmw0ai0000hf5djyc0zrop", "driverId": "cmflmxrks002ohas87352bpgu", "stopFare": 0, "createdAt": "2025-09-15T21:27:41.803Z", "createdBy": null, "extraFare": 0, "totalFare": 144000, "updatedAt": "2025-09-15T21:27:41.803Z", "driverFare": 122400, "regionFare": 0, "vehicleType": "3.5톤", "destinations": [{"id": "cmflmxrl6002thas8osetsj4o", "order": 1, "region": "서울", "requestId": "cmflmxrl6002shas81eb88h7t"}], "isNegotiated": false, "negotiatedFare": null}}	{"source": "web_api"}	2025-09-16 15:50:21.178+09
cmfm71ked00072rbf3e06ryln	cmfkappr50000erc0bzin67q4	관리자	DELETE	LoadingPoint	cmflmw0au0002hf5diljy4sbw,cmflmw0ap0001hf5ddat96ln0,cmflmw0ai0000hf5djyc0zrop	{"count": 3, "action": "delete"}	{"bulk": true, "source": "web_api", "hard_delete": true}	2025-09-16 15:50:31.43+09
cmfm71w0q000d2rbfo9gl8vp1	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrks002ohas87352bpgu	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:46.49+09
cmfm71w0q000c2rbfsuw9term	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrky002phas8ds0ps8ke	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:46.49+09
cmfm71w0q000b2rbf907lqy0o	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrl2002qhas8r4d697wk	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:46.49+09
cmfm71xao000i2rbfl02fvqbl	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrky002phas8ds0ps8ke	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:48.143+09
cmfm71xao000h2rbftqj4w9nt	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrks002ohas87352bpgu	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:48.144+09
cmfm71xao000j2rbfcx5i2y9k	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrl2002qhas8r4d697wk	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:50:48.144+09
cmfm7273y000l2rbfktxmyxiq	cmfkappr50000erc0bzin67q4	관리자	DELETE	CharterRequest	cmfm3n9gt000413r7felbbrr8	{"deleted": {"id": "cmfm3n9gt000413r7felbbrr8", "date": "2025-09-16T00:00:00.000Z", "notes": "", "center": {"id": "cmfkay8ov002h1084qprpwjfi", "centerName": "동원백암"}, "driver": {"id": "cmflmxrl2002qhas8r4d697wk", "name": "박기사", "phone": "010-5555-1234", "vehicleNumber": "대구56다9012"}, "creator": {"id": "cmfkappr50000erc0bzin67q5", "name": "관리자2"}, "baseFare": 0, "centerId": "cmfkay8ov002h1084qprpwjfi", "driverId": "cmflmxrl2002qhas8r4d697wk", "stopFare": 0, "createdAt": "2025-09-16T05:15:25.229Z", "createdBy": "cmfkappr50000erc0bzin67q5", "extraFare": 0, "totalFare": 0, "updatedAt": "2025-09-16T05:15:25.229Z", "driverFare": 0, "regionFare": 0, "vehicleType": "TRUCK_1T", "destinations": [{"id": "cmfm3n9h0000513r7njp0uri6", "order": 1, "region": "남양주", "requestId": "cmfm3n9gt000413r7felbbrr8"}], "isNegotiated": false, "negotiatedFare": null}}	{"source": "web_api"}	2025-09-16 15:51:00.862+09
cmfm729ez000n2rbf0v21oz9c	cmfkappr50000erc0bzin67q4	관리자	DELETE	CharterRequest	cmflwjioc0002hjveah43t305	{"deleted": {"id": "cmflwjioc0002hjveah43t305", "date": "2025-09-16T00:00:00.000Z", "notes": "", "center": {"id": "cmfkay8os002g1084028wodiv", "centerName": "동원백암"}, "driver": {"id": "cmflmxrl2002qhas8r4d697wk", "name": "박기사", "phone": "010-5555-1234", "vehicleNumber": "대구56다9012"}, "creator": {"id": "cmfkappr50000erc0bzin67q5", "name": "관리자2"}, "baseFare": 0, "centerId": "cmfkay8os002g1084028wodiv", "driverId": "cmflmxrl2002qhas8r4d697wk", "stopFare": 0, "createdAt": "2025-09-16T01:56:33.229Z", "createdBy": "cmfkappr50000erc0bzin67q5", "extraFare": 0, "totalFare": 0, "updatedAt": "2025-09-16T01:56:33.229Z", "driverFare": 0, "regionFare": 0, "vehicleType": "TRUCK_1T", "destinations": [{"id": "cmflwjiol0003hjvez016i3ap", "order": 1, "region": "남양주", "requestId": "cmflwjioc0002hjveah43t305"}, {"id": "cmflwjiol0004hjvemhaxe9tz", "order": 2, "region": "강남", "requestId": "cmflwjioc0002hjveah43t305"}], "isNegotiated": false, "negotiatedFare": null}}	{"source": "web_api"}	2025-09-16 15:51:03.851+09
cmfm72f09000q2rbfa3ip0gor	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrky002phas8ds0ps8ke	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:51:11.097+09
cmfm72f0a000t2rbfpbs0f61n	cmfkappr50000erc0bzin67q4	관리자	DELETE	Driver	cmflmxrks002ohas87352bpgu	{"deleted": true}	{"source": "bulk_delete"}	2025-09-16 15:51:11.097+09
cmfm79v1z000w2rbf7vbf4xpq	cmfkappr50000erc0bzin67q5	관리자2	CREATE	LoadingPoint	cmfm79uy4000u2rbfe0yc5lgj	{"created": {"phone1": null, "phone2": null, "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": null, "manager2": null, "centerName": "한성로직스(SPC)", "lotAddress": "경기 용인시 처인구 마평동 538", "roadAddress": "경기 용인시 처인구 중부대로1576번길 16", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 15:56:58.487+09
cmfm7i6ra00172rbfkxms4fzy	cmfkappr50000erc0bzin67q5	관리자2	CREATE	LoadingPoint	csv_import	{"mode": "commit", "total": 13, "action": "csv_import", "fileName": "상차지목록.xlsx", "fileSize": 10573, "imported": 8}	{"source": "csv_import", "importStats": {"total": 13, "valid": 8, "invalid": 5, "imported": 8, "duplicates": 5}}	2025-09-16 16:03:26.902+09
cmfm7ijzp00192rbfzjecomdj	cmfkappr50000erc0bzin67q5	관리자2	DELETE	LoadingPoint	cmfm79uy4000u2rbfe0yc5lgj	{"count": 1, "action": "delete"}	{"bulk": true, "source": "web_api", "hard_delete": true}	2025-09-16 16:03:44.054+09
cmfm7iumz001b2rbfs4jwmvby	cmfkappr50000erc0bzin67q5	관리자2	UPDATE	LoadingPoint	cmfm7i6qs000y2rbfaiu4oqit	{"after": {"phone1": "01044711332", "phone2": null, "remarks": null, "manager1": "김연수", "manager2": "-", "centerName": "한성로직스(시판)", "lotAddress": "경기 용인시 처인구 마평동 538", "roadAddress": "경기 용인시 처인구 중부대로1576번길 16", "loadingPointName": "한성로직스"}, "before": {"id": "cmfm7i6qs000y2rbfaiu4oqit", "phone1": "010-4471-1332", "phone2": "-", "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": "김연수", "manager2": "-", "createdAt": "2025-09-16T07:03:26.884Z", "updatedAt": "2025-09-16T07:03:26.884Z", "centerName": "한성로직스(시판)", "lotAddress": "경기 용인시 처인구 마평동 538", "roadAddress": "경기 용인시 처인구 중부대로1576번길 16", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 16:03:57.851+09
cmfm7ize5001d2rbff8sfwb5h	cmfkappr50000erc0bzin67q5	관리자2	UPDATE	LoadingPoint	cmfm7i6qu000z2rbfzkswjou0	{"after": {"phone1": "01082332220", "phone2": null, "remarks": null, "manager1": "오새명", "manager2": null, "centerName": "한성로직스(케이터링)", "lotAddress": "경기 용인시 처인구 마평동 539", "roadAddress": "경기 용인시 처인구 중부대로1576번길 17", "loadingPointName": "한성로직스"}, "before": {"id": "cmfm7i6qu000z2rbfzkswjou0", "phone1": "010-8233-2220", "phone2": null, "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": "오새명", "manager2": null, "createdAt": "2025-09-16T07:03:26.887Z", "updatedAt": "2025-09-16T07:03:26.887Z", "centerName": "한성로직스(케이터링)", "lotAddress": "경기 용인시 처인구 마평동 539", "roadAddress": "경기 용인시 처인구 중부대로1576번길 17", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 16:04:04.013+09
cmfm7jkuo001f2rbfukvq0tq3	cmfkappr50000erc0bzin67q5	관리자2	UPDATE	LoadingPoint	cmfm7i6qw00102rbfoghjrft9	{"after": {"phone1": "01044466679", "phone2": null, "remarks": null, "manager1": "김선우", "manager2": "-", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 540", "roadAddress": "경기 용인시 처인구 중부대로1576번길 18", "loadingPointName": "한성로직스"}, "before": {"id": "cmfm7i6qw00102rbfoghjrft9", "phone1": "010-4446-6679", "phone2": "-", "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": "김선우", "manager2": "-", "createdAt": "2025-09-16T07:03:26.889Z", "updatedAt": "2025-09-16T07:03:26.889Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 540", "roadAddress": "경기 용인시 처인구 중부대로1576번길 18", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 16:04:31.824+09
cmfm7jphj001h2rbfbt8eui4v	cmfkappr50000erc0bzin67q5	관리자2	UPDATE	LoadingPoint	cmfm7i6qy00112rbfr2xu8u7m	{"after": {"phone1": "01044466679", "phone2": null, "remarks": null, "manager1": "김선우", "manager2": "-", "centerName": "한성로직스(상온)", "lotAddress": "경기 용인시 처인구 마평동 541", "roadAddress": "경기 용인시 처인구 중부대로1576번길 19", "loadingPointName": "한성로직스"}, "before": {"id": "cmfm7i6qy00112rbfr2xu8u7m", "phone1": "010-4446-6679", "phone2": "-", "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": "김선우", "manager2": "-", "createdAt": "2025-09-16T07:03:26.890Z", "updatedAt": "2025-09-16T07:03:26.890Z", "centerName": "한성로직스(상온)", "lotAddress": "경기 용인시 처인구 마평동 541", "roadAddress": "경기 용인시 처인구 중부대로1576번길 19", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 16:04:37.831+09
cmfm7kmsr001j2rbf0qd82l7x	cmfkappr50000erc0bzin67q5	관리자2	UPDATE	LoadingPoint	cmfm7i6r000122rbfiuexnska	{"after": {"phone1": "01024758802", "phone2": null, "remarks": "차단기지나 우측파란선따라 올라가면 A5층", "manager1": "김용회", "manager2": "-", "centerName": "한성로직스(이마트)", "lotAddress": "경기 용인시 처인구 마평동 542", "roadAddress": "경기 용인시 처인구 중부대로1576번길 20", "loadingPointName": "한성로직스"}, "before": {"id": "cmfm7i6r000122rbfiuexnska", "phone1": "010-2475-8802", "phone2": "-", "remarks": "담당자 연수한테 물어", "isActive": true, "manager1": "김용회", "manager2": "-", "createdAt": "2025-09-16T07:03:26.892Z", "updatedAt": "2025-09-16T07:03:26.892Z", "centerName": "한성로직스(이마트)", "lotAddress": "경기 용인시 처인구 마평동 542", "roadAddress": "경기 용인시 처인구 중부대로1576번길 20", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-16 16:05:21.002+09
cmfm7sr8e0001ajltctidou2k	cmfkappr50000erc0bzin67q4	관리자	DELETE	LoadingPoint	cmfm7i6r500152rbfytv42qwd,cmfm7i6r300142rbfxqwckp92,cmfm7i6r200132rbfhizojjm4,cmfm7i6r000122rbfiuexnska,cmfm7i6qy00112rbfr2xu8u7m,cmfm7i6qw00102rbfoghjrft9,cmfm7i6qu000z2rbfzkswjou0,cmfm7i6qs000y2rbfaiu4oqit	{"count": 8, "action": "delete"}	{"bulk": true, "source": "web_api", "hard_delete": true}	2025-09-16 16:11:39.998+09
cmfm839st000cajltwi1tufx1	cmfkappr50000erc0bzin67q5	관리자2	CREATE	LoadingPoint	csv_import	{"mode": "commit", "total": 13, "action": "csv_import", "fileName": "상차지목록.xlsx", "fileSize": 10697, "imported": 8}	{"source": "csv_import", "importStats": {"total": 13, "valid": 8, "invalid": 5, "imported": 8, "duplicates": 5}}	2025-09-16 16:19:50.621+09
cmfme3nw20001syjrcrre6hwu	cmfkappr50000erc0bzin67q4	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-16T10:08:06.577Z", "userAgent": "Unknown"}	\N	2025-09-16 19:08:06.578+09
cmfn23v4200028qvnlixckz8e	cmfkappr50000erc0bzin67q4	관리자	CREATE	Driver	cmfn23v3n00008qvn40ivm5gx	{"created": {"name": "김기탁", "phone": "01023070504", "remarks": null, "bankName": null, "isActive": true, "businessName": null, "accountNumber": null, "vehicleNumber": "서울89자8279", "businessNumber": null, "representative": null}}	{"source": "web_api"}	2025-09-17 06:20:06.723+09
cmfn246qo00048qvn750e38kq	cmfkappr50000erc0bzin67q4	관리자	UPDATE	Driver	cmfn23v3n00008qvn40ivm5gx	{"remarks": {"to": "백사 메가 고정", "from": null}}	{"source": "web_api"}	2025-09-17 06:20:21.793+09
cmfn24nhw00078qvn3d7p48xa	cmfkappr50000erc0bzin67q4	관리자	CREATE	Driver	cmfn24nhp00058qvn1igd0hzs	{"created": {"name": "김신범", "phone": "01079210701", "remarks": "백사 메가 고정", "bankName": null, "isActive": true, "businessName": null, "accountNumber": null, "vehicleNumber": "서울85바4960", "businessNumber": null, "representative": null}}	{"source": "web_api"}	2025-09-17 06:20:43.508+09
cmfn2546p000a8qvnw3nl0jyi	cmfkappr50000erc0bzin67q4	관리자	CREATE	Driver	cmfn2546k00088qvn7ng11wb0	{"created": {"name": "여인홍", "phone": "01036289336", "remarks": null, "bankName": null, "isActive": true, "businessName": null, "accountNumber": null, "vehicleNumber": "경기86자5192", "businessNumber": null, "representative": null}}	{"source": "web_api"}	2025-09-17 06:21:05.138+09
cmfn2aehp0001bzkpybrk0d3d	cmfkappr50000erc0bzin67q4	관리자	UPDATE	Driver	cmfkaxjm1002b10844wsfkhh2	{"remarks": {"to": "고정81호(지입) \\n동원티엘에스 (넘버임대료+보험료+기타벌금) 공제", "from": "고정81호(지입)"}, "businessNumber": {"to": "5361102390", "from": "536-11-02390"}}	{"source": "web_api"}	2025-09-17 06:25:11.773+09
cmfn3vyqw0001ju58bzbdbgm4	cmfkappr50000erc0bzin67q4	관리자	LOGOUT	User	cmfkappr50000erc0bzin67q4	{"logoutTime": "2025-09-16T22:09:57.412Z"}	\N	2025-09-17 07:09:57.416+09
cmfn3x0p80001ymzh2j5a8rt5	cmfkappr50000erc0bzin67q4	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-16T22:10:46.603Z", "userAgent": "Unknown"}	\N	2025-09-17 07:10:46.605+09
cmfn5jb110001usw3ehyfyrdr	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": null, "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "manager1": "이민상", "manager2": "-", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "010-9361-2271", "phone2": "-", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "isActive": true, "manager1": "이민상", "manager2": "-", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T07:19:50.612Z", "centerName": "한성로직스(냉동)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-17 07:56:06.038+09
cmfn5jjtx0003usw3o1ee3rqi	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sl0009ajlthrsixzrl	{"after": {"phone1": "01065356837", "phone2": null, "remarks": "차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크", "manager1": "배현수", "manager2": "-", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 544", "roadAddress": "경기 용인시 처인구 중부대로1576번길 22", "loadingPointName": "한성로직스(냉장)"}, "before": {"id": "cmfm839sl0009ajlthrsixzrl", "phone1": "010-6535-6837", "phone2": "-", "remarks": "차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크", "isActive": true, "manager1": "배현수", "manager2": "-", "createdAt": "2025-09-16T07:19:50.614Z", "updatedAt": "2025-09-16T07:19:50.614Z", "centerName": "한성로직스(냉장)", "lotAddress": "경기 용인시 처인구 마평동 544", "roadAddress": "경기 용인시 처인구 중부대로1576번길 22", "loadingPointName": "한성로직스"}}	{"source": "web_api"}	2025-09-17 07:56:17.446+09
cmfn5jzcj0005usw3z5q6wpc0	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": null, "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "manager1": "이민상", "manager2": "-", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "01093612271", "phone2": "", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "isActive": true, "manager1": "이민상", "manager2": "-", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T22:56:06.030Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동)"}}	{"source": "web_api"}	2025-09-17 07:56:37.556+09
cmfn5kfw00007usw37yh0e1rb	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": "01065356837", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "01093612271", "phone2": "", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "isActive": true, "manager1": "이민상", "manager2": "-", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T22:56:37.552Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}}	{"source": "web_api"}	2025-09-17 07:56:58.992+09
cmfn5kju70009usw3tcaesvsl	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": "01065356837", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "01093612271", "phone2": "01065356837", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "isActive": true, "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T22:56:58.989Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}}	{"source": "web_api"}	2025-09-17 07:57:04.111+09
cmfnsl99r00081q5ai45v5pj8	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnsl99n00061q5azi356pem	{"created": {"region": "의정부", "baseFare": 150000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}}	{"source": "web_api"}	2025-09-17 18:41:28.239+09
cmfn5kw79000busw3yf53dqu6	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": "01065356837", "remarks": "냉동 : 차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크\\n\\n냉장 : ", "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "01093612271", "phone2": "01065356837", "remarks": "차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크", "isActive": true, "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T22:57:04.107Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}}	{"source": "web_api"}	2025-09-17 07:57:20.133+09
cmfn5l3yv000dusw32ygiziy9	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfm839sk0008ajlt9yjzmsgr	{"after": {"phone1": "01093612271", "phone2": "01065356837", "remarks": "냉동 : 차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크\\n\\n냉장 : 차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크", "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}, "before": {"id": "cmfm839sk0008ajlt9yjzmsgr", "phone1": "01093612271", "phone2": "01065356837", "remarks": "냉동 : 차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크\\n\\n냉장 : ", "isActive": true, "manager1": "이민상(냉동)", "manager2": "배현수(냉장)", "createdAt": "2025-09-16T07:19:50.612Z", "updatedAt": "2025-09-16T22:57:20.130Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 543", "roadAddress": "경기 용인시 처인구 중부대로1576번길 21", "loadingPointName": "한성로직스(냉동/냉장)"}}	{"source": "web_api"}	2025-09-17 07:57:30.2+09
cmfn5li1x000fusw3lgutw9jl	cmfkappr50000erc0bzin67q4	관리자	DELETE	LoadingPoint	cmfm839sl0009ajlthrsixzrl	{"deleted": {"id": "cmfm839sl0009ajlthrsixzrl", "phone1": "01065356837", "phone2": "", "remarks": "차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크", "isActive": true, "manager1": "배현수", "manager2": "-", "createdAt": "2025-09-16T07:19:50.614Z", "updatedAt": "2025-09-16T22:56:17.442Z", "centerName": "한성로직스(용차)", "lotAddress": "경기 용인시 처인구 마평동 544", "roadAddress": "경기 용인시 처인구 중부대로1576번길 22", "loadingPointName": "한성로직스(냉장)"}}	{"source": "web_api", "soft_delete": true}	2025-09-17 07:57:48.453+09
cmfnocb6i0002kdwmg9slm3fi	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnocb6d0000kdwm1gd434ei	{"created": {"region": "남양주", "baseFare": 120000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 16:42:32.347+09
cmfnocp370005kdwmtai586nb	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnocp330003kdwmu9or9f8z	{"created": {"region": "", "fareType": "STOP_REGION", "centerName": "동원백암", "vehicleType": "vehicle-1ton", "extraStopFee": 7000, "extraRegionFee": 10000}}	{"source": "web_api"}	2025-09-17 16:42:50.371+09
cmfnoxhtw0002mb2hibtyyktd	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnoxhtr0000mb2hooasmtst	{"created": {"region": "강북", "baseFare": 140000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 16:59:00.74+09
cmfnp616l0002svw99rmjtdpf	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnp616g0000svw9mffln4ca	{"created": {"region": "수원", "baseFare": 110000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 17:05:39.069+09
cmfnp8udo0002csb2rbdzci0x	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnp8udk0000csb21hphf0y2	{"created": {"region": "강남", "baseFare": 120000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 17:07:50.22+09
cmfnpdfks0002eifuwb9815x0	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnpdfkp0000eifu17fjhll6	{"created": {"region": "용인", "baseFare": 100000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 17:11:24.316+09
cmfnpe84a0005eifutxxvpc38	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnpe8470003eifuuzmvxnoj	{"created": {"region": "남양주", "baseFare": 140000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1-4ton"}}	{"source": "web_api"}	2025-09-17 17:12:01.306+09
cmfnpzvan0002dwz2lax7egv7	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnpzvaj0000dwz25v3jfxdl	{"created": {"region": "양주", "baseFare": 150000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1ton"}}	{"source": "web_api"}	2025-09-17 17:28:51.12+09
cmfnqvtq70002zqf89n0oc1wo	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnqvtq30000zqf84ewygd5w	{"created": {"region": "강북", "baseFare": 160000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1-4ton"}}	{"source": "web_api"}	2025-09-17 17:53:42.079+09
cmfnqwi4s0005zqf8s6mu2o4m	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnqwi4o0003zqf8gm5x0u2f	{"created": {"region": "양주", "baseFare": 170000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1-4ton"}}	{"source": "web_api"}	2025-09-17 17:54:13.708+09
cmfnr4ytq000259133czx54ut	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnr4ytm00005913mrnokhbz	{"created": {"region": "의정부", "baseFare": 160000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "vehicle-1-4ton"}}	{"source": "web_api"}	2025-09-17 18:00:48.591+09
cmfnr6ghx00011v0jd3gsc6c5	cmfkappr50000erc0bzin67q4	관리자	DELETE	CenterFare	cmfnr4ytm00005913mrnokhbz	{"deleted": {"id": "cmfnr4ytm00005913mrnokhbz", "region": "의정부", "baseFare": 160000, "fareType": "BASIC", "createdAt": "2025-09-17T09:00:48.586Z", "updatedAt": "2025-09-17T09:00:48.586Z", "centerName": "동원백암", "vehicleType": "vehicle-1-4ton", "extraStopFee": null, "extraRegionFee": null}}	{"source": "web_api"}	2025-09-17 18:01:58.149+09
cmfns7zd100021q5aihd8tu2l	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfns7zcx00001q5asubryrbn	{"created": {"region": "남양주", "baseFare": 120000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}}	{"source": "web_api"}	2025-09-17 18:31:08.869+09
cmfnsel5g00051q5auqga0uj1	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnsel5d00031q5a6gj0e4wr	{"created": {"region": "", "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤", "extraStopFee": 7000, "extraRegionFee": 10000}}	{"source": "web_api"}	2025-09-17 18:36:17.044+09
cmfnsllao000b1q5aue9vwnb0	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnsllal00091q5acftlyqho	{"created": {"region": "의정부", "baseFare": 170000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}}	{"source": "web_api"}	2025-09-17 18:41:43.824+09
cmfnsquv30002xz8ld5yld3lh	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnsquv00000xz8lc6605zo9	{"created": {"region": "양주", "baseFare": 150000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}}	{"source": "web_api"}	2025-09-17 18:45:49.504+09
cmfnsrjbo0005xz8lo5diipqj	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnsrjbl0003xz8l4q16eaeh	{"created": {"region": "양주", "baseFare": 170000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}}	{"source": "web_api"}	2025-09-17 18:46:21.204+09
cmfntdh2y000235tg0gnq1rfu	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfntdh2q000035tgv9fpgxx5	{"created": {"region": "남양주", "baseFare": 140000, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}}	{"source": "web_api"}	2025-09-17 19:03:24.73+09
cmfnteybm000535tgqnhamvbt	cmfkappr50000erc0bzin67q4	관리자	CREATE	CenterFare	cmfnteybj000335tgcxukwh99	{"created": {"region": "", "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤", "extraStopFee": 7000, "extraRegionFee": 10000}}	{"source": "web_api"}	2025-09-17 19:04:33.73+09
cmfnvj3tq00017k7yhh1ttgmu	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.718+09
cmfnvj3u000037k7yqx9z9ihu	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.729+09
cmfnvj3uy000h7k7y0zrhg02k	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.763+09
cmfnvj3v5000j7k7yhcxgmyod	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.77+09
cmfnvj3vb000l7k7ynuawnsnk	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.776+09
cmfnvj3vi000n7k7y3ceg3gfr	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.782+09
cmfnvj3vo000p7k7yrzv1eo8r	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.789+09
cmfnvj3vu000r7k7yz27vmsdl	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.795+09
cmfnvj3w2000t7k7y9kmeljk1	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.802+09
cmfnvj3w8000v7k7yre4kybgv	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:03:46.808+09
cmfnwhqah0003e9b3lv8gszic	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.138+09
cmfnwhqas0005e9b348fqfcoi	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.149+09
cmfnwhqbo000je9b3sw2ljdtg	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.181+09
cmfnwhqbw000le9b35i34hvmg	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.188+09
cmfnwhqc3000ne9b3lwu62vvm	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.195+09
cmfnwhqca000pe9b3fonu12ju	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.202+09
cmfnwhqch000re9b374b5k13i	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.209+09
cmfnwhqco000te9b3ja7hcmwi	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.216+09
cmfnwhqcw000ve9b3d2wnjj1d	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.224+09
cmfnwhqd3000xe9b3vgjbbqsf	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:30:42.232+09
cmfnwtphl0001nk2rnmvbh5vj	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:00.969+09
cmfnwtphu0003nk2rg3m2gm1v	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:00.978+09
cmfnwtpiu000hnk2r1vp28007	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.015+09
cmfnwtpj2000jnk2rv6emmrxu	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.022+09
cmfnwtpja000lnk2rgk0t9k1e	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.03+09
cmfnwtpjh000nnk2r0if1t2ix	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.037+09
cmfnwtpjn000pnk2ry6vyd1yc	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.044+09
cmfnwtpjt000rnk2ru2gpl2wk	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.05+09
cmfnwtpk0000tnk2r542q2qbm	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.056+09
cmfnwtpk6000vnk2rs5rql04p	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"fareType": "STOP_FEE", "centerName": "동원백암"}	\N	2025-09-17 20:40:01.062+09
cmfnxhno30006qcsh6a9oy9g5	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:58:38.355+09
cmfnxhnog0008qcshexkysc9u	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfntdh2q000035tgv9fpgxx5	{"region": "남양주", "changes": {"baseFare": 140000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:58:38.369+09
cmfnxhnon000aqcshoxqihffh	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsrjbl0003xz8l4q16eaeh	{"region": "양주", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:58:38.376+09
cmfnxhnov000cqcshu3qwxanq	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsquv00000xz8lc6605zo9	{"region": "양주", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:58:38.383+09
cmfnxhnp1000eqcshzdmdtrtg	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsllal00091q5acftlyqho	{"region": "의정부", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:58:38.39+09
cmfnxhnp9000gqcshmlarjsxa	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsl99n00061q5azi356pem	{"region": "의정부", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:58:38.397+09
cmfnxhnpf000iqcshnhgdkkm5	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:58:38.403+09
cmfnxhnpn000kqcshov9cvb6t	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfns7zcx00001q5asubryrbn	{"region": "남양주", "changes": {"baseFare": 120000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:58:38.411+09
cmfnxhnpr000mqcsh3tuu7mfg	cmfkappr50000erc0bzin67q4	관리자	IMPORT	CENTER_FARE	bulk-import	{"summary": {"total": 8, "errors": 0, "created": 0, "skipped": 0, "updated": 8}}	\N	2025-09-17 20:58:38.416+09
cmfnxi9vv000pqcshub2v9dtl	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:59:07.147+09
cmfnxi9w1000rqcshqgkld2bd	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfntdh2q000035tgv9fpgxx5	{"region": "남양주", "changes": {"baseFare": 140000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:59:07.153+09
cmfnxi9w5000tqcshx4i5srye	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsrjbl0003xz8l4q16eaeh	{"region": "양주", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:59:07.158+09
cmfnxi9wb000vqcshp3pfrpjt	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsquv00000xz8lc6605zo9	{"region": "양주", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:59:07.164+09
cmfnxi9wh000xqcsh1th01yvk	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsllal00091q5acftlyqho	{"region": "의정부", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 20:59:07.169+09
cmfnxi9wm000zqcsh1s54pg60	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsl99n00061q5azi356pem	{"region": "의정부", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:59:07.174+09
cmfnxi9ws0011qcshjbwhbp8p	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:59:07.18+09
cmfnxi9wy0013qcsh3pasuf8s	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfns7zcx00001q5asubryrbn	{"region": "남양주", "changes": {"baseFare": 120000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 20:59:07.187+09
cmfnxi9x20015qcshrm8ce1v0	cmfkappr50000erc0bzin67q4	관리자	IMPORT	CENTER_FARE	bulk-import	{"summary": {"total": 8, "errors": 0, "created": 0, "skipped": 0, "updated": 8}}	\N	2025-09-17 20:59:07.19+09
cmfnxjhsd0018qcsh6gjo37v9	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:00:04.045+09
cmfnxjhsk001aqcshgizpy6g2	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:00:04.052+09
cmfnxjhsr001dqcshlln6rvuj	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjhsp001bqcshhcnde78n	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "2.5톤"}	\N	2025-09-17 21:00:04.06+09
cmfnxjhsz001gqcshv8jjnq9f	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjhsx001eqcshf7k7l4qm	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤"}	\N	2025-09-17 21:00:04.067+09
cmfnxjht5001jqcsh6xixhlp8	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjht4001hqcshuus2u718	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤광폭"}	\N	2025-09-17 21:00:04.074+09
cmfnxjhtc001mqcshu059dm1o	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjhta001kqcshf0p33kwo	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤"}	\N	2025-09-17 21:00:04.081+09
cmfnxjhti001pqcshxdtdg9n8	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjhth001nqcsh0y30mjge	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤축"}	\N	2025-09-17 21:00:04.087+09
cmfnxjhto001sqcsh65el3tkt	cmfkappr50000erc0bzin67q4	관리자	CREATE	CENTER_FARE	cmfnxjhtm001qqcshdk0dzoye	{"region": null, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "11톤"}	\N	2025-09-17 21:00:04.092+09
cmfnxjhtt001uqcsheopjpo2q	cmfkappr50000erc0bzin67q4	관리자	IMPORT	CENTER_FARE	bulk-import	{"summary": {"total": 8, "errors": 0, "created": 6, "skipped": 0, "updated": 2}}	\N	2025-09-17 21:00:04.097+09
cmfnxnf13001xqcsh0gafiqsb	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:03:07.087+09
cmfnxnf1e001zqcsh7t75enwl	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:03:07.106+09
cmfnxnf1k0021qcsh3w4wtlap	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhsp001bqcshhcnde78n	{"region": null, "changes": {"extraStopFee": 10000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "2.5톤"}	\N	2025-09-17 21:03:07.112+09
cmfnxnf1r0023qcshbcm8lr17	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhsx001eqcshf7k7l4qm	{"region": null, "changes": {"extraStopFee": 20000, "extraRegionFee": 20000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤"}	\N	2025-09-17 21:03:07.119+09
cmfnxnf1w0025qcshila44b3u	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjht4001hqcshuus2u718	{"region": null, "changes": {"extraStopFee": 30000, "extraRegionFee": 20000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤광폭"}	\N	2025-09-17 21:03:07.124+09
cmfnxnf240027qcshcwn8enar	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhta001kqcshf0p33kwo	{"region": null, "changes": {"extraStopFee": 30000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤"}	\N	2025-09-17 21:03:07.132+09
cmfnxnf290029qcshyh6jludf	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhth001nqcsh0y30mjge	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤축"}	\N	2025-09-17 21:03:07.137+09
cmfnxnf2g002bqcshvi9tk339	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhtm001qqcshdk0dzoye	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "11톤"}	\N	2025-09-17 21:03:07.144+09
cmfnxnf2k002dqcshfypv5n0k	cmfkappr50000erc0bzin67q4	관리자	IMPORT	CENTER_FARE	bulk-import	{"summary": {"total": 8, "errors": 0, "created": 0, "skipped": 0, "updated": 8}}	\N	2025-09-17 21:03:07.149+09
cmfny1i5000047lpn3k9kkz16	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhtm001qqcshdk0dzoye	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "11톤"}	\N	2025-09-17 21:14:04.308+09
cmfny1i5a00067lpn8m9fpyji	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhth001nqcsh0y30mjge	{"region": null, "changes": {"extraStopFee": 50000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤축"}	\N	2025-09-17 21:14:04.319+09
cmfny1i5j00087lpn3cyq4ger	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhta001kqcshf0p33kwo	{"region": null, "changes": {"extraStopFee": 30000, "extraRegionFee": 30000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "5톤"}	\N	2025-09-17 21:14:04.328+09
cmfny1i5r000a7lpnnpz5bt5o	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjht4001hqcshuus2u718	{"region": null, "changes": {"extraStopFee": 30000, "extraRegionFee": 20000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤광폭"}	\N	2025-09-17 21:14:04.336+09
cmfny1i5z000c7lpnq33xl0ej	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhsx001eqcshf7k7l4qm	{"region": null, "changes": {"extraStopFee": 20000, "extraRegionFee": 20000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "3.5톤"}	\N	2025-09-17 21:14:04.344+09
cmfny1i67000e7lpnohtpq7yo	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnxjhsp001bqcshhcnde78n	{"region": null, "changes": {"extraStopFee": 10000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "2.5톤"}	\N	2025-09-17 21:14:04.351+09
cmfny1i6e000g7lpn4fgt0o7f	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnteybj000335tgcxukwh99	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:14:04.359+09
cmfny1i6l000i7lpnfryieevs	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfntdh2q000035tgv9fpgxx5	{"region": "남양주", "changes": {"baseFare": 140000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:14:04.366+09
cmfny1i6u000k7lpnh4szygl3	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsrjbl0003xz8l4q16eaeh	{"region": "양주", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:14:04.374+09
cmfny1i72000m7lpnjpczw45v	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsquv00000xz8lc6605zo9	{"region": "양주", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:14:04.382+09
cmfny1i7a000o7lpnrrglsyf1	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsllal00091q5acftlyqho	{"region": "의정부", "changes": {"baseFare": 170000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1.4톤"}	\N	2025-09-17 21:14:04.39+09
cmfny1i7i000q7lpnzictzc8u	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsl99n00061q5azi356pem	{"region": "의정부", "changes": {"baseFare": 150000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:14:04.399+09
cmfny1i7p000s7lpnkqj10loz	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfnsel5d00031q5a6gj0e4wr	{"region": null, "changes": {"extraStopFee": 7000, "extraRegionFee": 10000}, "fareType": "STOP_FEE", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:14:04.406+09
cmfny1i7x000u7lpnmvz8k368	cmfkappr50000erc0bzin67q4	관리자	UPDATE	CENTER_FARE	cmfns7zcx00001q5asubryrbn	{"region": "남양주", "changes": {"baseFare": 120000}, "fareType": "BASIC", "centerName": "동원백암", "vehicleType": "1톤"}	\N	2025-09-17 21:14:04.413+09
cmfny1i82000w7lpnbrpp15je	cmfkappr50000erc0bzin67q4	관리자	IMPORT	CENTER_FARE	bulk-import	{"summary": {"total": 14, "errors": 0, "created": 0, "skipped": 0, "updated": 14}}	\N	2025-09-17 21:14:04.419+09
cmfodzhwi0003q74u85afe3u3	cmfkappr50000erc0bzin67q4	관리자	LOGIN	User	cmfkappr50000erc0bzin67q4	{"loginTime": "2025-09-17T19:40:24.545Z", "userAgent": "Unknown"}	\N	2025-09-18 04:40:24.546+09
cmfonvlze000167d8hx343bi4	cmfkappr50000erc0bzin67q4	관리자	DELETE	LoadingPoint	cmfkay8os002g1084028wodiv	{"deleted": {"id": "cmfkay8os002g1084028wodiv", "phone1": "010-6331-8525", "phone2": "010-3328-4646", "remarks": "차단기 지나서 오른쪽 아래 지하층. \\r\\n35번도크 옆 계단. 오른쪽 동원사무실\\r\\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\\r\\n전표 담당자에게 보내주시면 됩니다.", "isActive": true, "manager1": "전영철", "manager2": "하승환", "createdAt": "2025-09-14T23:04:22.397Z", "updatedAt": "2025-09-14T23:04:22.397Z", "centerName": "동원백암", "lotAddress": "경기 용인시 처인구 백암면 백봉리 859", "roadAddress": "경기 용인시 처인구 백암면 원설로 445", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}}	{"source": "web_api", "soft_delete": true}	2025-09-18 09:17:19.37+09
cmfonw50c000367d8g2tja98b	cmfkappr50000erc0bzin67q4	관리자	ACTIVATE	LoadingPoint	cmfkay8os002g1084028wodiv	{"activated": {"id": "cmfkay8os002g1084028wodiv", "phone1": "010-6331-8525", "phone2": "010-3328-4646", "remarks": "차단기 지나서 오른쪽 아래 지하층. \\r\\n35번도크 옆 계단. 오른쪽 동원사무실\\r\\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\\r\\n전표 담당자에게 보내주시면 됩니다.", "isActive": false, "manager1": "전영철", "manager2": "하승환", "createdAt": "2025-09-14T23:04:22.397Z", "updatedAt": "2025-09-18T00:17:19.364Z", "centerName": "동원백암", "lotAddress": "경기 용인시 처인구 백암면 백봉리 859", "roadAddress": "경기 용인시 처인구 백암면 원설로 445", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}}	{"source": "web_api"}	2025-09-18 09:17:44.028+09
cmfonwcys000567d83092vmwe	cmfkappr50000erc0bzin67q4	관리자	UPDATE	LoadingPoint	cmfkay8os002g1084028wodiv	{"after": {"phone1": "01063318525", "phone2": "01033284646", "remarks": "차단기 지나서 오른쪽 아래 지하층. \\r\\n35번도크 옆 계단. 오른쪽 동원사무실\\r\\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\\r\\n전표 담당자에게 보내주시면 됩니다.", "manager1": "전영철", "manager2": "하승환", "centerName": "동원백암(야간)", "lotAddress": "경기 용인시 처인구 백암면 백봉리 859", "roadAddress": "경기 용인시 처인구 백암면 원설로 445", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}, "before": {"id": "cmfkay8os002g1084028wodiv", "phone1": "010-6331-8525", "phone2": "010-3328-4646", "remarks": "차단기 지나서 오른쪽 아래 지하층. \\r\\n35번도크 옆 계단. 오른쪽 동원사무실\\r\\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\\r\\n전표 담당자에게 보내주시면 됩니다.", "isActive": true, "manager1": "전영철", "manager2": "하승환", "createdAt": "2025-09-14T23:04:22.397Z", "updatedAt": "2025-09-18T00:17:44.024Z", "centerName": "동원백암", "lotAddress": "경기 용인시 처인구 백암면 백봉리 859", "roadAddress": "경기 용인시 처인구 백암면 원설로 445", "loadingPointName": "동원LOEX 백암물류센터(저온야간)"}}	{"source": "web_api"}	2025-09-18 09:17:54.34+09
\.


--
-- Data for Name: center_fares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.center_fares (id, "vehicleType", region, "createdAt", "updatedAt", "fareType", "baseFare", "extraStopFee", "extraRegionFee", "centerName") FROM stdin;
cmfnxjhtm001qqcshdk0dzoye	11톤	\N	2025-09-17 21:00:04.091+09	2025-09-17 21:14:04.304+09	STOP_FEE	\N	50000	30000	동원백암
cmfnxjhth001nqcsh0y30mjge	5톤축	\N	2025-09-17 21:00:04.085+09	2025-09-17 21:14:04.316+09	STOP_FEE	\N	50000	30000	동원백암
cmfnxjhta001kqcshf0p33kwo	5톤	\N	2025-09-17 21:00:04.078+09	2025-09-17 21:14:04.324+09	STOP_FEE	\N	30000	30000	동원백암
cmfnxjht4001hqcshuus2u718	3.5톤광폭	\N	2025-09-17 21:00:04.072+09	2025-09-17 21:14:04.332+09	STOP_FEE	\N	30000	20000	동원백암
cmfnxjhsx001eqcshf7k7l4qm	3.5톤	\N	2025-09-17 21:00:04.066+09	2025-09-17 21:14:04.341+09	STOP_FEE	\N	20000	20000	동원백암
cmfnxjhsp001bqcshhcnde78n	2.5톤	\N	2025-09-17 21:00:04.057+09	2025-09-17 21:14:04.348+09	STOP_FEE	\N	10000	10000	동원백암
cmfnteybj000335tgcxukwh99	1.4톤	\N	2025-09-17 19:04:33.727+09	2025-09-17 21:14:04.356+09	STOP_FEE	\N	7000	10000	동원백암
cmfntdh2q000035tgv9fpgxx5	1.4톤	남양주	2025-09-17 19:03:24.722+09	2025-09-17 21:14:04.363+09	BASIC	140000	\N	\N	동원백암
cmfnsrjbl0003xz8l4q16eaeh	1.4톤	양주	2025-09-17 18:46:21.202+09	2025-09-17 21:14:04.371+09	BASIC	170000	\N	\N	동원백암
cmfnsquv00000xz8lc6605zo9	1톤	양주	2025-09-17 18:45:49.5+09	2025-09-17 21:14:04.379+09	BASIC	150000	\N	\N	동원백암
cmfnsllal00091q5acftlyqho	1.4톤	의정부	2025-09-17 18:41:43.821+09	2025-09-17 21:14:04.387+09	BASIC	170000	\N	\N	동원백암
cmfnsl99n00061q5azi356pem	1톤	의정부	2025-09-17 18:41:28.235+09	2025-09-17 21:14:04.395+09	BASIC	150000	\N	\N	동원백암
cmfnsel5d00031q5a6gj0e4wr	1톤	\N	2025-09-17 18:36:17.041+09	2025-09-17 21:14:04.403+09	STOP_FEE	\N	7000	10000	동원백암
cmfns7zcx00001q5asubryrbn	1톤	남양주	2025-09-17 18:31:08.865+09	2025-09-17 21:14:04.41+09	BASIC	120000	\N	\N	동원백암
\.


--
-- Data for Name: centers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.centers (id, name, location, is_active, created_at, updated_at) FROM stdin;
1	기본센터	미지정	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
2	서울센터	서울특별시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
3	경기센터	경기도	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
4	인천센터	인천광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
5	부산센터	부산광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
6	대구센터	대구광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
7	대전센터	대전광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
8	광주센터	광주광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
9	울산센터	울산광역시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
10	세종센터	세종특별자치시	t	2025-09-18 09:42:08.04416+09	2025-09-18 09:42:08.04416+09
\.


--
-- Data for Name: charter_destinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.charter_destinations (id, "requestId", region, "order") FROM stdin;
\.


--
-- Data for Name: charter_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.charter_requests (id, "centerId", "vehicleType", date, "isNegotiated", "negotiatedFare", "baseFare", "regionFare", "stopFare", "extraFare", "totalFare", "driverId", "driverFare", notes, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: dispatches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dispatches (id, "requestId", "driverId", "driverName", "driverPhone", "driverVehicle", "deliveryTime", "driverFee", "driverNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers (id, name, phone, "businessNumber", "bankName", "accountNumber", remarks, "isActive", "createdAt", "updatedAt", "vehicleNumber", "businessName", representative) FROM stdin;
cmfkaxjip00011084kj709ffa	강병력	01036069992	427-22-02068	농협	23301556106217	-	t	2025-09-15 08:03:49.777+09	2025-09-15 08:03:49.777+09	경기86사1632	개인화물	강병력
cmfkaxjir00021084avgbcugw	강정환	01035558388	-	카카오	3333084687238	-	t	2025-09-15 08:03:49.78+09	2025-09-15 08:03:49.78+09	경기91바8442	-	강미령
cmfkaxjit00031084qo6tl60b	강준	01052344729	885-37-00334	국민	59060101466080	쿠팡용차	t	2025-09-15 08:03:49.782+09	2025-09-15 08:03:49.782+09	충북90자1648	강준용달화물	강준
cmfkaxjiv00041084tqu6lr93	고정민	01098440709	357-02-03042	우리	1002332890969	김진걸발급	t	2025-09-15 08:03:49.783+09	2025-09-15 08:03:49.783+09	경기89자1455	삼산물류	김진걸
cmfkaxjiw00051084odk7ilzr	곽민재	01035766256	539-51-00776	국민	07300104308026	-	t	2025-09-15 08:03:49.785+09	2025-09-15 08:03:49.785+09	경기85바7567	유한글로지스(경기85바7567)	곽민재
cmfkaxjiy000610845ncrvwdr	권수범	01090383870	376-20-01277	국민	53420104058141	-	t	2025-09-15 08:03:49.786+09	2025-09-15 08:03:49.786+09	경기87바6141	권수범	권수범
cmfkaxjiz00071084wxh67pzl	김가람	01050518398	673-25-01630	대구	504104589357	-	t	2025-09-15 08:03:49.788+09	2025-09-15 08:03:49.788+09	대구81바1695	태산물류	김가람
cmfkaxjj100081084vvf9lq29	김남학	01027028877	334-14-02422	새마을금고	9003285084989	-	t	2025-09-15 08:03:49.79+09	2025-09-15 08:03:49.79+09	경기80자2724	푸르미로지스	김남학
cmfkaxjj3000910845acrcdfs	김대영	01077143620	563-33-01094	신한	110366126124	-	t	2025-09-15 08:03:49.792+09	2025-09-15 08:03:49.792+09	서울91자2272	개인화물2272	김대영
cmfkaxjj5000a1084vr5rx69h	김대웅	01082231662	170-04-03022	우리	1002561852772	-	t	2025-09-15 08:03:49.793+09	2025-09-15 08:03:49.793+09	경기94자1909	유넥스로지	김대웅
cmfkaxjj6000b108413uwpxav	김동민	01052874309	178-32-00605	우리	08226784202001	-	t	2025-09-15 08:03:49.794+09	2025-09-15 08:03:49.794+09	서울86바5701	새봄물류	김동민
cmfkaxjj7000c1084w2204g6r	김상열	01066785838	709-48-00604	기업	01024758802	-	t	2025-09-15 08:03:49.796+09	2025-09-15 08:03:49.796+09	경기92바9107	좋은차	김용회
cmfkaxjj9000d1084bwqhx27o	김석기	01099790116	754-41-01244	농협	23510952142451	-	t	2025-09-15 08:03:49.797+09	2025-09-15 08:03:49.797+09	경기90아3350	운송하주	김석기
cmfkaxjja000e1084tlvbrx2y	김선우	01044466679	169-12-01505	신한	110286244080	-	t	2025-09-15 08:03:49.799+09	2025-09-15 08:03:49.799+09	경기80자9156	아윤로지스	김선우
cmfkaxjjc000f1084tce8x2hi	김성삼	01097936322	135-06-43985	국민	62480101008130	-	t	2025-09-15 08:03:49.8+09	2025-09-15 08:03:49.8+09	경기81바6281	태영6281운수	김성삼
cmfkaxjjd000g10846h2igivn	김승관	01068629929	-	국민	33130204258905	-	t	2025-09-15 08:03:49.801+09	2025-09-15 08:03:49.801+09	90어1351	-	김승관
cmfkaxjje000h10847jc1s5zk	김양진	01075917577	407-07-65090	농협	3521653862613	-	t	2025-09-15 08:03:49.803+09	2025-09-15 08:03:49.803+09	경기88사1801	모아로지스	김일훈
cmfkaxjjh000i10842hc6jgzm	김연수	01044711332	216-19-63276	우리	1002363596380	-	t	2025-09-15 08:03:49.805+09	2025-09-15 08:03:49.805+09	서울91자5594	로지스 Y&H	김연수
cmfkaxjjj000j1084cse3ruxh	김용회	01024758802	709-48-00604	기업	01024758802	-	t	2025-09-15 08:03:49.807+09	2025-09-15 08:03:49.807+09	경기94사3928	좋은차	김용회
cmfkaxjjk000k1084l56p8kj1	김인권	01049439168	862-17-01929	카카오	3333253042673	-	t	2025-09-15 08:03:49.809+09	2025-09-15 08:03:49.809+09	서울90바4375	한국로지스	김인권
cmfkaxjjl000l1084ie8g2py8	김재우	01025445958	286-10-02993	하나	01025445958107	-	t	2025-09-15 08:03:49.81+09	2025-09-15 08:03:49.81+09	대구81바1742	개별화물	김재우
cmfkaxjjn000m1084zy9zbw3b	김진걸	01094032872	357-02-03042	우리	1002332890969	-	t	2025-09-15 08:03:49.812+09	2025-09-15 08:03:49.812+09	서울90바6372	삼산물류	김진걸
cmfkaxjjp000n108400awcueg	김태권	01050347869	321-13-02491	우리	1002643887833	-	t	2025-09-15 08:03:49.813+09	2025-09-15 08:03:49.813+09	경기83사6639	티케이로지스	김태권
cmfkaxjjq000o10843icvdo9j	남태현	01027333498	306-10-95030	농협	3020087594111	-	t	2025-09-15 08:03:49.815+09	2025-09-15 08:03:49.815+09	경기81바6743	개인화물	남태현
cmfkaxjjs000p1084d9yeiyuh	민경진	01030001936	659-55-00777	신한	110464683011	-	t	2025-09-15 08:03:49.816+09	2025-09-15 08:03:49.816+09	경기81자9092	경진물류	민경진
cmfkaxjjt000q1084wlpjsc7k	박상천	01033127322	630-08-02858	SC제일	60720091493	시화피자, 고정56호	t	2025-09-15 08:03:49.818+09	2025-09-15 08:03:49.818+09	경기89사4708	코어익스프레스(박상천)	박상천
cmfkaxjjv000r10841k0vwi3x	박상필	01031310782	-	국민	97040100005475	-	t	2025-09-15 08:03:49.82+09	2025-09-15 08:03:49.82+09	경기94자7965	-	박상필
cmfkaxjjx000s1084ky3oeiwf	박신수	01088588067	792-38-00062	농협	22309152067900	월대300, 송파GS, 휴무시(13만차감)	t	2025-09-15 08:03:49.822+09	2025-09-15 08:03:49.822+09	경기94자7541	삼일로지스	박신수
cmfkaxjjz000t1084c5zy9vwm	박지연	01063209754	236-43-00950	신한	110393795845	-	t	2025-09-15 08:03:49.823+09	2025-09-15 08:03:49.823+09	인천82바5834	상동물류	김민영
cmfkaxjk0000u10842tabam8h	박태원	01044778824	890-11-02367	우리	13618009002101	-	t	2025-09-15 08:03:49.825+09	2025-09-15 08:03:49.825+09	서울82바7058	태양종합물류 7058	박태원
cmfkaxjk2000v1084ntb71lxp	손병열	01071707357	692-26-01017	신한	110199637330	-	t	2025-09-15 08:03:49.826+09	2025-09-15 08:03:49.826+09	서울91자1473	손 B·Y	손병열
cmfkaxjk3000w1084u5nlg0zr	손재국	01085217948	328-16-01776	국민	05810104299747	-	t	2025-09-15 08:03:49.827+09	2025-09-15 08:03:49.827+09	경기88바5225	소니 화물	손재국
cmfkaxjk4000x10841p1ag60k	송재호	01099993441	284-31-01159	우리	1002456495471	-	t	2025-09-15 08:03:49.828+09	2025-09-15 08:03:49.828+09	경기81자5833	개인화물운송사업	송재호
cmfkaxjk5000y1084mkazlhhp	신대길	01030508208	104-34-95691	농협	3021070091881	-	t	2025-09-15 08:03:49.83+09	2025-09-15 08:03:49.83+09	경기87바1749	개별화물	신대길
cmfkaxjk6000z10846owviqba	신대중	01022089693	622-36-01093	신한	110521314133	-	t	2025-09-15 08:03:49.831+09	2025-09-15 08:03:49.831+09	경기96자6724	강수진	강수진
cmfkaxjk800101084acslmglj	신동혁	01065672281	158-07-01627	기업	00308414801015	마평 케이터링 관리	t	2025-09-15 08:03:49.832+09	2025-09-15 08:03:49.832+09	차량X	재성운수	신동혁
cmfkaxjka001110844bezf7xg	안용덕	01027031600	511-18-02099	새마을금고	9003285967218	-	t	2025-09-15 08:03:49.835+09	2025-09-15 08:03:49.835+09	경기94자2241	강진물류 2241	안용덕
cmfkaxjkc00121084z6ujwgvt	안인성	01099463496	311-23-02187	국민	49010104197658	-	t	2025-09-15 08:03:49.837+09	2025-09-15 08:03:49.837+09	경기84바3464	로드마스터	김영진
cmfkaxjke001310841w26gop5	양태준	01020573922	470-31-01672	국민	92057392265	-	t	2025-09-15 08:03:49.838+09	2025-09-15 08:03:49.838+09	강원80바9601	신한에스에이치	양태준
cmfkaxjkf001410841ccm2p9u	오민욱	01039446120	106-38-51630	신한	110341227805	-	t	2025-09-15 08:03:49.84+09	2025-09-15 08:03:49.84+09	경기91자7013	엠유로지스	오민욱
cmfkaxjkg001510845ezsyfha	오승민	01079314123	574-01-03655	우리	1002641293763	-	t	2025-09-15 08:03:49.841+09	2025-09-15 08:03:49.841+09	서울91자4070	나라로지스	이나라
cmfkaxjkh00161084d4smjqvn	오영택	01044904868	145-05-03213	국민	27540204135447	-	t	2025-09-15 08:03:49.842+09	2025-09-15 08:03:49.842+09	서울82바2341	카우로지스틱스	이선희
cmfkaxjki00171084gogiex70	유광수	01074661070	141-04-08000	국민	65360201241910	-	t	2025-09-15 08:03:49.843+09	2025-09-15 08:03:49.843+09	강원85자2409	개별화물(강원85자2409호)	유광수
cmfkaxjkk00181084b7t3jdoj	유석문	01087435360	709-73-00080	신한	110070940631	-	t	2025-09-15 08:03:49.844+09	2025-09-15 08:03:49.844+09	서울82바7200	물류뱅크	유석문
cmfkaxjkl001910846vrssa8r	유현수	01036173439	707-18-01411	카카오	3333176906967	-	t	2025-09-15 08:03:49.845+09	2025-09-15 08:03:49.845+09	충북82자3069	한결3069	유도진
cmfkaxjkm001a1084s90tyw8w	윤재훈	01048499373	409-28-52091	국민	96270101554584	-	t	2025-09-15 08:03:49.846+09	2025-09-15 08:03:49.846+09	충북92아3016	한빛물류3016	윤재훈
cmfkaxjkn001b1084oyemt77w	이경목	01030047890	429-04-01469	국민	765210232416	-	t	2025-09-15 08:03:49.848+09	2025-09-15 08:03:49.848+09	경기94바5662	원양통운	이경목
cmfkaxjkp001c10843p7jpf5m	이남철	01031686679	422-60-00562	농협	3561298922393	-	t	2025-09-15 08:03:49.85+09	2025-09-15 08:03:49.85+09	전남81바7693	온누리물류	안성찬
cmfkaxjkr001d10843s2xhtl7	이대형	01089744099	413-06-93032	국민	99570101098936	CS광릉, 지입45호	t	2025-09-15 08:03:49.852+09	2025-09-15 08:03:49.852+09	경기88사5592	대형운수	이진영
cmfkaxjkt001e1084dkxjn3no	이동균	01091248083	364-10-02634	카카오	3333110149943	-	t	2025-09-15 08:03:49.853+09	2025-09-15 08:03:49.853+09	서울85바8999	제이와이로지스	이동균
cmfkaxjku001f1084ynk71msj	이두진	01083743033	111-36-93773	하나	34991057353407	-	t	2025-09-15 08:03:49.855+09	2025-09-15 08:03:49.855+09	경기92바8508	거성	이두진
cmfkaxjkv001g1084dp3up92j	이무룡	01066762747	618-17-91708	국민	47360204359096	-	t	2025-09-15 08:03:49.856+09	2025-09-15 08:03:49.856+09	85바6577	제이지로지스	이무룡
cmfkaxjkw001h108412kw3h1c	이상민	01028217023	666-05-02536	하나	26091063264907	-	t	2025-09-15 08:03:49.857+09	2025-09-15 08:03:49.857+09	경기81바4301	이상민(동원4301)	이상민
cmfkaxjkx001i10846sa9druq	이상윤	01071997829	891-14-01246	우리	1002758796723	-	t	2025-09-15 08:03:49.858+09	2025-09-15 08:03:49.858+09	경기80자1619	평강물류(경기80자1619)	이상윤
cmfkaxjkz001j1084krdo1hzi	이상학	01037244909	637-20-01342	카카오	3333181743238	-	t	2025-09-15 08:03:49.859+09	2025-09-15 08:03:49.859+09	경기88사5564	조아유통	이상학
cmfkaxjl0001k10841ay6jukz	이수호	01086859789	650-69-00234	기업	02209280801016	-	t	2025-09-15 08:03:49.86+09	2025-09-15 08:03:49.86+09	경기94자8255	팔팔운수	이수호
cmfkaxjl1001l10840cg039p4	이승복	01022277818	126-81-34820	국민	60310101117738	-	t	2025-09-15 08:03:49.861+09	2025-09-15 08:03:49.861+09	경기95자1353	효림운수（주）	박종열
cmfkaxjl2001m1084o73vmrad	이정훈	01075397530	536-58-00965	기업	02010881101016	-	t	2025-09-15 08:03:49.862+09	2025-09-15 08:03:49.862+09	경기84바5478	화창화물	이정훈
cmfkaxjl4001n10840r8lbete	이종수	01077512022	-	-	\N	-	t	2025-09-15 08:03:49.865+09	2025-09-15 08:03:49.865+09	서울85바4820	-	-
cmfkaxjl6001o1084esrnrqfu	이지형	01033452910	762-29-01296	신한	110420532026	-	t	2025-09-15 08:03:49.867+09	2025-09-15 08:03:49.867+09	경기91사2910	상호없음	이지형
cmfkaxjl8001p10845h7zxuea	이해봉	01053722724	365-15-01521	국민	43630201282664	-	t	2025-09-15 08:03:49.868+09	2025-09-15 08:03:49.868+09	경기96사1307	향리운수	이해봉
cmfkaxjl9001q10849rsszx2f	이호연	01027353656	383-63-00652	국민	11130101134306	-	t	2025-09-15 08:03:49.869+09	2025-09-15 08:03:49.869+09	경기86아3814	현우유통	LI HAORAN(이호연)
cmfkaxjla001r1084a6ubv3za	장경화	01088840497	-	농협	3511233657053	-	t	2025-09-15 08:03:49.87+09	2025-09-15 08:03:49.87+09	838구8406	-	이진희
cmfkaxjlb001s10841y2tkwbv	전장우	01056543037	320-08-01326	농협	3025654303711	-	t	2025-09-15 08:03:49.871+09	2025-09-15 08:03:49.871+09	경기94아3843	제이엠(J.M)물류	전장우
cmfkaxjlc001t1084cs2bzlp4	전종한	01041330716	312-27-05720	우리	1002642831356	쿠팡용차	t	2025-09-15 08:03:49.872+09	2025-09-15 08:03:49.872+09	충남80자8902	개별화물	전종한
cmfkaxjld001u10848tqlgilb	정성근	01098820787	518-08-00754	국민	173210138695	-	t	2025-09-15 08:03:49.874+09	2025-09-15 08:03:49.874+09	충북80아5582	판토스 청주 정성근	정성근
cmfkaxjle001v1084122940yh	정원석	01065678111	221-22-31306	농협	3510226078823	-	t	2025-09-15 08:03:49.875+09	2025-09-15 08:03:49.875+09	대전87아1393	대덕화물-1393	정원석
cmfkaxjlf001w1084jpiumr5r	정지원	01024468289	632-56-00522	기업	11221254901015	-	t	2025-09-15 08:03:49.876+09	2025-09-15 08:03:49.876+09	경기89아7765	영광운수	정지원
cmfkaxjlg001x1084qwmefjzl	정진세	01066667704	192-08-01532	기업	11502777902011	-	t	2025-09-15 08:03:49.877+09	2025-09-15 08:03:49.877+09	경기81자5751	세진운수	정진세
cmfkaxjli001y1084p9ot3hhf	정창용	01074256001	589-45-01065	신한	110360143491	-	t	2025-09-15 08:03:49.878+09	2025-09-15 08:03:49.878+09	경기91바3956	드림운수	정창용
cmfkaxjll001z1084a5hiji79	조상태	01087318987	554-12-00946	카카오	3333069271982	-	t	2025-09-15 08:03:49.881+09	2025-09-15 08:03:49.881+09	경기90자3798	더블제이3798호	김규희
cmfkaxjlm00201084yc83c4m0	조희문	01091357905	601-09-03026	신한	110269996861	-	t	2025-09-15 08:03:49.882+09	2025-09-15 08:03:49.882+09	경기94사4829	조희문	조희문
cmfkaxjln002110840r31lniz	지기훈	01056916691	307-63-00487	우리	1002861859793	쿠팡용차	t	2025-09-15 08:03:49.884+09	2025-09-15 08:03:49.884+09	서울83자7488	제이앤케이(j&k)	지기훈
cmfkaxjlo00221084kv2ch8bn	지성진	01094118516	121-23-46729	국민	64710101267222	-	t	2025-09-15 08:03:49.885+09	2025-09-15 08:03:49.885+09	인천85아1692	성진용달화물	지성진
cmfkaxjlq0023108441253cee	채명진	01088187766	548-69-00168	국민	65650101555439	고정지입, 고양GS	t	2025-09-15 08:03:49.886+09	2025-09-15 08:03:49.886+09	경기91자6351	차윤숙	차윤숙
cmfkaxjlr00241084uy8gal60	채수호	01099578939	588-04-01147	카카오	3333019705321	-	t	2025-09-15 08:03:49.887+09	2025-09-15 08:03:49.887+09	경기92바 6163	일성운수6163	채수호
cmfkaxjls00251084ofsp52fj	최광필	01026569877	435-43-00881	신한	110394211243	-	t	2025-09-15 08:03:49.888+09	2025-09-15 08:03:49.888+09	서울91지4070	한결 6624	최광필
cmfkaxjlt00261084otevlbns	최명철	01095479544	444-72-00681	농협	3511358798783	-	t	2025-09-15 08:03:49.889+09	2025-09-15 08:03:49.889+09	경기96사1396	디엔엠	최명철
cmfkaxjlu002710843z0blhjy	최영환	01049133143	450-18-01077	우리	1002956576971	-	t	2025-09-15 08:03:49.89+09	2025-09-15 08:03:49.89+09	경기93자6080	한성물류	최영환
cmfkaxjlv00281084ttzi9b6k	최재석	01062893522	620-79-00213	국민	35880204379612	-	t	2025-09-15 08:03:49.892+09	2025-09-15 08:03:49.892+09	광주86바6705	대일물류	최재석
cmfkaxjlw00291084r8q6ersu	탁성수	01044065015	329-23-01442	우리	1002343575140	-	t	2025-09-15 08:03:49.893+09	2025-09-15 08:03:49.893+09	광주89아2150	칠산운수	탁성수
cmfkaxjlz002a1084esbxpu0g	한주원	01063032655	608-25-75818	국민	63610101171446	-	t	2025-09-15 08:03:49.895+09	2025-09-15 08:03:49.895+09	경기86아5432	원주유통	한주원
cmfkaxjm2002c10841dhokwir	황춘만	01088634730	430-55-00273	농협	3521544966573	-	t	2025-09-15 08:03:49.899+09	2025-09-15 08:03:49.899+09	경기86아5637	용달	황춘만
cmfn23v3n00008qvn40ivm5gx	김기탁	01023070504	\N	\N	\N	백사 메가 고정	t	2025-09-17 06:20:06.707+09	2025-09-17 06:20:21.785+09	서울89자8279	\N	\N
cmfn24nhp00058qvn1igd0hzs	김신범	01079210701	\N	\N	\N	백사 메가 고정	t	2025-09-17 06:20:43.501+09	2025-09-17 06:20:43.501+09	서울85바4960	\N	\N
cmfn2546k00088qvn7ng11wb0	여인홍	01036289336	\N	\N	\N	\N	t	2025-09-17 06:21:05.133+09	2025-09-17 06:21:05.133+09	경기86자5192	\N	\N
cmfkaxjm1002b10844wsfkhh2	홍문길	01020811574	5361102390	농협	3520364508113	고정81호(지입) \n동원티엘에스 (넘버임대료+보험료+기타벌금) 공제	t	2025-09-15 08:03:49.897+09	2025-09-17 06:25:11.76+09	경기94사4096	홍문길(동원4096)	홍문길
\.


--
-- Data for Name: fixed_contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fixed_contracts (id, "driverId", "loadingPointId", "routeName", "centerContractType", "driverContractType", "centerAmount", "driverAmount", "operatingDays", "startDate", "specialConditions", remarks, "isActive", "createdAt", "updatedAt", "createdBy", "endDate") FROM stdin;
cmfkyul9d00004ueyi34cjyru	cmfkaxjiy000610845ncrvwdr	cmfkay8os002g1084028wodiv	마트킹	FIXED_DAILY	FIXED_DAILY	180000.00	160000.00	{1,2,3,4,5,6}	2025-09-01			t	2025-09-15 19:13:22.85+09	2025-09-15 20:18:25.719+09	cmfkappr50000erc0bzin67q5	\N
cmfl48ftd0003yjgfn0t4gkb1	cmfkaxjir00021084avgbcugw	cmfkay8os002g1084028wodiv	CS광릉	FIXED_DAILY	FIXED_DAILY	40000.00	40000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.057+09	2025-09-15 21:44:07.057+09	cmfkappr50000erc0bzin67q5	\N
cmfl48ftu0005yjgf8n8kofyi	cmfkaxjlq0023108441253cee	cmfkay8os002g1084028wodiv	고양GS	FIXED_DAILY	FIXED_DAILY	190000.00	150000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.074+09	2025-09-15 21:44:07.074+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fu60007yjgf2nk4sg68	cmfkaxjj6000b108413uwpxav	cmfkay8os002g1084028wodiv	고정04호	FIXED_DAILY	FIXED_DAILY	210000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.086+09	2025-09-15 21:44:07.086+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fug0009yjgfxbzyrd8y	cmfkaxjkx001i10846sa9druq	cmfkay8os002g1084028wodiv	고정17호	FIXED_DAILY	FIXED_DAILY	200000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.096+09	2025-09-15 21:44:07.096+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fuq000byjgf7ggf39h2	cmfkaxjkg001510845ezsyfha	cmfkay8os002g1084028wodiv	고정18호	FIXED_DAILY	FIXED_DAILY	220000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.106+09	2025-09-15 21:44:07.106+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fv0000dyjgfn4du8qrp	cmfkaxjj3000910845acrcdfs	cmfkay8os002g1084028wodiv	고정19호	FIXED_DAILY	FIXED_DAILY	210000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.115+09	2025-09-15 21:44:07.115+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fv9000fyjgf05vlvfup	cmfkaxjlw00291084r8q6ersu	cmfkay8os002g1084028wodiv	고정23호	FIXED_DAILY	FIXED_DAILY	220000.00	180000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.125+09	2025-09-15 21:44:07.125+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fw2000hyjgfnhe7y7r7	cmfkaxjjd000g10846h2igivn	cmfkay8os002g1084028wodiv	고정37호	FIXED_DAILY	FIXED_DAILY	210000.00	180000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.154+09	2025-09-15 21:44:07.154+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fwa000jyjgfqsqoafer	cmfkaxjiw00051084odk7ilzr	cmfkay8os002g1084028wodiv	고정50호	FIXED_DAILY	FIXED_DAILY	200000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.162+09	2025-09-15 21:44:07.162+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fwh000lyjgf2cei1tjr	cmfkaxjla001r1084a6ubv3za	cmfkay8os002g1084028wodiv	고정61호	FIXED_DAILY	FIXED_DAILY	180000.00	130000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.169+09	2025-09-15 21:44:07.169+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fwn000nyjgfavzw35zn	cmfkaxjld001u10848tqlgilb	cmfkay8os002g1084028wodiv	고정62호	FIXED_DAILY	FIXED_DAILY	190000.00	160000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.175+09	2025-09-15 21:44:07.175+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fws000pyjgfu8d837bk	cmfkaxjjv000r10841k0vwi3x	cmfkay8os002g1084028wodiv	고정73호	FIXED_DAILY	FIXED_DAILY	220000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.18+09	2025-09-15 21:44:07.18+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fx0000ryjgf3m5nbb0i	cmfkaxjkw001h108412kw3h1c	cmfkay8os002g1084028wodiv	고정86호	FIXED_DAILY	FIXED_DAILY	190000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.188+09	2025-09-15 21:44:07.188+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fx5000tyjgf8054hzpj	cmfkaxjkt001e1084dkxjn3no	cmfkay8os002g1084028wodiv	고정88호	FIXED_DAILY	FIXED_DAILY	190000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.193+09	2025-09-15 21:44:07.193+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fxa000vyjgfhbehpfb2	cmfkaxjlg001x1084qwmefjzl	cmfkay8os002g1084028wodiv	고정91호	FIXED_DAILY	FIXED_DAILY	190000.00	160000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.198+09	2025-09-15 21:44:07.198+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fxg000xyjgft7smdms8	cmfkaxjjz000t1084c5zy9vwm	cmfkay8os002g1084028wodiv	고정96호	FIXED_DAILY	FIXED_DAILY	220000.00	190000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.204+09	2025-09-15 21:44:07.204+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fxl000zyjgf06gch3v3	cmfkaxjkz001j1084krdo1hzi	cmfkay8os002g1084028wodiv	고정97호	FIXED_DAILY	FIXED_DAILY	190000.00	170000.00	{1,2,3,4,5}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.21+09	2025-09-15 21:44:07.21+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fxq0011yjgfetz9nyox	cmfkaxjj6000b108413uwpxav	cmfkay8os002g1084028wodiv	고정가평	FIXED_DAILY	FIXED_DAILY	195000.00	180000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.214+09	2025-09-15 21:44:07.214+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fxw0013yjgfmljsdrvy	cmfkaxjlw00291084r8q6ersu	cmfkay8os002g1084028wodiv	더벤티5호	FIXED_DAILY	FIXED_DAILY	200000.00	170000.00	{1,3,5}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.22+09	2025-09-15 21:44:07.22+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fy10015yjgf0t9ml2ri	cmfkaxjjd000g10846h2igivn	cmfkay8os002g1084028wodiv	더벤티A	FIXED_DAILY	FIXED_DAILY	180000.00	160000.00	{1,3,5}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.225+09	2025-09-15 21:44:07.225+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fy50017yjgf2jhyscfx	cmfkaxjll001z1084a5hiji79	cmfkay8os002g1084028wodiv	도화GS	FIXED_DAILY	FIXED_DAILY	190000.00	150000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.23+09	2025-09-15 21:44:07.23+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fyg001byjgf073b1jyx	cmfkaxjjx000s1084ky3oeiwf	cmfkay8os002g1084028wodiv	송파GS	FIXED_DAILY	FIXED_DAILY	130000.00	120000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.241+09	2025-09-15 21:44:07.241+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fyl001dyjgfb0h334ei	cmfkaxjlm00201084yc83c4m0	cmfkay8os002g1084028wodiv	용차03호	FIXED_DAILY	FIXED_DAILY	190000.00	170000.00	{1,2,3,4,5,6}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.245+09	2025-09-15 21:44:07.245+09	cmfkappr50000erc0bzin67q5	\N
cmfl48fyr001fyjgfzotmtrcl	cmfkaxjkz001j1084krdo1hzi	cmfkay8os002g1084028wodiv	용차09호	FIXED_DAILY	FIXED_DAILY	150000.00	130000.00	{1,2,3,4,5}	2025-08-31	\N	\N	t	2025-09-15 21:44:07.251+09	2025-09-15 21:44:07.251+09	cmfkappr50000erc0bzin67q5	\N
\.


--
-- Data for Name: loading_points; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loading_points (id, "isActive", "createdAt", "updatedAt", "centerName", "loadingPointName", "lotAddress", "roadAddress", manager1, manager2, phone1, phone2, remarks) FROM stdin;
cmfkay8ov002h1084qprpwjfi	t	2025-09-15 08:04:22.399+09	2025-09-15 08:04:22.399+09	동원백암	동원LOEX 백암물류센터(저온주간)	경기 용인시 처인구 백암면 백봉리 859	경기 용인시 처인구 백암면 원설로 445	김수환	최지훈	010-3522-3561	010-2570-8300	차단기 지나서 오른쪽 아래 지하층. \r\n35번도크 옆 계단. 오른쪽 동원사무실\r\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\r\n전표 담당자에게 보내주시면 됩니다.
cmfkay8ow002i10847zzrpay8	t	2025-09-15 08:04:22.401+09	2025-09-15 08:04:22.401+09	동원시화	동원LOEX 시화물류센터(주간)	경기 시흥시 정왕동 2209	경기 시흥시 오이도로 22-12	김태현	-	010-8256-2882	-	-
cmfkay8ox002j1084a3nyc30w	t	2025-09-15 08:04:22.402+09	2025-09-15 08:04:22.402+09	동원시화쿠팡	동원LOEX 시화물류센터(야간)	경기 시흥시 정왕동 2209	경기 시흥시 오이도로 22-12	강승우	장명기	010-8623-8246	010-3123-4569	-
cmfkay8oz002k1084qn6e112r	t	2025-09-15 08:04:22.403+09	2025-09-15 08:04:22.403+09	동원시화피자	동원LOEX 시화물류센터(주간)	경기 시흥시 정왕동 2209	경기 시흥시 오이도로 22-12	김태현	-	010-8256-2882	-	-
cmfkay8os002g1084028wodiv	t	2025-09-15 08:04:22.397+09	2025-09-18 09:17:54.33543+09	동원백암(야간)	동원LOEX 백암물류센터(저온야간)	경기 용인시 처인구 백암면 백봉리 859	경기 용인시 처인구 백암면 원설로 445	전영철	하승환	01063318525	01033284646	차단기 지나서 오른쪽 아래 지하층. \r\n35번도크 옆 계단. 오른쪽 동원사무실\r\n납품 후 전표 사진 (무인납시 제품하차사진 포함)\r\n전표 담당자에게 보내주시면 됩니다.
cmfm839sb0003ajlt56unpgf6	t	2025-09-16 16:19:50.603+09	2025-09-16 16:19:50.603+09	한성로직스(시판)	한성로직스	경기 용인시 처인구 마평동 538	경기 용인시 처인구 중부대로1576번길 16	김연수	-	010-4471-1332	-	차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크
cmfm839sd0004ajltdbf3iats	t	2025-09-16 16:19:50.605+09	2025-09-16 16:19:50.605+09	한성로직스(케이터링)	한성로직스	경기 용인시 처인구 마평동 539	경기 용인시 처인구 중부대로1576번길 17	오새명	\N	010-8233-2220	\N	차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크
cmfm839se0005ajltiuakfwbz	t	2025-09-16 16:19:50.607+09	2025-09-16 16:19:50.607+09	한성로직스(용차)	한성로직스	경기 용인시 처인구 마평동 540	경기 용인시 처인구 중부대로1576번길 18	김선우	-	010-4446-6679	-	요금
cmfm839sg0006ajltuz5e30ih	t	2025-09-16 16:19:50.609+09	2025-09-16 16:19:50.609+09	한성로직스(상온)	한성로직스	경기 용인시 처인구 마평동 541	경기 용인시 처인구 중부대로1576번길 19	김선우	-	010-4446-6679	-	차단기 지나 우측 파란선따라 2번 올라가면(굴다리지남) 좌측에 A5라고 바닥에 기재되어있음
cmfm839si0007ajltj88psvek	t	2025-09-16 16:19:50.61+09	2025-09-16 16:19:50.61+09	한성로직스(이마트)	한성로직스	경기 용인시 처인구 마평동 542	경기 용인시 처인구 중부대로1576번길 20	김용회	-	010-2475-8802	-	요금
cmfm839sk0008ajlt9yjzmsgr	t	2025-09-16 16:19:50.612+09	2025-09-17 07:57:30.195861+09	한성로직스(용차)	한성로직스(냉동/냉장)	경기 용인시 처인구 마평동 543	경기 용인시 처인구 중부대로1576번길 21	이민상(냉동)	배현수(냉장)	01093612271	01065356837	냉동 : 차단기 지나 분홍선 따라 3번올라가면 B2지하4층 6~9번도크\n\n냉장 : 차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크
cmfm839sl0009ajlthrsixzrl	f	2025-09-16 16:19:50.614+09	2025-09-17 07:57:48.450336+09	한성로직스(용차)	한성로직스(냉장)	경기 용인시 처인구 마평동 544	경기 용인시 처인구 중부대로1576번길 22	배현수	-	01065356837		차단기 지나 분홍선 따라 2번올라가면 B1지하5층 6~9번도크
cmfm839so000aajltowdlt84y	t	2025-09-16 16:19:50.616+09	2025-09-16 16:19:50.616+09	한성로직스(동원홈푸드)	한성로직스	경기 용인시 처인구 마평동 545	경기 용인시 처인구 중부대로1576번길 23	\N	-	\N	-	요금
\.


--
-- Data for Name: region_aliases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.region_aliases (id, "rawText", "normalizedText", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requests (id, "requestDate", "centerCarNo", "vehicleTon", regions, stops, notes, "extraAdjustment", "adjustmentReason", "createdAt", "updatedAt", "createdBy", center_id) FROM stdin;
cmfoppr690001r78meikb1wg1	2025-09-18	C001	3.5	["서울", "경기"]	2	테스트 요청	0	\N	2025-09-18 10:08:45.393+09	2025-09-18 10:08:45.393+09	\N	2
\.


--
-- Data for Name: route_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.route_templates (id, name, "loadingPoint", distance, "driverFare", "billingFare", "weekdayPattern", "defaultDriverId", "isActive", "createdAt", "updatedAt", "loadingPointId") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: settlement_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlement_items (id, "settlementId", type, description, amount, date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: settlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settlements (id, "yearMonth", "driverId", status, "totalTrips", "totalBaseFare", "totalDeductions", "totalAdditions", "finalAmount", "confirmedAt", "confirmedBy", "paidAt", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password, role, "isActive", "createdAt", "updatedAt", "lastLogin") FROM stdin;
cmfkappzk0001erc0kub3iskc	dispatcher@logistics.com	배차담당자	$2a$12$/j9RT28azfyykWyEMPpGRupyO9GL8OhXHnmMLwGpwAIaclkLyp7.a	DISPATCHER	t	2025-09-15 07:57:44.913+09	2025-09-15 07:57:44.913+09	\N
cmfkapq7h0002erc0pwrxrpmj	accountant@logistics.com	정산담당자	$2a$12$RogjsmSGzCF9kCl.Ga1/kObSlmU5ffe4FVTa0jGWI/bvlRp.k8sqG	ACCOUNTANT	t	2025-09-15 07:57:45.198+09	2025-09-15 07:57:45.198+09	\N
cmfkappr50000erc0bzin67q5	admin123@logistics.com	관리자2	$2a$12$fB7TdS97Cphf1AhVkLtbkucEywqRKrURbc3NxfgaasDJ1VS.d71qC	ADMIN	t	2025-09-15 07:57:44.609+09	2025-09-16 15:50:02.271+09	2025-09-16 15:50:02.27+09
cmfkappr50000erc0bzin67q4	admin@logistics.com	관리자	$2a$12$fB7TdS97Cphf1AhVkLtbkucEywqRKrURbc3NxfgaasDJ1VS.d71qC	ADMIN	t	2025-09-15 07:57:44.609+09	2025-09-18 04:40:24.539+09	2025-09-18 04:40:24.538+09
\.


--
-- Data for Name: verificationtokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verificationtokens (identifier, token, expires) FROM stdin;
\.


--
-- Name: centers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.centers_id_seq', 10, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: center_fares center_fares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.center_fares
    ADD CONSTRAINT center_fares_pkey PRIMARY KEY (id);


--
-- Name: centers centers_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT centers_name_key UNIQUE (name);


--
-- Name: centers centers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.centers
    ADD CONSTRAINT centers_pkey PRIMARY KEY (id);


--
-- Name: charter_destinations charter_destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_destinations
    ADD CONSTRAINT charter_destinations_pkey PRIMARY KEY (id);


--
-- Name: charter_requests charter_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_requests
    ADD CONSTRAINT charter_requests_pkey PRIMARY KEY (id);


--
-- Name: dispatches dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT dispatches_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: fixed_contracts fixed_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_contracts
    ADD CONSTRAINT fixed_contracts_pkey PRIMARY KEY (id);


--
-- Name: loading_points loading_points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loading_points
    ADD CONSTRAINT loading_points_pkey PRIMARY KEY (id);


--
-- Name: region_aliases region_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.region_aliases
    ADD CONSTRAINT region_aliases_pkey PRIMARY KEY (id);


--
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- Name: route_templates route_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route_templates
    ADD CONSTRAINT route_templates_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: settlement_items settlement_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_items
    ADD CONSTRAINT settlement_items_pkey PRIMARY KEY (id);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: audit_logs_action_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_action_createdAt_idx" ON public.audit_logs USING btree (action, "createdAt");


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_entityType_entityId_idx" ON public.audit_logs USING btree ("entityType", "entityId");


--
-- Name: audit_logs_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "audit_logs_userId_createdAt_idx" ON public.audit_logs USING btree ("userId", "createdAt");


--
-- Name: center_fares_centerName_vehicleType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "center_fares_centerName_vehicleType_idx" ON public.center_fares USING btree ("centerName", "vehicleType");


--
-- Name: center_fares_centerName_vehicleType_region_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "center_fares_centerName_vehicleType_region_key" ON public.center_fares USING btree ("centerName", "vehicleType", region);


--
-- Name: center_fares_region_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX center_fares_region_idx ON public.center_fares USING btree (region);


--
-- Name: charter_destinations_requestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charter_destinations_requestId_idx" ON public.charter_destinations USING btree ("requestId");


--
-- Name: charter_destinations_requestId_order_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "charter_destinations_requestId_order_key" ON public.charter_destinations USING btree ("requestId", "order");


--
-- Name: charter_requests_centerId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charter_requests_centerId_date_idx" ON public.charter_requests USING btree ("centerId", date);


--
-- Name: charter_requests_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charter_requests_createdAt_idx" ON public.charter_requests USING btree ("createdAt");


--
-- Name: charter_requests_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX charter_requests_date_idx ON public.charter_requests USING btree (date);


--
-- Name: charter_requests_driverId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charter_requests_driverId_date_idx" ON public.charter_requests USING btree ("driverId", date);


--
-- Name: charter_requests_vehicleType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "charter_requests_vehicleType_idx" ON public.charter_requests USING btree ("vehicleType");


--
-- Name: dispatches_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispatches_createdAt_idx" ON public.dispatches USING btree ("createdAt");


--
-- Name: dispatches_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispatches_driverId_idx" ON public.dispatches USING btree ("driverId");


--
-- Name: dispatches_requestId_driverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispatches_requestId_driverId_idx" ON public.dispatches USING btree ("requestId", "driverId");


--
-- Name: dispatches_requestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "dispatches_requestId_idx" ON public.dispatches USING btree ("requestId");


--
-- Name: drivers_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "drivers_isActive_idx" ON public.drivers USING btree ("isActive");


--
-- Name: drivers_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX drivers_name_idx ON public.drivers USING btree (name);


--
-- Name: drivers_name_phone_vehicleNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "drivers_name_phone_vehicleNumber_key" ON public.drivers USING btree (name, phone, "vehicleNumber");


--
-- Name: drivers_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX drivers_phone_idx ON public.drivers USING btree (phone);


--
-- Name: drivers_vehicleNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "drivers_vehicleNumber_idx" ON public.drivers USING btree ("vehicleNumber");


--
-- Name: fixed_contracts_centerContractType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "fixed_contracts_centerContractType_idx" ON public.fixed_contracts USING btree ("centerContractType");


--
-- Name: fixed_contracts_driverContractType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "fixed_contracts_driverContractType_idx" ON public.fixed_contracts USING btree ("driverContractType");


--
-- Name: fixed_contracts_driverId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "fixed_contracts_driverId_isActive_idx" ON public.fixed_contracts USING btree ("driverId", "isActive");


--
-- Name: fixed_contracts_loadingPointId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "fixed_contracts_loadingPointId_isActive_idx" ON public.fixed_contracts USING btree ("loadingPointId", "isActive");


--
-- Name: fixed_contracts_loadingPointId_routeName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "fixed_contracts_loadingPointId_routeName_key" ON public.fixed_contracts USING btree ("loadingPointId", "routeName");


--
-- Name: idx_centers_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_centers_is_active ON public.centers USING btree (is_active);


--
-- Name: idx_centers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_centers_name ON public.centers USING btree (name);


--
-- Name: idx_driver_composite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_driver_composite ON public.drivers USING btree (name, phone, "vehicleNumber");


--
-- Name: idx_requests_center_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_requests_center_id ON public.requests USING btree (center_id);


--
-- Name: loading_points_centerName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "loading_points_centerName_idx" ON public.loading_points USING btree ("centerName");


--
-- Name: loading_points_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "loading_points_isActive_idx" ON public.loading_points USING btree ("isActive");


--
-- Name: loading_points_loadingPointName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "loading_points_loadingPointName_idx" ON public.loading_points USING btree ("loadingPointName");


--
-- Name: region_aliases_normalizedText_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "region_aliases_normalizedText_idx" ON public.region_aliases USING btree ("normalizedText");


--
-- Name: region_aliases_rawText_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "region_aliases_rawText_idx" ON public.region_aliases USING btree ("rawText");


--
-- Name: region_aliases_rawText_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "region_aliases_rawText_key" ON public.region_aliases USING btree ("rawText");


--
-- Name: requests_centerCarNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "requests_centerCarNo_idx" ON public.requests USING btree ("centerCarNo");


--
-- Name: requests_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "requests_createdAt_idx" ON public.requests USING btree ("createdAt");


--
-- Name: requests_requestDate_centerCarNo_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "requests_requestDate_centerCarNo_idx" ON public.requests USING btree ("requestDate", "centerCarNo");


--
-- Name: requests_requestDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "requests_requestDate_idx" ON public.requests USING btree ("requestDate");


--
-- Name: route_templates_defaultDriverId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "route_templates_defaultDriverId_idx" ON public.route_templates USING btree ("defaultDriverId");


--
-- Name: route_templates_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "route_templates_isActive_idx" ON public.route_templates USING btree ("isActive");


--
-- Name: route_templates_loadingPointId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "route_templates_loadingPointId_idx" ON public.route_templates USING btree ("loadingPointId");


--
-- Name: route_templates_loadingPoint_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "route_templates_loadingPoint_idx" ON public.route_templates USING btree ("loadingPoint");


--
-- Name: route_templates_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX route_templates_name_idx ON public.route_templates USING btree (name);


--
-- Name: route_templates_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX route_templates_name_key ON public.route_templates USING btree (name);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: settlement_items_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX settlement_items_date_idx ON public.settlement_items USING btree (date);


--
-- Name: settlement_items_settlementId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "settlement_items_settlementId_type_idx" ON public.settlement_items USING btree ("settlementId", type);


--
-- Name: settlements_driverId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "settlements_driverId_status_idx" ON public.settlements USING btree ("driverId", status);


--
-- Name: settlements_driverId_yearMonth_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "settlements_driverId_yearMonth_key" ON public.settlements USING btree ("driverId", "yearMonth");


--
-- Name: settlements_status_confirmedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "settlements_status_confirmedAt_idx" ON public.settlements USING btree (status, "confirmedAt");


--
-- Name: settlements_yearMonth_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "settlements_yearMonth_status_idx" ON public.settlements USING btree ("yearMonth", status);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: verificationtokens_identifier_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verificationtokens_identifier_token_key ON public.verificationtokens USING btree (identifier, token);


--
-- Name: verificationtokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX verificationtokens_token_key ON public.verificationtokens USING btree (token);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: charter_destinations charter_destinations_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_destinations
    ADD CONSTRAINT "charter_destinations_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.charter_requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: charter_requests charter_requests_centerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_requests
    ADD CONSTRAINT "charter_requests_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES public.loading_points(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: charter_requests charter_requests_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_requests
    ADD CONSTRAINT "charter_requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: charter_requests charter_requests_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charter_requests
    ADD CONSTRAINT "charter_requests_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: dispatches dispatches_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT "dispatches_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: dispatches dispatches_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dispatches
    ADD CONSTRAINT "dispatches_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public.requests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: fixed_contracts fixed_contracts_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_contracts
    ADD CONSTRAINT "fixed_contracts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fixed_contracts fixed_contracts_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_contracts
    ADD CONSTRAINT "fixed_contracts_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: fixed_contracts fixed_contracts_loadingPointId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_contracts
    ADD CONSTRAINT "fixed_contracts_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES public.loading_points(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: requests fk_request_center; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT fk_request_center FOREIGN KEY (center_id) REFERENCES public.centers(id);


--
-- Name: requests requests_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT "requests_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: route_templates route_templates_defaultDriverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route_templates
    ADD CONSTRAINT "route_templates_defaultDriverId_fkey" FOREIGN KEY ("defaultDriverId") REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: route_templates route_templates_loadingPointId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.route_templates
    ADD CONSTRAINT "route_templates_loadingPointId_fkey" FOREIGN KEY ("loadingPointId") REFERENCES public.loading_points(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: settlement_items settlement_items_settlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlement_items
    ADD CONSTRAINT "settlement_items_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES public.settlements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: settlements settlements_confirmedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT "settlements_confirmedBy_fkey" FOREIGN KEY ("confirmedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: settlements settlements_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT "settlements_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: settlements settlements_driverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT "settlements_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES public.drivers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict RKGtClmhYaTrF691BbzRRHAsP89hfrvJOL0nanIL8hwcYCBxkNrq6efPt9KiRXQ

