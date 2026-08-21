-- NOTE: Team Lead approved A: database enum uses driving_license to match API_CONTRACT.md.
-- This is the only schema change in Item 2.
-- ============================================================================
-- VERIFAI — AI-Assisted Fake Identity & Document Screening System
-- Supabase PostgreSQL schema.sql
--
-- Safe to run top-to-bottom on a fresh Supabase project (SQL editor or CLI).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
create type user_role as enum ('officer', 'reviewer', 'admin');
create type document_type as enum ('passport', 'visa', 'national_id', 'driving_license', 'permit');
create type screening_status as enum ('processing', 'completed', 'manual_review', 'approved', 'rejected', 'failed');
create type risk_level as enum ('low', 'medium', 'high');
create type doc_processing_status as enum ('uploaded', 'processing', 'processed', 'failed');
create type ocr_processing_status as enum ('pending', 'completed', 'failed');
create type validation_status as enum ('pass', 'fail', 'warning');
create type face_verification_status as enum ('not_required', 'face_not_detected', 'multiple_faces', 'poor_quality', 'match', 'uncertain', 'mismatch');
create type reference_status as enum ('active', 'expired', 'revoked', 'blacklisted', 'unknown');

-- ----------------------------------------------------------------------------
-- 2. PROFILES
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  officer_id text unique,
  display_name text not null,
  role user_role not null default 'officer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. SCREENINGS
