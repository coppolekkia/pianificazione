/*
# Create workforce management schema (single-tenant, no auth)

Migrates the app from Firebase Firestore to Supabase. This is a single-tenant
app with no sign-in screen, so all policies use `TO anon, authenticated` and
the data is intentionally shared/public.

## New Tables

1. `employees` — operators
   - `id` (uuid, PK)
   - `name` (text, not null)
   - `type` (text: 'jolly' | 'ordinario', default 'jolly')

2. `work_sites` — cantieri
   - `id` (uuid, PK)
   - `name` (text, not null)
   - `address` (text, nullable)
   - `city` (text, nullable)
   - `province` (text, nullable)
   - `radius` (text, nullable)
   - `scan_type` (text, nullable)
   - `print_tag` (text, nullable)
   - `weekly_plan` (jsonb, nullable) — stores the WeeklyPlan object

3. `assignments` — employee ↔ work_site links
   - `id` (uuid, PK)
   - `employee_id` (uuid, FK → employees.id ON DELETE CASCADE)
   - `work_site_id` (uuid, FK → work_sites.id ON DELETE CASCADE)
   - UNIQUE (employee_id, work_site_id)

4. `leave_requests` — ferie/permessi/malattie
   - `id` (uuid, PK)
   - `employee_id` (uuid, FK → employees.id ON DELETE CASCADE)
   - `type` (text: 'Ferie' | 'Permesso' | 'Malattia', not null)
   - `start_date` (date, not null)
   - `end_date` (date, not null)

5. `schedule_entries` — planning interventions
   - `id` (uuid, PK)
   - `employee_id` (uuid, FK → employees.id ON DELETE CASCADE)
   - `date` (date, not null)
   - `start_time` (text, not null)
   - `end_time` (text, not null)
   - `task_description` (text, not null)
   - `hours` (numeric(5,2), not null)

## Security

- RLS enabled on all tables.
- All tables allow full CRUD for `anon, authenticated` (single-tenant, no auth).
- `USING (true)` is documented as intentional for this shared-data app.

## Notes

1. Column names use snake_case in Postgres; the frontend maps to camelCase.
2. `weekly_plan` is stored as jsonb to preserve the nested WeeklyPlan structure.
3. Cascade deletes ensure orphaned records are removed when an employee or work site is deleted.
*/

-- employees
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'jolly' CHECK (type IN ('jolly', 'ordinario')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_employees" ON employees;
CREATE POLICY "anon_select_employees" ON employees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_employees" ON employees;
CREATE POLICY "anon_insert_employees" ON employees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_employees" ON employees;
CREATE POLICY "anon_update_employees" ON employees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_employees" ON employees;
CREATE POLICY "anon_delete_employees" ON employees FOR DELETE TO anon, authenticated USING (true);

-- work_sites
CREATE TABLE IF NOT EXISTS work_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  city text,
  province text,
  radius text,
  scan_type text,
  print_tag text,
  weekly_plan jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE work_sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_work_sites" ON work_sites;
CREATE POLICY "anon_select_work_sites" ON work_sites FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_work_sites" ON work_sites;
CREATE POLICY "anon_insert_work_sites" ON work_sites FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_work_sites" ON work_sites;
CREATE POLICY "anon_update_work_sites" ON work_sites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_work_sites" ON work_sites;
CREATE POLICY "anon_delete_work_sites" ON work_sites FOR DELETE TO anon, authenticated USING (true);

-- assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_site_id uuid NOT NULL REFERENCES work_sites(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, work_site_id)
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_assignments" ON assignments;
CREATE POLICY "anon_select_assignments" ON assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assignments" ON assignments;
CREATE POLICY "anon_insert_assignments" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assignments" ON assignments;
CREATE POLICY "anon_update_assignments" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assignments" ON assignments;
CREATE POLICY "anon_delete_assignments" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- leave_requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('Ferie', 'Permesso', 'Malattia')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_leave_requests" ON leave_requests;
CREATE POLICY "anon_select_leave_requests" ON leave_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leave_requests" ON leave_requests;
CREATE POLICY "anon_insert_leave_requests" ON leave_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leave_requests" ON leave_requests;
CREATE POLICY "anon_update_leave_requests" ON leave_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leave_requests" ON leave_requests;
CREATE POLICY "anon_delete_leave_requests" ON leave_requests FOR DELETE TO anon, authenticated USING (true);

-- schedule_entries
CREATE TABLE IF NOT EXISTS schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  task_description text NOT NULL,
  hours numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_schedule_entries" ON schedule_entries;
CREATE POLICY "anon_select_schedule_entries" ON schedule_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_schedule_entries" ON schedule_entries;
CREATE POLICY "anon_insert_schedule_entries" ON schedule_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_schedule_entries" ON schedule_entries;
CREATE POLICY "anon_update_schedule_entries" ON schedule_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_schedule_entries" ON schedule_entries;
CREATE POLICY "anon_delete_schedule_entries" ON schedule_entries FOR DELETE TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assignments_worksite ON assignments(work_site_id);
CREATE INDEX IF NOT EXISTS idx_schedule_employee_date ON schedule_entries(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
