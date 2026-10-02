import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  Profile,
  LearningGoal,
  PlanWeek,
  Task,
  Project,
  ProjectTask,
  Resource,
  ProgressLog,
  PlanAdaptation,
  WeekStatus,
  ProjectStatus,
} from './types';
import { generateLearningPlan } from './aiEngine';

interface AppData {
  session: Session | null;
  profile: Profile | null;
  goal: LearningGoal | null;
  weeks: PlanWeek[];
  tasks: Task[];
  projects: Project[];
  projectTasks: ProjectTask[];
  resources: Resource[];
  progressLog: ProgressLog[];
  adaptations: PlanAdaptation[];
  loading: boolean;
  // computed
  currentWeek: PlanWeek | null;
  overallProgress: number;
  completedTasks: number;
  totalTasks: number;
  streak: number;
  weakTopics: string[];
  // actions
  refresh: () => Promise<void>;
  createProfile: (name: string) => Promise<void>;
  createGoalAndPlan: (input: {
    topic: string;
    current_level: string;
    goal: string;
    hours_per_day: number;
    days_per_week: number;
    desired_duration_weeks: number;
    deadline: string | null;
  }) => Promise<void>;
  toggleTask: (taskId: string, completed: boolean) => Promise<void>;
  toggleProjectTask: (task: ProjectTask, completed: boolean) => Promise<void>;
  toggleResource: (resourceId: string, completed: boolean) => Promise<void>;
  updateWeekStatus: (weekId: string, status: WeekStatus) => Promise<void>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  updateGoal: (updates: Partial<Pick<LearningGoal, 'topic' | 'current_level' | 'goal' | 'hours_per_day' | 'days_per_week' | 'desired_duration_weeks' | 'deadline'>>) => Promise<void>;
  saveAdaptation: (adaptation: Omit<PlanAdaptation, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  logProgress: (tasksCompleted: number, minutesStudied: number) => Promise<void>;
}

const AppContext = createContext<AppData | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function computeStreak(log: ProgressLog[]): number {
  if (log.length === 0) return 0;
  const dates = log.map((l) => l.date).sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  let checkDate = dates[0] === today ? new Date() : new Date(Date.now() - 86400000);

  for (const dateStr of dates) {
    const d = checkDate.toISOString().split('T')[0];
    if (dateStr === d) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}

function computeWeakTopics(weeks: PlanWeek[], tasks: Task[]): string[] {
  const weekMap = new Map<string, PlanWeek>();
  weeks.forEach((w) => weekMap.set(w.id, w));
  const topicCompletion: Record<string, { total: number; completed: number }> = {};

  tasks.forEach((t) => {
    const week = weekMap.get(t.week_id);
    if (!week) return;
    const topic = week.title;
    if (!topicCompletion[topic]) topicCompletion[topic] = { total: 0, completed: 0 };
    topicCompletion[topic].total++;
    if (t.completed) topicCompletion[topic].completed++;
  });

  return Object.entries(topicCompletion)
    .filter(([, v]) => v.total > 0 && v.completed / v.total < 0.5)
    .map(([k]) => k);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [weeks, setWeeks] = useState<PlanWeek[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [progressLog, setProgressLog] = useState<ProgressLog[]>([]);
  const [adaptations, setAdaptations] = useState<PlanAdaptation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('learning_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    setProfile(profileRes.data as Profile | null);
    setGoal(goalRes.data as LearningGoal | null);

    if (goalRes.data) {
      const goalId = goalRes.data.id;
      const [weeksRes, tasksRes, projectsRes, ptRes, resourcesRes, progressRes, adaptationsRes] = await Promise.all([
        supabase.from('plan_weeks').select('*').eq('goal_id', goalId).order('week_number', { ascending: true }),
        supabase.from('tasks').select('*').in('week_id', (await supabase.from('plan_weeks').select('id').eq('goal_id', goalId)).data?.map((w: { id: string }) => w.id) || []).order('sort_order', { ascending: true }),
        supabase.from('projects').select('*').eq('goal_id', goalId).order('sort_order', { ascending: true }),
        supabase.from('project_tasks').select('*').in('project_id', (await supabase.from('projects').select('id').eq('goal_id', goalId)).data?.map((p: { id: string }) => p.id) || []).order('sort_order', { ascending: true }),
        supabase.from('resources').select('*').eq('goal_id', goalId).order('created_at', { ascending: true }),
        supabase.from('progress_log').select('*').eq('user_id', userId).order('date', { ascending: true }),
        supabase.from('plan_adaptations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      setWeeks((weeksRes.data as PlanWeek[]) || []);
      setTasks((tasksRes.data as Task[]) || []);
      setProjects((projectsRes.data as Project[]) || []);
      setProjectTasks((ptRes.data as ProjectTask[]) || []);
      setResources((resourcesRes.data as Resource[]) || []);
      setProgressLog((progressRes.data as ProgressLog[]) || []);
      setAdaptations((adaptationsRes.data as PlanAdaptation[]) || []);
    } else {
      setWeeks([]);
      setTasks([]);
      setProjects([]);
      setProjectTasks([]);
      setResources([]);
      setProgressLog([]);
      setAdaptations([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.user) return;
    await loadUserData(session.user.id);
  }, [session, loadUserData]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        loadUserData(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        if (!mounted) return;
        setSession(s);
        if (s?.user) {
          await loadUserData(s.user.id);
        } else {
          setProfile(null);
          setGoal(null);
          setWeeks([]);
          setTasks([]);
          setProjects([]);
          setProjectTasks([]);
          setResources([]);
          setProgressLog([]);
          setAdaptations([]);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const createProfile = useCallback(async (name: string) => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .insert({ id: session.user.id, full_name: name })
      .select()
      .single();
    if (data) setProfile(data as Profile);
  }, [session]);

  const createGoalAndPlan = useCallback(async (input: {
    topic: string; current_level: string; goal: string;
    hours_per_day: number; days_per_week: number; desired_duration_weeks: number; deadline: string | null;
  }) => {
    if (!session?.user) return;

    const { data: goalData } = await supabase
      .from('learning_goals')
      .insert({
        user_id: session.user.id,
        topic: input.topic,
        current_level: input.current_level,
        goal: input.goal,
        hours_per_day: input.hours_per_day,
        days_per_week: input.days_per_week,
        desired_duration_weeks: input.desired_duration_weeks,
        deadline: input.deadline,
        onboarded: true,
      })
      .select()
      .single();

    if (!goalData) return;
    const newGoal = goalData as LearningGoal;
    setGoal(newGoal);

    const plan = generateLearningPlan({
      topic: input.topic,
      current_level: input.current_level,
      goal: input.goal,
      hours_per_day: input.hours_per_day,
      days_per_week: input.days_per_week,
      desired_duration_weeks: input.desired_duration_weeks,
    });

    // Insert weeks and tasks
    for (const w of plan.weeks) {
      const { data: weekData } = await supabase
        .from('plan_weeks')
        .insert({
          user_id: session.user.id,
          goal_id: newGoal.id,
          week_number: w.week.week_number,
          title: w.week.title,
          goal_description: w.week.goal_description,
          topics: w.week.topics,
          estimated_hours: w.week.estimated_hours,
          status: w.week.status,
        })
        .select()
        .single();

      if (weekData && w.tasks.length > 0) {
        await supabase.from('tasks').insert(
          w.tasks.map((t) => ({
            user_id: session.user.id,
            week_id: weekData.id,
            title: t.title,
            description: t.description,
            task_type: t.task_type,
            estimated_minutes: t.estimated_minutes,
            resource_url: t.resource_url,
            resource_title: t.resource_title,
            sort_order: t.sort_order,
          }))
        );
      }
    }

    // Insert projects
    for (const p of plan.projects) {
      const { data: projData } = await supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          goal_id: newGoal.id,
          title: p.project.title,
          difficulty: p.project.difficulty,
          objective: p.project.objective,
          skills: p.project.skills,
          requirements: p.project.requirements,
          estimated_hours: p.project.estimated_hours,
          status: p.project.status,
          sort_order: p.project.sort_order,
        })
        .select()
        .single();

      if (projData && p.tasks.length > 0) {
        await supabase.from('project_tasks').insert(
          p.tasks.map((t) => ({
            user_id: session.user.id,
            project_id: projData.id,
            title: t.title,
            sort_order: t.sort_order,
          }))
        );
      }
    }

    // Insert resources
    if (plan.resources.length > 0) {
      await supabase.from('resources').insert(
        plan.resources.map((r) => ({
          user_id: session.user.id,
          goal_id: newGoal.id,
          title: r.title,
          description: r.description,
          resource_type: r.resource_type,
          topic: r.topic,
          url: r.url,
          week_number: r.week_number,
        }))
      );
    }

    await loadUserData(session.user.id);
  }, [session, loadUserData]);

  const toggleTask = useCallback(async (taskId: string, completed: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { data } = await supabase
      .from('tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', taskId)
      .select()
      .single();

    if (data) {
      const updated = tasks.map((t) => (t.id === taskId ? data as Task : t));
      setTasks(updated);

      if (completed) {
        await logProgress(1, task.estimated_minutes);
      }
    }
  }, [tasks]);

  const toggleProjectTask = useCallback(async (pt: ProjectTask, completed: boolean) => {
    const { data } = await supabase
      .from('project_tasks')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', pt.id)
      .select()
      .single();

    if (data) {
      setProjectTasks(projectTasks.map((t) => (t.id === pt.id ? data as ProjectTask : t)));

      // Update project status
      const projTasks = projectTasks.filter((t) => t.project_id === pt.project_id);
      const allComplete = projTasks.every((t) => t.id === pt.id ? completed : t.completed);
      const anyComplete = projTasks.some((t) => t.id === pt.id ? completed : t.completed);

      let newStatus: ProjectStatus = 'not_started';
      if (allComplete) newStatus = 'completed';
      else if (anyComplete) newStatus = 'in_progress';

      const proj = projects.find((p) => p.id === pt.project_id);
      if (proj && proj.status !== newStatus) {
        await supabase.from('projects').update({ status: newStatus }).eq('id', pt.project_id);
        setProjects(projects.map((p) => p.id === pt.project_id ? { ...p, status: newStatus } : p));
      }
    }
  }, [projectTasks, projects]);

  const toggleResource = useCallback(async (resourceId: string, completed: boolean) => {
    const { data } = await supabase
      .from('resources')
      .update({ completed, completed_at: completed ? new Date().toISOString() : null })
      .eq('id', resourceId)
      .select()
      .single();

    if (data) {
      setResources(resources.map((r) => (r.id === resourceId ? data as Resource : r)));
    }
  }, [resources]);

  const updateWeekStatus = useCallback(async (weekId: string, status: WeekStatus) => {
    const { data } = await supabase
      .from('plan_weeks')
      .update({ status })
      .eq('id', weekId)
      .select()
      .single();

    if (data) {
      setWeeks(weeks.map((w) => (w.id === weekId ? data as PlanWeek : w)));
    }
  }, [weeks]);

  const updateProjectStatus = useCallback(async (projectId: string, status: ProjectStatus) => {
    const { data } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', projectId)
      .select()
      .single();

    if (data) {
      setProjects(projects.map((p) => (p.id === projectId ? data as Project : p)));
    }
  }, [projects]);

  const updateProfile = useCallback(async (name: string) => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ full_name: name, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single();

    if (data) setProfile(data as Profile);
  }, [session]);

  const updateGoal = useCallback(async (updates: Partial<Pick<LearningGoal, 'topic' | 'current_level' | 'goal' | 'hours_per_day' | 'days_per_week' | 'desired_duration_weeks' | 'deadline'>>) => {
    if (!goal) return;
    const { data } = await supabase
      .from('learning_goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', goal.id)
      .select()
      .single();

    if (data) setGoal(data as LearningGoal);
  }, [goal]);

  const saveAdaptation = useCallback(async (adaptation: Omit<PlanAdaptation, 'id' | 'user_id' | 'created_at'>) => {
    if (!session?.user) return;
    await supabase.from('plan_adaptations').insert({
      user_id: session.user.id,
      ...adaptation,
    });
    const { data } = await supabase.from('plan_adaptations').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (data) setAdaptations(data as PlanAdaptation[]);
  }, [session]);

  const logProgress = useCallback(async (tasksCompleted: number, minutesStudied: number) => {
    if (!session?.user) return;
    const today = new Date().toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('progress_log')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      const { data } = await supabase
        .from('progress_log')
        .update({
          tasks_completed: (existing as ProgressLog).tasks_completed + tasksCompleted,
          minutes_studied: (existing as ProgressLog).minutes_studied + minutesStudied,
        })
        .eq('id', (existing as ProgressLog).id)
        .select()
        .single();
      if (data) {
        setProgressLog(progressLog.map((p) => p.id === data.id ? data as ProgressLog : p));
      }
    } else {
      const { data } = await supabase
        .from('progress_log')
        .insert({
          user_id: session.user.id,
          date: today,
          tasks_completed: tasksCompleted,
          minutes_studied: minutesStudied,
        })
        .select()
        .single();
      if (data) setProgressLog([...progressLog, data as ProgressLog]);
    }
  }, [session, progressLog]);

  // Computed values
  const currentWeek = weeks.find((w) => w.status === 'in_progress') || weeks.find((w) => w.status === 'upcoming') || weeks[0] || null;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const streak = computeStreak(progressLog);
  const weakTopics = computeWeakTopics(weeks, tasks);

  const value: AppData = {
    session,
    profile,
    goal,
    weeks,
    tasks,
    projects,
    projectTasks,
    resources,
    progressLog,
    adaptations,
    loading,
    currentWeek,
    overallProgress,
    completedTasks,
    totalTasks,
    streak,
    weakTopics,
    refresh,
    createProfile,
    createGoalAndPlan,
    toggleTask,
    toggleProjectTask,
    toggleResource,
    updateWeekStatus,
    updateProjectStatus,
    updateProfile,
    updateGoal,
    saveAdaptation,
    logProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
