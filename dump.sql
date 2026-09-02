--
-- PostgreSQL database dump
--

\restrict rE155XjbR75uC2Y3c0ZnD44ixF2tfHL4fM4bCw5nmyQ6AKBjU50PG4PVGKNL798

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CurrencyType; Type: TYPE; Schema: public; Owner: clicker_admin
--

CREATE TYPE public."CurrencyType" AS ENUM (
    'TON',
    'STARS'
);


ALTER TYPE public."CurrencyType" OWNER TO clicker_admin;

--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: clicker_admin
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public."TransactionStatus" OWNER TO clicker_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: clicker_admin
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO clicker_admin;

--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: clicker_admin
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount double precision NOT NULL,
    currency public."CurrencyType" NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    payload text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO clicker_admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: clicker_admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    points bigint DEFAULT 0 NOT NULL,
    "unclaimedPoints" bigint DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    "passiveRate" integer DEFAULT 0 NOT NULL,
    nonce integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO clicker_admin;

--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: clicker_admin
--

COPY public."ChatMessage" (id, "userId", role, content, "createdAt") FROM stdin;
b0616455-3467-4dfc-bcc9-174bb742665c	guest_user_demo_1337	user	lfdfq	2026-09-02 12:13:46.699
f4f09075-8b30-410f-b4eb-84b59a069980	guest_user_demo_1337	user	привет	2026-09-02 12:31:10.037
8defbbaa-ab3c-487d-8d2c-8167d359109b	guest_user_demo_1337	user	ааа	2026-09-02 12:31:14.471
fe2071e3-25f7-4a8a-9629-e249d2561bb7	guest_user_demo_1337	user	привет	2026-09-02 12:34:33.028
9f03724a-03d3-4c1f-bf90-ef5a24c9c8e3	guest_user_demo_1337	user	кот	2026-09-02 12:47:11.711
9c6a0a71-94fc-46b0-8d9e-82ec131928d9	guest_user_demo_1337	user	присет!	2026-09-02 12:51:00.614
cfa6a0c2-1f87-46b0-8a87-c50bb660d876	guest_user_demo_1337	user	куку	2026-09-02 12:51:14.826
b7d6675e-4a6a-41c4-a402-02a6a587b63a	guest_user_demo_1337	user	ghbdtn	2026-09-02 12:53:01.982
5a09a53f-86a1-4701-a382-da6f0fe890c1	guest_user_demo_1337	user	привет!	2026-09-02 12:54:18.673
5264301f-1ab5-4bfc-83b0-5726821029eb	guest_user_demo_1337	user	привет	2026-09-02 13:00:45.661
e0dd0712-03e7-416a-9cfd-64ec46a72c43	guest_user_demo_1337	user	Привет 	2026-09-02 13:14:32.87
984be9af-ffbd-45da-9533-6f09e5a8d802	guest_user_demo_1337	user	Привет!	2026-09-02 13:18:45.1
e53ed692-f471-4775-b8e4-c0b42e3e043b	guest_user_demo_1337	user	Привет!	2026-09-02 13:19:18.408
0e092b6e-9426-4f15-8436-bc64d2dbe9e8	guest_user_demo_1337	user	Привет 	2026-09-02 13:19:24.374
50370533-1111-4a30-8eef-f4bd8dc5e77f	guest_user_demo_1337	user	Ау	2026-09-02 13:19:51.133
34c7e0bd-6778-4241-9420-8b88ea1dd626	guest_user_demo_1337	user	Привет 	2026-09-02 13:24:17.885
937fc2a4-1cf0-483c-812f-fdbf69d9c1b7	guest_user_demo_1337	user	Рооо	2026-09-02 13:24:25.366
787d6cac-85d5-475e-9151-4d825b7beefd	guest_user_demo_1337	user	При	2026-09-02 13:27:13.697
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: clicker_admin
--

