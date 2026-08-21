-- ============================================================================
-- VERIFAI — AI-Assisted Fake Identity & Document Screening System
-- Supabase PostgreSQL schema.sql
--
-- NOTE: No repository, README/PRD/ARCHITECTURE/API_CONTRACT files, or frontend
-- code were found in this environment to cross-check against, so there is
-- nothing to report a conflict against. This schema implements the spec
-- exactly as given by the Team Lead in this conversation. If those docs exist
-- elsewhere in your actual repo and diverge from this, treat this file as a
-- proposal to be diffed against them, not an override.
--
-- Safe to run top-to-bottom on a fresh Supabase project (SQL editor or CLI).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('officer', 'reviewer', 'admin');

create type document_type as enum ('passport', 'visa', 'national_id', 'driving_licence', 'permit');

create type screening_status as enum ('processing', 'completed', 'manual_review', 'approved', 'rejected', 'failed');

create type risk_level as enum ('low', 'medium', 'high');

create type doc_processing_status as enum ('uploaded', 'processing', 'processed', 'failed');

create type ocr_processing_status as enum ('pending', 'completed', 'failed');

create type validation_status as enum ('pass', 'fail', 'warning');

create type face_verification_status as enum (
  'not_required', 'face_not_detected', 'multiple_faces',
  'poor_quality', 'match', 'uncertain', 'mismatch'
);

create type reference_status as enum ('active', 'expired', 'revoked', 'blacklisted', 'unknown');

-- ----------------------------------------------------------------------------
-- 2. PROFILES  (extends auth.users — never store credentials here)
-- ----------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  officer_id    text unique,                 -- human-readable badge/officer ID shown in UI
  display_name  text not null,
  role          user_role not null default 'officer',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table profiles is 'Application-level profile linked 1:1 to auth.users. No passwords or credentials stored here — Supabase Auth owns those.';

-- ----------------------------------------------------------------------------
-- 3. SCREENINGS  (central hub table)
-- ----------------------------------------------------------------------------
create table screenings (
  id                 uuid primary key default gen_random_uuid(),
  screening_number   text unique not null,       -- human-readable ID, e.g. VF-2026-000001
  created_by         uuid not null references profiles(id) on delete restrict,
  document_type      document_type not null,
  status             screening_status not null default 'processing',
  risk_level         risk_level,                 -- populated once risk_assessments completes
  final_action       text check (final_action in ('approved', 'rejected', 'manual_review')),
  reviewed_by        uuid references profiles(id) on delete set null,
  reviewed_at        timestamptz,
  review_notes       text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  completed_at       timestamptz
);

comment on table screenings is 'One row per screening operation. Hub table — never hard-deleted, only status-transitioned. risk_level is denormalized here for fast dashboard filtering but the authoritative record is risk_assessments.';

-- Human-readable screening_number generator
create sequence screening_number_seq;

