import { useApp } from '@/lib/AppContext';
import { Card, Checkbox, Badge, Button, EmptyState, ProgressBar } from '@/components/ui';
import { getTaskResourceUrl } from '@/lib/resourceLinks';
import {
  BookOpen,
  Video,
  Code,
  FileText,
  PencilLine,
  Hammer,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Play,
} from 'lucide-react';
import type { Page } from '@/components/AppLayout';
import type { TaskType, Task } from '@/lib/types';

const taskTypeConfig: Record<TaskType, { icon: typeof BookOpen; color: string; label: string; actionLabel: string }> = {
  learn: { icon: BookOpen, color: 'bg-blue-100 text-blue-600', label: 'Learn', actionLabel: 'Open Material' },
  watch: { icon: Video, color: 'bg-purple-100 text-purple-600', label: 'Watch', actionLabel: 'Watch Video' },
  practice: { icon: Code, color: 'bg-teal-100 text-teal-600', label: 'Practice', actionLabel: 'Start Practice' },
  exercise: { icon: PencilLine, color: 'bg-amber-100 text-amber-600', label: 'Exercise', actionLabel: 'Start Exercise' },
  read: { icon: FileText, color: 'bg-slate-100 text-slate-600', label: 'Read', actionLabel: 'Open Article' },
  project: { icon: Hammer, color: 'bg-orange-100 text-orange-600', label: 'Project', actionLabel: 'Open Guide' },
};

export function Learn({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { currentWeek, tasks, goal, toggleTask, completedTasks, totalTasks } = useApp();

  if (!currentWeek) {
    return (
      <EmptyState
        icon={<BookOpen className="w-8 h-8" />}
        title="No tasks yet"
        description="Complete onboarding to generate your daily learning tasks."
      />
    );
  }

  const weekTasks = tasks
    .filter((t) => t.week_id === currentWeek.id)
    .sort((a, b) => {
      if (a.completed === b.completed) return a.sort_order - b.sort_order;
      return a.completed ? 1 : -1;
    });

  const incompleteCount = weekTasks.filter((t) => !t.completed).length;
  const weekCompleted = weekTasks.filter((t) => t.completed).length;
  const weekProgress = weekTasks.length > 0 ? (weekCompleted / weekTasks.length) * 100 : 0;
  const totalMinutes = weekTasks.filter((t) => !t.completed).reduce((sum, t) => sum + t.estimated_minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Learn Today</h1>
        <p className="text-slate-500 mt-1">Week {currentWeek.week_number} · {currentWeek.title}</p>
      </div>

      {/* Progress summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Week Progress</p>
          <p className="text-xl font-bold text-slate-900">{Math.round(weekProgress)}%</p>
          <ProgressBar value={weekProgress} className="mt-2" />
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Tasks Left Today</p>
          <p className="text-xl font-bold text-slate-900">{incompleteCount}</p>
          <p className="text-xs text-slate-400 mt-2">{weekCompleted} completed</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Time Remaining</p>
          <p className="text-xl font-bold text-slate-900">{Math.round(totalMinutes / 60 * 10) / 10}h</p>
          <p className="text-xs text-slate-400 mt-2">{totalMinutes} minutes</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Overall Progress</p>
          <p className="text-xl font-bold text-slate-900">{completedTasks}/{totalTasks}</p>
          <p className="text-xs text-slate-400 mt-2">total tasks</p>
        </Card>
      </div>

      {/* Tasks list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Today's Learning Tasks</h2>
          <Button variant="outline" size="sm" onClick={() => onNavigate('mentor')}>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Ask AI Mentor
            </span>
          </Button>
        </div>

        <div className="space-y-3">
          {weekTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              weekTitle={currentWeek.title}
              topic={goal?.topic || ''}
              onToggle={() => toggleTask(task.id, !task.completed)}
            />
          ))}
        </div>
      </div>

      {incompleteCount === 0 && weekTasks.length > 0 && (
        <Card className="p-6 bg-green-50 border-green-200 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900">All tasks completed for this week!</h3>
          <p className="text-sm text-slate-600 mt-1 mb-4">Great work. Check the next week or ask your AI Mentor what to study next.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => onNavigate('plan')}>View Plan</Button>
            <Button variant="outline" onClick={() => onNavigate('mentor')}>Ask AI Mentor</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function TaskCard({
  task,
  weekTitle,
  topic,
  onToggle,
}: {
  task: Task;
  weekTitle: string;
  topic: string;
  onToggle: () => void;
}) {
  const config = taskTypeConfig[task.task_type];
  const Icon = config.icon;
  const { url, title: linkTitle } = getTaskResourceUrl(task.task_type, weekTitle, topic);

  const openResource = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={`p-5 transition-all ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5">
          <Checkbox checked={task.completed} onChange={onToggle} />
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.title}
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" /> {task.estimated_minutes} min
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">{task.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge color="slate">{config.label}</Badge>
            {task.completed && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant={task.completed ? 'outline' : 'primary'}
              onClick={openResource}
            >
              <span className="flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                {config.actionLabel}
              </span>
            </Button>
            {!task.completed && (
              <Button size="sm" variant="outline" onClick={onToggle}>
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  Start & Complete
                </span>
              </Button>
            )}
            {task.completed && (
              <Button size="sm" variant="ghost" onClick={onToggle}>
                Mark Incomplete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
