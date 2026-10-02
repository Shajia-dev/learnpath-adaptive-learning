/*
# LearnPath AI - Core Database Schema

## Overview
Creates the full multi-user schema for an AI-powered personalized learning platform.
Each user has their own learning goals, AI-generated plans (weeks, topics, tasks),
projects, resources, progress tracking, and AI mentor/adaptation history.

## Tables Created
1. `profiles` - User profile data (name, preferences) linked to auth.users
2. `learning_goals` - The user's learning goal, level, time availability, duration
3. `plan_weeks` - Weeks in the AI-generated learning plan
4. `tasks` - Individual learning/practice tasks within a week
5. `projects` - Learning projects with difficulty levels
6. `project_tasks` - Sub-tasks within a project
7. `resources` - Recommended learning resources
8. `progress_log` - Daily progress entries for streak/tracking
9. `ai_conversations` - AI Mentor conversation history
10. `plan_adaptations` - Record of AI plan changes with reasons

## Security
- RLS enabled on all tables
- All tables are owner-scoped (user_id = auth.uid())
- 4 CRUD policies per table (select/insert/update/delete) scoped to authenticated owner
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Learning goals table
CREATE TABLE IF NOT EXISTS learning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  current_level text NOT NULL DEFAULT 'Beginner',
  goal text NOT NULL DEFAULT '',
  hours_per_day numeric NOT NULL DEFAULT 2,
  days_per_week int NOT NULL DEFAULT 5,
  desired_duration_weeks int NOT NULL DEFAULT 12,
  deadline date,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON learning_goals;
CREATE POLICY "select_own_goals" ON learning_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON learning_goals;
CREATE POLICY "insert_own_goals" ON learning_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON learning_goals;
CREATE POLICY "update_own_goals" ON learning_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON learning_goals;
CREATE POLICY "delete_own_goals" ON learning_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Plan weeks table
CREATE TABLE IF NOT EXISTS plan_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  title text NOT NULL,
  goal_description text NOT NULL DEFAULT '',
  topics text[] NOT NULL DEFAULT '{}',
  estimated_hours numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plan_weeks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weeks" ON plan_weeks;
CREATE POLICY "select_own_weeks" ON plan_weeks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_weeks" ON plan_weeks;
CREATE POLICY "insert_own_weeks" ON plan_weeks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_weeks" ON plan_weeks;
CREATE POLICY "update_own_weeks" ON plan_weeks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_weeks" ON plan_weeks;
CREATE POLICY "delete_own_weeks" ON plan_weeks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_id uuid NOT NULL REFERENCES plan_weeks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT 'learn',
  estimated_minutes int NOT NULL DEFAULT 30,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  resource_url text,
  resource_title text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Beginner',
  objective text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  estimated_hours numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'not_started',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_project_tasks" ON project_tasks;
CREATE POLICY "select_own_project_tasks" ON project_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_project_tasks" ON project_tasks;
CREATE POLICY "insert_own_project_tasks" ON project_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_project_tasks" ON project_tasks;
CREATE POLICY "update_own_project_tasks" ON project_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_project_tasks" ON project_tasks;
CREATE POLICY "delete_own_project_tasks" ON project_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES learning_goals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  resource_type text NOT NULL DEFAULT 'article',
  topic text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  week_number int,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resources" ON resources;
CREATE POLICY "select_own_resources" ON resources FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resources" ON resources;
CREATE POLICY "insert_own_resources" ON resources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resources" ON resources;
CREATE POLICY "update_own_resources" ON resources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resources" ON resources;
CREATE POLICY "delete_own_resources" ON resources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Progress log table (for streaks and daily tracking)
CREATE TABLE IF NOT EXISTS progress_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed int NOT NULL DEFAULT 0,
  minutes_studied int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE progress_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON progress_log;
CREATE POLICY "select_own_progress" ON progress_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON progress_log;
CREATE POLICY "insert_own_progress" ON progress_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON progress_log;
CREATE POLICY "update_own_progress" ON progress_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON progress_log;
CREATE POLICY "delete_own_progress" ON progress_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON ai_conversations;
CREATE POLICY "select_own_conversations" ON ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON ai_conversations;
CREATE POLICY "insert_own_conversations" ON ai_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON ai_conversations;
CREATE POLICY "delete_own_conversations" ON ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Plan adaptations table
CREATE TABLE IF NOT EXISTS plan_adaptations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES learning_goals(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  summary text NOT NULL,
  details jsonb,
  old_values jsonb,
  new_values jsonb,
  confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plan_adaptations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_adaptations" ON plan_adaptations;
CREATE POLICY "select_own_adaptations" ON plan_adaptations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_adaptations" ON plan_adaptations;
CREATE POLICY "insert_own_adaptations" ON plan_adaptations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_adaptations" ON plan_adaptations;
CREATE POLICY "update_own_adaptations" ON plan_adaptations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_adaptations" ON plan_adaptations;
CREATE POLICY "delete_own_adaptations" ON plan_adaptations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plan_weeks_user_goal ON plan_weeks(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_week ON tasks(user_id, week_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_projects_user_goal ON projects(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user ON project_tasks(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_goal ON resources(user_id, goal_id);
CREATE INDEX IF NOT EXISTS idx_progress_log_user_date ON progress_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_plan_adaptations_user ON plan_adaptations(user_id, created_at);
