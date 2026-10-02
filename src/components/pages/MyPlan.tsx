import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Card, ProgressBar, Badge, Checkbox, Button, EmptyState } from '@/components/ui';
import type { PlanWeek, WeekStatus } from '@/lib/types';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Circle,
  PlayCircle,
  ArrowLeft,
  BookOpen,
  Video,
  Code,
  FileText,
  PencilLine,
  Hammer,
} from 'lucide-react';

const statusConfig: Record<WeekStatus, { label: string; color: 'green' | 'amber' | 'slate'; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Completed', color: 'green', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'amber', icon: PlayCircle },
  upcoming: { label: 'Upcoming', color: 'slate', icon: Circle },
};

const taskTypeIcons: Record<string, typeof BookOpen> = {
  learn: BookOpen,
  watch: Video,
  practice: Code,
  exercise: PencilLine,
  read: FileText,
  project: Hammer,
};

export function MyPlan() {
  const { weeks, tasks, goal } = useApp();
  const [selectedWeek, setSelectedWeek] = useState<PlanWeek | null>(null);

  if (selectedWeek) {
    return <WeekDetail week={selectedWeek} onBack={() => setSelectedWeek(null)} />;
  }

  const completedWeeks = weeks.filter((w) => w.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Learning Plan</h1>
        <p className="text-slate-500 mt-1">{goal?.topic} · {completedWeeks} of {weeks.length} weeks completed</p>
      </div>

      <ProgressBar value={weeks.length > 0 ? (completedWeeks / weeks.length) * 100 : 0} />

      {weeks.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-8 h-8" />}
          title="No plan yet"
          description="Complete onboarding to generate your learning plan."
        />
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => {
            const config = statusConfig[week.status];
            const StatusIcon = config.icon;
            const weekTasks = tasks.filter((t) => t.week_id === week.id);
            const completedTasks = weekTasks.filter((t) => t.completed).length;
            const weekProgress = weekTasks.length > 0 ? (completedTasks / weekTasks.length) * 100 : 0;

            return (
              <Card
                key={week.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div onClick={() => setSelectedWeek(week)} className="block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        week.status === 'completed' ? 'bg-green-100' :
                        week.status === 'in_progress' ? 'bg-amber-100' : 'bg-slate-100'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${
                          week.status === 'completed' ? 'text-green-600' :
                          week.status === 'in_progress' ? 'text-amber-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">Week {week.week_number}</span>
                          <Badge color={config.color}>{config.label}</Badge>
                        </div>
                        <h3 className="text-base font-semibold text-slate-900 truncate">{week.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{week.goal_description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {week.estimated_hours}h</span>
                          <span>{weekTasks.length} tasks</span>
                          <span>{completedTasks} completed</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-24 flex-shrink-0 hidden sm:block">
                      <div className="text-right mb-1">
                        <span className="text-xs font-medium text-slate-600">{Math.round(weekProgress)}%</span>
                      </div>
                      <ProgressBar value={weekProgress} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeekDetail({ week, onBack }: { week: PlanWeek; onBack: () => void }) {
  const { tasks, toggleTask, updateWeekStatus } = useApp();
  const weekTasks = tasks.filter((t) => t.week_id === week.id).sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = weekTasks.filter((t) => t.completed).length;
  const progress = weekTasks.length > 0 ? (completedCount / weekTasks.length) * 100 : 0;
  const totalMinutes = weekTasks.reduce((sum, t) => sum + t.estimated_minutes, 0);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to plan
      </button>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-slate-400">Week {week.week_number}</span>
          <Badge color={statusConfig[week.status].color}>{statusConfig[week.status].label}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{week.title}</h1>
        <p className="text-slate-600 mt-2 leading-relaxed">{week.goal_description}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Completion</p>
          <p className="text-xl font-bold text-slate-900">{Math.round(progress)}%</p>
          <ProgressBar value={progress} className="mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Estimated Time</p>
          <p className="text-xl font-bold text-slate-900">{Math.round(totalMinutes / 60 * 10) / 10}h</p>
          <p className="text-xs text-slate-400 mt-2">{totalMinutes} minutes total</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Tasks</p>
          <p className="text-xl font-bold text-slate-900">{completedCount}/{weekTasks.length}</p>
          <p className="text-xs text-slate-400 mt-2">{weekTasks.length - completedCount} remaining</p>
        </Card>
      </div>

      {/* Status controls */}
      <div className="flex gap-2">
        <Button size="sm" variant={week.status === 'in_progress' ? 'primary' : 'outline'} onClick={() => updateWeekStatus(week.id, 'in_progress')}>
          Mark In Progress
        </Button>
        <Button size="sm" variant={week.status === 'completed' ? 'primary' : 'outline'} onClick={() => updateWeekStatus(week.id, 'completed')}>
          Mark Completed
        </Button>
      </div>

      {/* Tasks */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Learning Tasks</h2>
        <div className="space-y-2">
          {weekTasks.map((task) => {
            const Icon = taskTypeIcons[task.task_type] || BookOpen;
            return (
              <Card key={task.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Checkbox checked={task.completed} onChange={() => toggleTask(task.id, !task.completed)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.title}
                      </p>
                      <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" /> {task.estimated_minutes}m
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <Badge color="slate">{task.task_type}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
