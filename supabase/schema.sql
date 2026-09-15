-- Run this in the Supabase SQL Editor for your project.
-- Navigate to: Dashboard → SQL Editor → New Query → paste → Run

-- ── Students ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  roll_number     TEXT        NOT NULL UNIQUE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ,
  total_blocks_used INT       DEFAULT 0
);

-- ── Level completions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS level_completions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  level_id      INT         NOT NULL CHECK (level_id BETWEEN 1 AND 10),
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocks_used   INT         NOT NULL,
  program       JSONB       NOT NULL,
  UNIQUE (student_id, level_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_finished   ON students (finished_at ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_completions_student ON level_completions (student_id);

-- ── Enable Realtime (optional — for live leaderboard) ─────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE students;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The API routes run with the anon key. For this contest the anon key can
-- insert/read — restrict to service_role key in production if needed.
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_completions ENABLE ROW LEVEL SECURITY;

-- Allow all operations from service role (Next.js API routes via anon key)
CREATE POLICY "allow_all" ON students          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON level_completions FOR ALL USING (true) WITH CHECK (true);