COPY public."Transaction" (id, "userId", amount, currency, status, payload, "createdAt") FROM stdin;
d1549171-0d7d-4dcf-bf02-e8d760ec7be7	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_6e5b7480	2026-09-02 10:49:51.304
889a4022-a5f8-430e-8265-609b78d913a1	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_679ea1b7	2026-09-02 10:49:56.021
f557f2da-09e6-4f24-91cf-48dbf8b02684	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_7419ddff	2026-09-02 10:50:54.902
c9b32966-a44c-4e00-aec4-8c36418fdb0f	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_83cb5fba	2026-09-02 10:50:57.662
b541e23b-ca2d-478f-8b49-ba78dd18ea2e	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_85947cd1	2026-09-02 11:44:15.269
401f592f-2aba-42f2-a5d3-73c244b240c9	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_7e96e7aa	2026-09-02 11:44:20.001
363690d8-e831-4afd-be67-40f3a0f21d68	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_2aafbb7b	2026-09-02 11:45:38.761
8754d199-8434-453f-bbf4-859980464bcb	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_ea5321cd	2026-09-02 11:45:41.078
98c2869e-417a-442c-881a-d99ea38e8ca8	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_56667131	2026-09-02 11:46:48.518
5172d250-1142-40c0-8aa0-71a388dadf3c	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_df833a06	2026-09-02 11:46:52.55
5c79fa38-c8f9-419b-8ec5-11c67268b2be	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_23b16097	2026-09-02 11:53:23.445
faccd215-a55f-41ce-bb56-bba3ca17310b	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_f8b1af2f	2026-09-02 11:53:25.657
50269262-f240-469b-85a9-14e624973cfb	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_aef70f02	2026-09-02 11:54:02.408
e891290f-4195-4e18-8707-aac8831210f2	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_6495f30d	2026-09-02 11:54:04.789
6b5c7f03-b2ea-4f29-9961-e3ebb143b9b4	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_16090382	2026-09-02 12:31:18.914
88f37e20-83ff-4d2c-ae63-fd375295f716	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_ebdd297d	2026-09-02 12:31:20.737
559a74e9-9fc8-492e-b9fc-5d931160dd6b	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_9ef0e0f7	2026-09-02 12:35:33.955
165c7eed-854a-4d72-84a7-438d9bf2a50c	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_542203b0	2026-09-02 12:35:35.93
2833783e-b0a4-454f-87b0-137eb6b1bce4	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_1272b989	2026-09-02 13:06:59.97
0c8a02a5-c83e-4920-8011-60171b265e7b	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_f3ea859a	2026-09-02 13:07:02.46
7f4c7b13-431c-4301-94dd-c4d99c352dcd	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_2d262f09	2026-09-02 13:07:13.563
38c62449-90b1-4347-afba-a91489df6d23	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_b0061b2e	2026-09-02 13:14:22.542
9bc1b7bd-49b8-4ca0-96de-9091e63ba8b6	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_55804adb	2026-09-02 13:14:24.571
2d3393aa-01ff-4cb9-b9c8-ee73dc1f952c	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_d710c0dd	2026-09-02 13:18:58.702
a302dfbb-f6ab-40f0-bc53-3233b79d0f68	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_59b79827	2026-09-02 13:19:04.45
494b0b57-24bf-4908-ad0f-088d5057a1e0	guest_user_demo_1337	50	STARS	PENDING	stars_cat_level_up_04716818	2026-09-02 13:19:54.113
4c3885b5-c465-43be-9c37-cbf37df6cfbd	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_9470ab90	2026-09-02 13:19:56.871
003d0c2e-3021-40d8-99e0-dce889d6892b	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_51fddc50	2026-09-02 14:08:36.395
74081fe7-f737-4b44-a125-9b592597648b	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_ddc6d2ae	2026-09-02 14:11:48.658
df649e83-6907-46f3-bdeb-6aa14c18f1e9	guest_user_demo_1337	0.5	TON	PENDING	cat_boost_x2_86601e95	2026-09-02 15:15:09.458
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: clicker_admin
--

COPY public."User" (id, points, "unclaimedPoints", level, "passiveRate", nonce, "createdAt", "updatedAt") FROM stdin;
guest_user_demo_1337	710	710	1	0	0	2026-09-02 10:31:26.946	2026-09-02 15:34:01.113
\.


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: clicker_admin
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: clicker_admin
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: clicker_admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicker_admin
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: clicker_admin
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict rE155XjbR75uC2Y3c0ZnD44ixF2tfHL4fM4bCw5nmyQ6AKBjU50PG4PVGKNL798

