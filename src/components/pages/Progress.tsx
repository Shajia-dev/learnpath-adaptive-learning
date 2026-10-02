import { useApp } from '@/lib/AppContext';
import { Card, ProgressBar, Badge, EmptyState } from '@/components/ui';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  FolderKanban,
  BookOpen,
  Target,
  AlertTriangle,
  Award,
  Calendar,
} from 'lucide-react';

export function Progress() {
  const {
    weeks,
    tasks,
    projects,
    progressLog,
    overallProgress,
    completedTasks,
    totalTasks,
    streak,
    weakTopics,
    goal,
  } = useApp();

  if (!goal) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-8 h-8" />}
        title="No progress data yet"
        description="Complete onboarding and start learning to see your progress here."
      />
    );
  }

  const completedWeeks = weeks.filter((w) => w.status === 'completed').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;

  // Weekly progress chart data (last 7 days)
  const last7Days: { date: string; label: string; tasks: number; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const log = progressLog.find((l) => l.date === dateStr);
    last7Days.push({
      date: dateStr,
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      tasks: log?.tasks_completed || 0,
      minutes: log?.minutes_studied || 0,
    });
  }
  const maxMinutes = Math.max(...last7Days.map((d) => d.minutes), 60);

  // Per-week progress
  const weekProgress = weeks.map((week) => {
    const weekTasks = tasks.filter((t) => t.week_id === week.id);
    const completed = weekTasks.filter((t) => t.completed).length;
    return {
      week: week.week_number,
      title: week.title,
      status: week.status,
      progress: weekTasks.length > 0 ? (completed / weekTasks.length) * 100 : 0,
      completed,
      total: weekTasks.length,
    };
  });

  // Strong areas (topics with high completion)
  const topicCompletion: Record<string, { total: number; completed: number }> = {};
  tasks.forEach((t) => {
    const week = weeks.find((w) => w.id === t.week_id);
    if (!week) return;
    const topic = week.title;
    if (!topicCompletion[topic]) topicCompletion[topic] = { total: 0, completed: 0 };
    topicCompletion[topic].total++;
    if (t.completed) topicCompletion[topic].completed++;
  });

  const strongAreas = Object.entries(topicCompletion)
    .filter(([, v]) => v.total > 0 && v.completed / v.total >= 0.7)
    .map(([k]) => k);
  const weakAreas = Object.entries(topicCompletion)
    .filter(([, v]) => v.total > 0 && v.completed / v.total < 0.5)
    .map(([k]) => k);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Progress</h1>
        <p className="text-slate-500 mt-1">Track your learning journey over time.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Overall Progress</span>
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{overallProgress}%</p>
          <ProgressBar value={overallProgress} className="mt-3" />
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Tasks Completed</span>
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedTasks}<span className="text-sm font-normal text-slate-400"> / {totalTasks}</span></p>
          <p className="text-xs text-slate-400 mt-3">Learning tasks done</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Projects Done</span>
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedProjects}<span className="text-sm font-normal text-slate-400"> / {projects.length}</span></p>
          <p className="text-xs text-slate-400 mt-3">{inProgressProjects} in progress</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Learning Streak</span>
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{streak} <span className="text-sm font-normal text-slate-400">days</span></p>
          <p className="text-xs text-slate-400 mt-3">{streak > 0 ? 'Keep it alive!' : 'Start today!'}</p>
        </Card>
      </div>

      {/* Weekly activity chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Weekly Activity</h2>
        </div>
        <div className="flex items-end justify-between gap-2 h-48">
          {last7Days.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end h-32 relative group">
                <div
                  className="w-full bg-teal-500 rounded-t-md transition-all duration-500 hover:bg-teal-600 relative"
                  style={{ height: `${(day.minutes / maxMinutes) * 100}%`, minHeight: day.minutes > 0 ? '8px' : '2px' }}
                >
                  {day.minutes > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {day.minutes}m · {day.tasks} tasks
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">Total this week: <span className="font-semibold text-slate-700">{last7Days.reduce((s, d) => s + d.minutes, 0)} min</span></span>
          <span className="text-slate-500">Tasks: <span className="font-semibold text-slate-700">{last7Days.reduce((s, d) => s + d.tasks, 0)}</span></span>
        </div>
      </Card>

      {/* Week-by-week progress */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Week-by-Week Progress</h2>
        </div>
        <div className="space-y-3">
          {weekProgress.map((wp) => (
            <div key={wp.week} className="flex items-center gap-4">
              <div className="w-20 flex-shrink-0">
                <span className="text-xs font-medium text-slate-400">Week {wp.week}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 truncate">{wp.title}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{wp.completed}/{wp.total}</span>
                </div>
                <ProgressBar value={wp.progress} />
              </div>
              <div className="w-20 flex-shrink-0 text-right">
                {wp.status === 'completed' && <Badge color="green">Done</Badge>}
                {wp.status === 'in_progress' && <Badge color="amber">Active</Badge>}
                {wp.status === 'upcoming' && <span className="text-xs text-slate-400">{Math.round(wp.progress)}%</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strong & weak areas */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-green-600" />
            <h2 className="text-lg font-semibold text-slate-900">Strong Areas</h2>
          </div>
          {strongAreas.length > 0 ? (
            <div className="space-y-2">
              {strongAreas.map((area) => (
                <div key={area} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">Complete more tasks to identify your strong areas.</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">Weak Areas</h2>
          </div>
          {weakAreas.length > 0 ? (
            <div className="space-y-2">
              {weakAreas.map((area) => (
                <div key={area} className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{area}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-3">Consider asking your AI Mentor for extra practice on these topics.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Target className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">No weak areas detected — you're doing great!</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