-- ----------------------------------------------------------------------------
create table screenings (
  id uuid primary key default gen_random_uuid(),
  screening_number text unique not null,
  created_by uuid not null references profiles(id) on delete restrict,
  document_type document_type not null,
  status screening_status not null default 'processing',
  risk_level risk_level,
  final_action text check (final_action in ('approved', 'rejected', 'manual_review')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create sequence screening_number_seq;

create or replace function generate_screening_number()
returns trigger language plpgsql as $$
begin
  if new.screening_number is null then
    new.screening_number := 'VF-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('screening_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_screening_number before insert on screenings for each row execute function generate_screening_number();

-- ----------------------------------------------------------------------------
-- 4. DOCUMENTS
-- ----------------------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references screenings(id) on delete cascade,
  document_type document_type not null,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text,
  file_size_bytes bigint,
  checksum_sha256 text,
  processing_status doc_processing_status not null default 'uploaded',
  uploaded_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. OCR_RESULTS
-- ----------------------------------------------------------------------------
create table ocr_results (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null references screenings(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade, extracted_data jsonb not null default '{}'::jsonb,
  confidence numeric(5,4) check (confidence between 0 and 1), raw_text text,
  processing_status ocr_processing_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (document_id)
);

-- ----------------------------------------------------------------------------
-- 6. VALIDATION_RESULTS
-- ----------------------------------------------------------------------------
create table validation_results (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null references screenings(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade, overall_status validation_status not null,
  validation_score numeric(5,4) check (validation_score between 0 and 1), checks jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), unique (document_id)
);

-- ----------------------------------------------------------------------------
-- 7. TAMPERING_RESULTS
-- ----------------------------------------------------------------------------
create table tampering_results (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null references screenings(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade, tampering_detected boolean not null default false,
  tampering_score numeric(5,4) check (tampering_score between 0 and 1), indicators jsonb not null default '[]'::jsonb,
  model_version text, created_at timestamptz not null default now(), unique (document_id)
);

-- ----------------------------------------------------------------------------
-- 8. FACE_VERIFICATIONS
-- ----------------------------------------------------------------------------
create table face_verifications (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null references screenings(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade, status face_verification_status not null default 'not_required',
  similarity_score numeric(5,4) check (similarity_score between 0 and 1), quality_info jsonb default '{}'::jsonb,
  failure_reason text, created_at timestamptz not null default now(), unique (document_id)
);

-- ----------------------------------------------------------------------------
-- 9. RISK_ASSESSMENTS
-- ----------------------------------------------------------------------------
create table risk_assessments (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null unique references screenings(id) on delete cascade,
  risk_score numeric(5,2) not null, risk_level risk_level not null, contributing_factors jsonb not null default '{}'::jsonb,
  explanation text, model_version text, created_at timestamptz not null default now()
);

create or replace function sync_screening_risk_level()
returns trigger language plpgsql as $$
begin
  update screenings set risk_level = new.risk_level, updated_at = now() where id = new.screening_id;
  return new;
end;
$$;

create trigger trg_sync_risk_level after insert or update on risk_assessments for each row execute function sync_screening_risk_level();

-- ----------------------------------------------------------------------------
-- 10. AUDIT_LOGS
-- ----------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(), screening_id uuid not null references screenings(id) on delete restrict,
  actor_id uuid references profiles(id) on delete set null, action text not null, previous_status text, new_status text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 11. REFERENCE_RECORDS (MOCK / PROTOTYPE ONLY)
-- ----------------------------------------------------------------------------
create table reference_records (
  id uuid primary key default gen_random_uuid(), document_type document_type not null, document_number text not null,
  status reference_status not null default 'unknown', holder_name text, expiry_date date,
  flags jsonb not null default '[]'::jsonb, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (document_type, document_number)
);

-- ----------------------------------------------------------------------------
-- 12. TRIGGERS / INDEXES
-- ----------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger trg_touch_profiles before update on profiles for each row execute function touch_updated_at();
create trigger trg_touch_screenings before update on screenings for each row execute function touch_updated_at();
create trigger trg_touch_ocr_results before update on ocr_results for each row execute function touch_updated_at();
create trigger trg_touch_reference_records before update on reference_records for each row execute function touch_updated_at();
create index idx_screenings_created_by on screenings(created_by);
create index idx_screenings_status on screenings(status);
create index idx_screenings_risk_level on screenings(risk_level);
create index idx_screenings_created_at on screenings(created_at desc);
create index idx_documents_screening_id on documents(screening_id);
create index idx_documents_doc_type on documents(document_type);
create index idx_ocr_screening_id on ocr_results(screening_id);
create index idx_validation_screening_id on validation_results(screening_id);
create index idx_tampering_screening_id on tampering_results(screening_id);
create index idx_face_screening_id on face_verifications(screening_id);
create index idx_audit_screening_id on audit_logs(screening_id);
create index idx_audit_created_at on audit_logs(created_at desc);
create index idx_reference_doc_number on reference_records(document_number);

-- ----------------------------------------------------------------------------
-- 13. RLS
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table screenings enable row level security;
alter table documents enable row level security;
alter table ocr_results enable row level security;
alter table validation_results enable row level security;
alter table tampering_results enable row level security;
alter table face_verifications enable row level security;
alter table risk_assessments enable row level security;
alter table audit_logs enable row level security;
alter table reference_records enable row level security;

create or replace function is_reviewer_or_admin() returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('reviewer', 'admin'));
$$;

create policy "profiles_select_own_or_admin" on profiles for select using (id = auth.uid() or is_reviewer_or_admin());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "screenings_insert_own" on screenings for insert with check (created_by = auth.uid());
create policy "screenings_select_own_or_authorized" on screenings for select using (created_by = auth.uid() or is_reviewer_or_admin());
create policy "screenings_update_own_while_processing" on screenings for update using (created_by = auth.uid() and status = 'processing');
create policy "screenings_update_by_reviewer_admin" on screenings for update using (is_reviewer_or_admin());

create policy "documents_select_authorized" on documents for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "ocr_select_authorized" on ocr_results for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "validation_select_authorized" on validation_results for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "tampering_select_authorized" on tampering_results for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "face_select_authorized" on face_verifications for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "risk_select_authorized" on risk_assessments for select using (exists (select 1 from screenings s where s.id = screening_id and (s.created_by = auth.uid() or is_reviewer_or_admin())));
create policy "audit_insert_own_screening" on audit_logs for insert with check (actor_id = auth.uid() and exists (select 1 from screenings s where s.id = screening_id and s.created_by = auth.uid()));
create policy "audit_select_own_or_authorized" on audit_logs for select using (actor_id = auth.uid() or is_reviewer_or_admin());
create policy "reference_select_reviewer_admin" on reference_records for select using (is_reviewer_or_admin());

-- Storage bucket must be created as private in Supabase Storage:
-- identity-documents
