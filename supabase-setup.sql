-- Run this in the Supabase SQL Editor to create the tables

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  context text NOT NULL CHECK (context IN ('work', 'personal', 'both')),
  frequency_type text NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'x_per_week', 'biweekly', 'monthly', 'x_per_month', 'custom_days')),
  frequency_value integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  period_key text NOT NULL
);

CREATE INDEX idx_completions_task_period ON completions(task_id, period_key);

-- Allow anonymous access (single-user personal app)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to completions" ON completions FOR ALL USING (true) WITH CHECK (true);
