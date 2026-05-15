--
-- PostgreSQL database dump
--

\restrict 29gB0IGAcMj9zjsXfKgFfCdfAbT3P6WjYRchZsn2pxXHhDYrV2Ehp4ptR7cG9BS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.8 (Debian 17.8-0+deb13u1)

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
-- Data for Name: authorities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.authorities (id, authority_name, email, password) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, report_type) FROM stdin;
1	Hazard
2	Infrastructure
\.


--
-- Data for Name: citizens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citizens (id, name, email, password) FROM stdin;
1	Local Test	localtest1771130779@example.com	pbkdf2_sha256$1000000$Q57J3VN6EJV8yqF6z0jKeg$Fi1L9BA454Pv326bXL+4imJ10Wi8JwTdcgKVqazF/PA=
2	Cy	cmalesido6@example.com	pbkdf2_sha256$1000000$MPMPCLXfr58FfBEnZLXAPs$heHeV9vXP1D9sHDg2N4SwtwnajzI93wG/tEMC31ESfk=
\.


--
-- Data for Name: status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.status (id, code) FROM stdin;
1	pending
2	approved
3	in_progress
4	rejected
5	resolved
\.


--
-- Data for Name: sub_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sub_categories (id, sub_category, report_type_id, authority_id) FROM stdin;
1	ROAD_DAMAGE	2	\N
2	STREETLIGHTS	2	\N
3	SIDEWALKS	2	\N
4	BUILDING	2	\N
5	BRIDGE	2	\N
6	STRUCTURAL_COLLAPSE	2	\N
7	SAFETY_SECURITY	2	\N
8	INFRA_OTHER	2	\N
9	FLOODING	1	\N
10	LANDSLIDE	1	\N
11	FIRE_HAZARD	1	\N
12	ELECTRICAL_HAZARD	1	\N
13	FALLEN_TREES	1	\N
14	ROAD_ACCIDENT	1	\N
15	BLOCKED_DRAINAGE	1	\N
16	EARTHQUAKE	1	\N
17	SINKHOLE	1	\N
18	PUBLIC_HEALTH	1	\N
19	HAZARD_OTHER	1	\N
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, title, description, latitude, longitude, created_at, citizen_id, report_type_id, status_id, sub_category_id) FROM stdin;
\.


--
-- Data for Name: report_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_images (id, image, created_at, report_id) FROM stdin;
\.


--
-- Name: authorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.authorities_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: citizens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citizens_id_seq', 2, true);


--
-- Name: report_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.report_images_id_seq', 1, false);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- Name: status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.status_id_seq', 5, true);


--
-- Name: sub_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sub_categories_id_seq', 19, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 29gB0IGAcMj9zjsXfKgFfCdfAbT3P6WjYRchZsn2pxXHhDYrV2Ehp4ptR7cG9BS

