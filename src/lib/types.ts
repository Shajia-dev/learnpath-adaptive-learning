export type LearningLevel = 'Beginner' | 'Basic' | 'Intermediate' | 'Advanced';
export type WeekStatus = 'completed' | 'in_progress' | 'upcoming';
export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Final Project';
export type ProjectStatus = 'not_started' | 'in_progress' | 'completed';
export type TaskType = 'learn' | 'practice' | 'project' | 'watch' | 'exercise' | 'read';
export type ResourceType = 'video' | 'documentation' | 'course' | 'article' | 'practice';

export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface LearningGoal {
  id: string;
  user_id: string;
  topic: string;
  current_level: LearningLevel;
  goal: string;
  hours_per_day: number;
  days_per_week: number;
  desired_duration_weeks: number;
  deadline: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanWeek {
  id: string;
  user_id: string;
  goal_id: string;
  week_number: number;
  title: string;
  goal_description: string;
  topics: string[];
  estimated_hours: number;
  status: WeekStatus;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  week_id: string;
  title: string;
  description: string;
  task_type: TaskType;
  estimated_minutes: number;
  completed: boolean;
  completed_at: string | null;
  resource_url: string | null;
  resource_title: string | null;
  sort_order: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  difficulty: ProjectDifficulty;
  objective: string;
  skills: string[];
  requirements: string[];
  estimated_hours: number;
  status: ProjectStatus;
  sort_order: number;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Resource {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string;
  resource_type: ResourceType;
  topic: string;
  url: string;
  week_number: number | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  user_id: string;
  date: string;
  tasks_completed: number;
  minutes_studied: number;
  created_at: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  context: Record<string, unknown> | null;
  created_at: string;
}

export interface PlanAdaptation {
  id: string;
  user_id: string;
  goal_id: string | null;
  change_type: string;
  summary: string;
  details: Record<string, unknown> | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  confirmed: boolean;
  created_at: string;
}

export interface WeekWithTasks extends PlanWeek {
  tasks: Task[];
}

export interface ProjectWithTasks extends Project {
  project_tasks: ProjectTask[];
}

export interface FullLearningData {
  goal: LearningGoal | null;
  weeks: PlanWeek[];
  tasks: Task[];
  projects: Project[];
  projectTasks: ProjectTask[];
  resources: Resource[];
  progressLog: ProgressLog[];
  adaptations: PlanAdaptation[];
}