create or replace function generate_screening_number()
returns trigger language plpgsql as $$
begin
  if new.screening_number is null then
    new.screening_number := 'VF-' || to_char(now(), 'YYYY') || '-' ||
                             lpad(nextval('screening_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_screening_number
before insert on screenings
for each row execute function generate_screening_number();

-- ----------------------------------------------------------------------------
-- 4. DOCUMENTS  (screenings 1 → many documents; files live in Storage)
-- ----------------------------------------------------------------------------
create table documents (
  id                 uuid primary key default gen_random_uuid(),
  screening_id       uuid not null references screenings(id) on delete cascade,
  document_type      document_type not null,
  original_filename  text not null,
  storage_path       text not null unique,     -- e.g. {screening_id}/{document_id}-{filename} in bucket identity-documents
  mime_type          text,
  file_size_bytes    bigint,
  checksum_sha256    text,
  processing_status  doc_processing_status not null default 'uploaded',
  uploaded_at        timestamptz not null default now()
);

comment on table documents is 'Metadata + Storage path only. The binary file lives in the private identity-documents bucket, never in Postgres.';

-- ----------------------------------------------------------------------------
-- 5. OCR_RESULTS
-- ----------------------------------------------------------------------------
create table ocr_results (
  id                 uuid primary key default gen_random_uuid(),
  screening_id       uuid not null references screenings(id) on delete cascade,
  document_id        uuid not null references documents(id) on delete cascade,
  extracted_data     jsonb not null default '{}'::jsonb,   -- shape varies by document_type, matches API contract
  confidence         numeric(5,4) check (confidence between 0 and 1),
  raw_text           text,                                  -- SENSITIVE: contains PII, exclude from dashboard views
  processing_status  ocr_processing_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (document_id)   -- latest-only result per document; re-run = upsert
);

comment on column ocr_results.raw_text is 'Sensitive: full extracted text may include PII beyond structured fields. Never expose in dashboard/aggregate views.';

-- ----------------------------------------------------------------------------
-- 6. VALIDATION_RESULTS
-- ----------------------------------------------------------------------------
create table validation_results (
  id                 uuid primary key default gen_random_uuid(),
  screening_id       uuid not null references screenings(id) on delete cascade,
  document_id        uuid not null references documents(id) on delete cascade,
  overall_status     validation_status not null,
  validation_score   numeric(5,4) check (validation_score between 0 and 1),
  checks             jsonb not null default '[]'::jsonb,   -- individual rule outcomes
  issues             jsonb not null default '[]'::jsonb,   -- warnings/errors, e.g. "expired document"
  created_at         timestamptz not null default now(),
  unique (document_id)
);

-- ----------------------------------------------------------------------------
-- 7. TAMPERING_RESULTS
-- ----------------------------------------------------------------------------
create table tampering_results (
  id                   uuid primary key default gen_random_uuid(),
  screening_id         uuid not null references screenings(id) on delete cascade,
  document_id          uuid not null references documents(id) on delete cascade,
  tampering_detected   boolean not null default false,
  tampering_score      numeric(5,4) check (tampering_score between 0 and 1),
  indicators           jsonb not null default '[]'::jsonb,   -- e.g. ["photo_region_anomaly"]
  model_version        text,
  created_at           timestamptz not null default now(),
  unique (document_id)
);

comment on column tampering_results.tampering_detected is 'AI-assisted signal only — NOT proof of fraud. Always present alongside risk_assessments explanation, never used alone as a decision.';

-- ----------------------------------------------------------------------------
-- 8. FACE_VERIFICATIONS  (no raw embeddings stored — result/score only)
-- ----------------------------------------------------------------------------
create table face_verifications (
  id                 uuid primary key default gen_random_uuid(),
  screening_id       uuid not null references screenings(id) on delete cascade,
  document_id        uuid not null references documents(id) on delete cascade,
  status             face_verification_status not null default 'not_required',
  similarity_score   numeric(5,4) check (similarity_score between 0 and 1),
  quality_info       jsonb default '{}'::jsonb,
  failure_reason     text,
  created_at         timestamptz not null default now(),
  unique (document_id)
);

comment on table face_verifications is 'Stores comparison RESULT only. Raw facial embeddings/biometric vectors are intentionally not persisted, to minimize stored biometric data.';

-- ----------------------------------------------------------------------------
-- 9. RISK_ASSESSMENTS  (final explainable output, one per screening)
-- ----------------------------------------------------------------------------
create table risk_assessments (
  id                     uuid primary key default gen_random_uuid(),
  screening_id           uuid not null unique references screenings(id) on delete cascade,
  risk_score             numeric(5,2) not null,
  risk_level             risk_level not null,
  contributing_factors   jsonb not null default '{}'::jsonb,  -- e.g. {"ocr_confidence":0.97,"tampering_score":0.42,...}
  explanation            text,
  model_version          text,
  created_at             timestamptz not null default now()
);

comment on table risk_assessments is 'Decision support only, not proof of fraud. screenings.risk_level is denormalized from here for dashboard speed; this table is the source of truth.';

-- Keep screenings.risk_level in sync with risk_assessments
create or replace function sync_screening_risk_level()
returns trigger language plpgsql as $$
begin
  update screenings set risk_level = new.risk_level, updated_at = now()
  where id = new.screening_id;
  return new;
end;
$$;

create trigger trg_sync_risk_level
after insert or update on risk_assessments
for each row execute function sync_screening_risk_level();

-- ----------------------------------------------------------------------------
-- 10. AUDIT_LOGS  (append-only, 1:N against screenings)
-- ----------------------------------------------------------------------------
create table audit_logs (
  id                uuid primary key default gen_random_uuid(),
  screening_id      uuid not null references screenings(id) on delete restrict,
  actor_id          uuid references profiles(id) on delete set null,
  action            text not null,   -- e.g. SCREENING_CREATED, DOCUMENT_UPLOADED, APPROVED, REJECTED
  previous_status   text,
  new_status        text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

comment on table audit_logs is 'Append-only. No UPDATE/DELETE policy is defined for any client role — enforced by RLS below plus absence of update/delete grants.';

-- ----------------------------------------------------------------------------
-- 11. REFERENCE_RECORDS  (mock/prototype registry — NOT a real government DB)
-- ----------------------------------------------------------------------------
create table reference_records (
  id               uuid primary key default gen_random_uuid(),
  document_type    document_type not null,
  document_number  text not null,
  status           reference_status not null default 'unknown',
  holder_name      text,
  expiry_date      date,
  flags            jsonb not null default '[]'::jsonb,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (document_type, document_number)
);

comment on table reference_records is 'PROTOTYPE / MOCK DATA ONLY. Simulates an external registry lookup for the hackathon demo. This is NOT a live government database integration.';

-- ----------------------------------------------------------------------------
-- 12. updated_at auto-touch trigger (shared)
-- ----------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_touch_profiles           before update on profiles           for each row execute function touch_updated_at();
create trigger trg_touch_screenings         before update on screenings         for each row execute function touch_updated_at();
create trigger trg_touch_ocr_results        before update on ocr_results        for each row execute function touch_updated_at();
create trigger trg_touch_reference_records  before update on reference_records  for each row execute function touch_updated_at();

-- ----------------------------------------------------------------------------
-- 13. INDEXES
-- ----------------------------------------------------------------------------
create index idx_screenings_created_by   on screenings(created_by);
create index idx_screenings_status       on screenings(status);
create index idx_screenings_risk_level   on screenings(risk_level);
create index idx_screenings_created_at   on screenings(created_at desc);

create index idx_documents_screening_id  on documents(screening_id);
create index idx_documents_doc_type      on documents(document_type);

create index idx_ocr_screening_id        on ocr_results(screening_id);
create index idx_validation_screening_id on validation_results(screening_id);
create index idx_tampering_screening_id  on tampering_results(screening_id);
create index idx_face_screening_id       on face_verifications(screening_id);
-- risk_assessments.screening_id already indexed via its UNIQUE constraint

create index idx_audit_screening_id      on audit_logs(screening_id);
create index idx_audit_created_at        on audit_logs(created_at desc);

create index idx_reference_doc_number    on reference_records(document_number);
-- (document_type, document_number) already indexed via its UNIQUE constraint

-- ============================================================================
-- 14. ROW LEVEL SECURITY
-- ============================================================================
alter table profiles            enable row level security;
alter table screenings          enable row level security;
alter table documents           enable row level security;
alter table ocr_results         enable row level security;
alter table validation_results  enable row level security;
alter table tampering_results   enable row level security;
alter table face_verifications  enable row level security;
alter table risk_assessments    enable row level security;
alter table audit_logs          enable row level security;
alter table reference_records   enable row level security;

-- Helper: is the current user reviewer/admin?
create or replace function is_reviewer_or_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('reviewer', 'admin')
  );
$$;

-- ---- profiles ----
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_reviewer_or_admin());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- ---- screenings ----
create policy "screenings_insert_own"
  on screenings for insert
  with check (created_by = auth.uid());

create policy "screenings_select_own_or_authorized"
  on screenings for select
  using (created_by = auth.uid() or is_reviewer_or_admin());

create policy "screenings_update_own_while_processing"
  on screenings for update
  using (created_by = auth.uid() and status = 'processing');

create policy "screenings_update_by_reviewer_admin"
  on screenings for update
  using (is_reviewer_or_admin());

-- ---- stage result tables: read-only to clients, scoped to screening ownership ----
-- (writes happen from the backend via the service role, which bypasses RLS entirely)

create policy "documents_select_authorized"
  on documents for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "ocr_select_authorized"
  on ocr_results for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "validation_select_authorized"
  on validation_results for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "tampering_select_authorized"
  on tampering_results for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "face_select_authorized"
  on face_verifications for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "risk_select_authorized"
  on risk_assessments for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

-- ---- audit_logs: insert-only, no update/delete policy exists for anyone ----
create policy "audit_insert_own_screening"
  on audit_logs for insert
  with check (
    actor_id = auth.uid()
    and exists (select 1 from screenings s where s.id = screening_id
                and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );

create policy "audit_select_authorized"
  on audit_logs for select
  using (
    exists (select 1 from screenings s where s.id = screening_id
            and (s.created_by = auth.uid() or is_reviewer_or_admin()))
  );
-- Deliberately no UPDATE or DELETE policy → both are denied by default once RLS is enabled.

-- ---- reference_records: read-only mock registry ----
create policy "reference_select_authenticated"
  on reference_records for select
  using (auth.role() = 'authenticated');
-- No insert/update/delete policy for authenticated role → only service_role can write seed/demo data.

-- ============================================================================
-- 15. DASHBOARD VIEWS (no cache/stats tables — computed live, RLS-respecting)
-- ============================================================================

-- Aggregate KPI counts for the Command Center dashboard.
-- Uses security_invoker so RLS of the calling user still applies
-- (officer sees only their own counts; reviewer/admin sees all).
create view screening_dashboard_stats
with (security_invoker = true) as
select
  count(*)                                              as total_screenings,
  count(*) filter (where risk_level = 'low')             as low_risk_count,
  count(*) filter (where risk_level = 'medium')          as medium_risk_count,
  count(*) filter (where risk_level = 'high')            as high_risk_count,
  count(*) filter (
    where exists (
      select 1 from tampering_results t
      where t.screening_id = screenings.id and t.tampering_detected
    )
  )                                                       as tampering_flag_count
from screenings;

-- Recent screening activity feed
create view recent_screening_activity
with (security_invoker = true) as
select
  s.id, s.screening_number, s.document_type, s.status, s.risk_level,
  s.created_by, s.created_at, s.completed_at
from screenings s
order by s.created_at desc
limit 50;

-- Average pipeline confidence scores for dashboard cards
create view screening_confidence_stats
with (security_invoker = true) as
select
  avg(o.confidence)        as avg_ocr_confidence,
  avg(t.tampering_score)   as avg_tampering_score,
  avg(f.similarity_score)  as avg_face_match_score
from screenings s
left join ocr_results o        on o.screening_id = s.id
left join tampering_results t  on t.screening_id = s.id
left join face_verifications f on f.screening_id = s.id;

-- ============================================================================
-- 16. SEED / DEMO DATA (synthetic only — no real identity information)
-- ============================================================================
insert into reference_records (document_type, document_number, status, holder_name, expiry_date, flags, metadata) values
  ('passport', 'P1234567',  'active',      'DEMO PERSON ONE',   '2030-05-11', '[]'::jsonb, '{"note":"synthetic demo record"}'),
  ('passport', 'P7654321',  'expired',     'DEMO PERSON TWO',   '2022-01-01', '[]'::jsonb, '{"note":"synthetic demo record"}'),
  ('visa',     'V9988776',  'active',      'DEMO PERSON THREE', '2027-09-30', '[]'::jsonb, '{"note":"synthetic demo record"}'),
  ('national_id', 'N5566778', 'blacklisted', 'DEMO PERSON FOUR', null,        '["reported_lost"]'::jsonb, '{"note":"synthetic demo record — flagged for demo purposes only"}'),
  ('driving_licence', 'D1122334', 'unknown', null,               null,        '[]'::jsonb, '{"note":"synthetic demo record"}');

-- ============================================================================
-- END OF schema.sql
-- ============================================================================
