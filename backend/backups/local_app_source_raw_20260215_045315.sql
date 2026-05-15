--
-- PostgreSQL database dump
--

\restrict hHbbDodmxImDVO7Evy7JBMjEP8okdp6BvpcyLFyHG9E9M2DCKqnq3zLbaD4X9Xs

-- Dumped from database version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)
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
4	MDRRMO	mdrrmo@safewayz.ph	pbkdf2_sha256$1000000$EF7Tdnhn7Mk8LbcEuCLCLq$XCEp3KyoXKEGzk02ANKeEzx1bm/kF2jZKbvaSmgPlcw=
3	DPWH	dpwh@safewayz.ph	pbkdf2_sha256$1000000$DPCC6WMVxWYEayRKLjatMB$wI69Hvotr4EGvCWpFI/cEfubHeLI0rVfyH8Zk71YGfM=
5	Municipal Engineering Office	meo@safewayz.ph	pbkdf2_sha256$1000000$NPQzvfLnpEkSRtE5znGubb$6n2E5K+5Ynl2JpvUMaimnqxslV3TLTrw/rNbwwae564=
6	Philippine National Police	pnp@safewayz.ph	pbkdf2_sha256$1000000$URDzuk7nnq2Gv4Tt04vwFb$hLZSuAcvn+v9UDyE7bamdOM/Uzt+j0He1dQpzSt2OQA=
7	Bureau of Fire Protection	bfp@safewayz.ph	pbkdf2_sha256$1000000$tRc6VcG5VQiJ8CEuTUC0OC$v+d79rB3U4i3Rb2UqB8wsCPwsGDWvn8/ozoNPAN2C4k=
8	Municipal Health Office	mho@safewayz.ph	pbkdf2_sha256$1000000$CWajkD5GB6alW8whrsqxlo$dj+GZybhyjrjp3/irIJXb/wSAeVIKrUpbzLDu80hHy8=
9	Municipal Mayor Office	mmo@safewayz.ph	pbkdf2_sha256$1000000$ldvwq8940ANBzO7jFFJE1F$CH+NAQLTNDwbOY5ToYAOD6D2rg0VKmlWvzC4DGjxsHo=
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
1	Cy	cyrine@example.com	cute123
2	cmalesido	cmalesido1@example.com	pbkdf2_sha256$1000000$ng7Zn50sW4KxS1mfIxuuj9$/6X9c3b9JEVN0zNrEgEFHMW6rWT9krVPQbJUjztVhyE=
3	Cutie Pie	cutiepie@example.com	pbkdf2_sha256$1000000$tXengPTFrGCo1wPnoRAnTl$iN6fTSQhsOVY0yX2v4M2O6hoLwg5pWd/Ia787EMgUhU=
4	Test User	testlogout@example.com	pbkdf2_sha256$1000000$GEH4xMZfTjxnqZEaHIyOnm$EJVo5FYByeLRIPjf+ODvsM7rOYcJG43nX7Mptb2hw3w=
5	kenny@example.com	kenny@example.com	pbkdf2_sha256$1000000$WWVFeSK613LWDK9SqYf5pQ$4DiLMRB/OrZ9qCEuACIEHlCdIU2gyEIXui1DTAp1vGI=
6	Cyrine	cmalesido5@example.com	pbkdf2_sha256$1000000$LqYMr1ayQBxroCx5NyYiVC$PRlVNSN4LJx3LijzDeFsI/Nd1NtIxC1o/t4nL3jQdP4=
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
1	FLOODING	1	4
2	LANDSLIDE	1	4
3	FIRE_HAZARD	1	7
4	ELECTRICAL_HAZARD	1	9
5	FALLEN_TREES	1	3
6	ROAD_ACCIDENT	1	6
7	BLOCKED_DRAINAGE	1	5
8	EARTHQUAKE	1	4
9	SINKHOLE	1	4
10	PUBLIC_HEALTH	1	8
11	HAZARD_OTHER	1	4
12	ROAD_DAMAGE	2	3
13	STREETLIGHTS	2	9
14	SIDEWALKS	2	3
15	BUILDING	2	5
16	BRIDGE	2	3
17	STRUCTURAL_COLLAPSE	2	5
18	SAFETY_SECURITY	2	6
19	INFRA_OTHER	2	9
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, citizen_id, report_type_id, sub_category_id, title, description, latitude, longitude, created_at, status_id) FROM stdin;
1	3	1	4	dfd	dfd	14.758500	120.949300	2025-11-24 20:50:59.130815+08	1
4	3	1	1	naay baha sa pi garcia kay nangihi ko	joke lang	11.560636	124.392185	2025-11-24 21:12:52.977128+08	1
5	3	2	13	Way Kuryente	\N	10.309900	123.893000	2025-11-25 18:48:14.582687+08	1
6	5	2	13	Way kuryente	\N	10.309900	123.893000	2025-11-25 18:49:24.398619+08	1
7	5	1	7	aasdas	\N	10.309900	123.893000	2025-11-25 18:58:43.429472+08	1
8	5	1	7	Kenny Report	\N	10.309900	123.893000	2025-11-25 19:09:29.201811+08	1
2	3	1	8	Baha	xc	14.758500	120.949300	2025-11-24 20:56:13.753198+08	2
9	3	1	1	Baha	\N	11.562507	124.394454	2025-11-25 19:14:12.36236+08	4
3	3	1	1	naay baha	naay baha dires bipsu second gate	11.562864	124.400854	2025-11-24 21:07:39.828446+08	3
10	6	1	1	Baha	Dang baha	11.002700	124.608300	2026-01-08 17:41:09.198059+08	5
11	6	2	12	Guba na dalan	oh no	10.338700	123.899800	2026-01-10 17:07:34.348997+08	5
12	6	1	1	Baha	\N	11.563537	124.394674	2026-01-10 18:19:54.259574+08	1
14	6	2	13	Guba suga	\N	11.562780	124.399567	2026-01-10 18:21:10.539861+08	1
13	6	1	2	Landslide	\N	11.563453	124.397507	2026-01-10 18:20:22.968637+08	3
15	6	1	7	Wow	asdagdhaethaeh	14.577700	121.119000	2026-02-15 10:27:42.564061+08	5
16	6	1	1	May baha	Oh no baha	14.577700	121.119000	2026-02-15 12:21:57.653054+08	1
\.


--
-- Data for Name: report_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.report_images (id, image, created_at, report_id) FROM stdin;
1	reports/2026/02/15/bipsudostisko.jpeg	2026-02-15 10:27:42.571306+08	15
2	reports/2026/02/15/Facebook_logo_PNG12.png	2026-02-15 12:21:58.797858+08	16
\.


--
-- Name: api_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_status_id_seq', 5, true);


--
-- Name: authorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.authorities_id_seq', 9, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 2, true);


--
-- Name: citizens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.citizens_id_seq', 6, true);


--
-- Name: report_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.report_images_id_seq', 2, true);


--
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reports_id_seq', 16, true);


--
-- Name: sub_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sub_categories_id_seq', 19, true);


--
-- PostgreSQL database dump complete
--

\unrestrict hHbbDodmxImDVO7Evy7JBMjEP8okdp6BvpcyLFyHG9E9M2DCKqnq3zLbaD4X9Xs

