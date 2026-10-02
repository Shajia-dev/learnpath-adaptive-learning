import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Card, ProgressBar, Button, Badge, Checkbox } from '@/components/ui';
import { analyzeAndAdapt, detectAdaptationNeeded, type AdaptationType, type AdaptationResult } from '@/lib/aiEngine';
import type { Page } from '@/components/AppLayout';
import {
  Flame,
  Target,
  CheckCircle2,
  FolderKanban,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Zap,
  Calendar,
  Layers,
} from 'lucide-react';

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const {
    profile,
    goal,
    allGoals,
    activeGoalId,
    weeks,
    tasks,
    projects,
    overallProgress,
    completedTasks,
    totalTasks,
    streak,
    currentWeek,
    weakTopics,
    toggleTask,
    updateGoal,
    saveAdaptation,
    switchGoal,
  } = useApp();

  const [showAdapt, setShowAdapt] = useState(false);

  if (!goal) return null;

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const todayTasks = currentWeek
    ? tasks.filter((t) => t.week_id === currentWeek.id).slice(0, 5)
    : [];
  const incompleteTodayTasks = todayTasks.filter((t) => !t.completed);
  const nextTask = incompleteTodayTasks[0] || null;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  const detected = detectAdaptationNeeded(goal, { completedTasks, totalTasks, currentWeek: currentWeek?.week_number || 1, streak, weakTopics });

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hello, {firstName}</h1>
          <p className="text-slate-500 mt-1">Here's your learning overview for today.</p>
          {allGoals.length > 1 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">Active plan:</span>
              <select
                value={activeGoalId || ''}
                onChange={(e) => switchGoal(e.target.value)}
                className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {allGoals.map((g) => (
                  <option key={g.id} value={g.id}>{g.topic}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('myplans')}>
            <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> My Plans</span>
          </Button>
          <Button variant="outline" onClick={() => onNavigate('learn')}>
            Continue Learning
          </Button>
          <Button onClick={() => setShowAdapt(true)}>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Adapt My Plan
            </span>
          </Button>
        </div>
      </div>

      {/* AI detection alert */}
      {detected && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">{detected.reason}</p>
              <button onClick={() => setShowAdapt(true)} className="text-sm text-amber-700 font-medium hover:text-amber-900 mt-1">
                Review suggestion →
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Overall Progress</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{overallProgress}%</p>
          <ProgressBar value={overallProgress} className="mt-3" />
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Current Week</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {currentWeek?.week_number || 0}
            <span className="text-sm font-normal text-slate-400"> / {weeks.length}</span>
          </p>
          <p className="text-xs text-slate-400 mt-3 truncate">{currentWeek?.title}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Current Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{streak} <span className="text-sm font-normal text-slate-400">days</span></p>
          <p className="text-xs text-slate-400 mt-3">{streak > 0 ? 'Keep it going!' : 'Start today!'}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Projects Done</span>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{completedProjects} <span className="text-sm font-normal text-slate-400">/ {projects.length}</span></p>
          <p className="text-xs text-slate-400 mt-3">Projects completed</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Today's Tasks</h2>
            <button onClick={() => onNavigate('learn')} className="text-sm text-teal-600 font-medium hover:text-teal-700">
              View all →
            </button>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No tasks for today. You're all caught up!</p>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <Checkbox checked={task.completed} onChange={() => toggleTask(task.id, !task.completed)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="slate">{task.task_type}</Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Current goal & next task */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-semibold text-slate-900">Learning Goal</h2>
            </div>
            <p className="text-sm text-slate-700 font-medium mb-1">{goal.topic}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{goal.goal}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{goal.hours_per_day}h/day · {goal.days_per_week}d/week</span>
              <Badge color="teal">{goal.current_level}</Badge>
            </div>
          </Card>

          {nextTask && (
            <Card className="p-6 bg-teal-50 border-teal-200">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-slate-900">Next Task</h2>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-1">{nextTask.title}</p>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{nextTask.description}</p>
              <Button size="sm" className="w-full" onClick={() => onNavigate('learn')}>
                <span className="flex items-center justify-center gap-1.5">
                  Start Now <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Week overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Plan Overview</h2>
          </div>
          <button onClick={() => onNavigate('plan')} className="text-sm text-teal-600 font-medium hover:text-teal-700">
            View full plan →
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeks.slice(0, 8).map((week) => (
            <div key={week.id} className="p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400">Week {week.week_number}</span>
                {week.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {week.status === 'in_progress' && <Badge color="amber">Active</Badge>}
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">{week.title}</p>
            </div>
          ))}
        </div>
      </Card>

      {showAdapt && (
        <AdaptModal
          onClose={() => setShowAdapt(false)}
          detectedType={detected?.type}
          goal={goal}
          progress={{ completedTasks, totalTasks, currentWeek: currentWeek?.week_number || 1, streak, weakTopics }}
          onUpdateGoal={updateGoal}
          onSaveAdaptation={saveAdaptation}
        />
      )}
    </div>
  );
}

function AdaptModal({
  onClose,
  detectedType,
  goal,
  progress,
  onUpdateGoal,
  onSaveAdaptation,
}: {
  onClose: () => void;
  detectedType?: AdaptationType;
  goal: import('@/lib/types').LearningGoal;
  progress: { completedTasks: number; totalTasks: number; currentWeek: number; streak: number; weakTopics: string[] };
  onUpdateGoal: (updates: Partial<Pick<import('@/lib/types').LearningGoal, 'hours_per_day' | 'days_per_week' | 'desired_duration_weeks' | 'topic' | 'goal' | 'current_level'>>) => Promise<void>;
  onSaveAdaptation: (adaptation: Parameters<ReturnType<typeof useApp>['saveAdaptation']>[0]) => Promise<void>;
}) {
  const [selectedType, setSelectedType] = useState<AdaptationType>(detectedType || 'less_time');
  const [newHours, setNewHours] = useState(String(goal.hours_per_day));
  const [newDays, setNewDays] = useState(String(goal.days_per_week));
  const [newDuration, setNewDuration] = useState(String(goal.desired_duration_weeks));
  const [newGoal, setNewGoal] = useState(goal.goal);
  const [newTopic, setNewTopic] = useState(goal.topic);
  const [result, setResult] = useState<AdaptationResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  const adaptationTypes: { type: AdaptationType; label: string; icon: typeof Zap; description: string }[] = [
    { type: 'less_time', label: 'Less Time Available', icon: Clock, description: 'Reduce daily study time and extend timeline' },
    { type: 'already_knows', label: 'Already Knows Topic', icon: CheckCircle2, description: 'Skip beginner content and move forward' },
    { type: 'struggling', label: 'Struggling with Topics', icon: AlertTriangle, description: 'Add simpler prerequisites and extra practice' },
    { type: 'finishes_early', label: 'Finishing Early', icon: Zap, description: 'Add harder content and advanced projects' },
    { type: 'missed_days', label: 'Missed Days', icon: Calendar, description: 'Create a recovery plan without overwhelming' },
    { type: 'goal_change', label: 'Goal Changed', icon: Target, description: 'Regenerate roadmap for new goal' },
  ];

  const handleAnalyze = () => {
    const params: Partial<Pick<typeof goal, 'hours_per_day' | 'days_per_week' | 'desired_duration_weeks' | 'topic' | 'goal'>> = {};
    if (selectedType === 'less_time') params.hours_per_day = parseFloat(newHours);
    if (selectedType === 'goal_change') { params.goal = newGoal; params.topic = newTopic; }
    if (selectedType === 'settings_change') {
      params.hours_per_day = parseFloat(newHours);
      params.days_per_week = parseInt(newDays);
      params.desired_duration_weeks = parseInt(newDuration);
    }

    const r = analyzeAndAdapt(selectedType, goal, progress, params);
    setResult(r);
  };

  const handleConfirm = async () => {
    if (!result) return;
    setConfirming(true);

    if (result.newValues && 'hours_per_day' in result.newValues) {
      await onUpdateGoal({
        hours_per_day: result.newValues.hours_per_day as number,
        desired_duration_weeks: result.newValues.desired_duration_weeks as number,
        days_per_week: result.newValues.days_per_week as number | undefined,
        topic: result.newValues.topic as string | undefined,
        goal: result.newValues.goal as string | undefined,
      });
    }

    await onSaveAdaptation({
      goal_id: goal.id,
      change_type: result.changeType,
      summary: result.summary,
      details: { whatChanged: result.whatChanged, why: result.why, newTimeline: result.newTimeline, newTasks: result.newTasks },
      old_values: result.oldValues,
      new_values: result.newValues,
      confirmed: true,
    });

    setConfirming(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900">Adapt My Plan</h2>
          </div>
          <p className="text-sm text-slate-500">Tell the AI what changed and it will recalculate your learning plan.</p>
        </div>

        <div className="p-6 space-y-5">
          {!result && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">What's changed?</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {adaptationTypes.map((at) => {
                    const Icon = at.icon;
                    const active = selectedType === at.type;
                    return (
                      <button
                        key={at.type}
                        onClick={() => setSelectedType(at.type)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                          active ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                        <div>
                          <p className={`text-sm font-medium ${active ? 'text-teal-700' : 'text-slate-700'}`}>{at.label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{at.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedType === 'less_time' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New hours per day</label>
                  <input type="number" value={newHours} onChange={(e) => setNewHours(e.target.value)} min={0.5} max={12} step={0.5}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              )}

              {selectedType === 'goal_change' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New topic</label>
                    <input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New goal</label>
                    <textarea value={newGoal} onChange={(e) => setNewGoal(e.target.value)} rows={2}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                  </div>
                </>
              )}

              <Button onClick={handleAnalyze} size="lg" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Analyze & Suggest Changes
                </span>
              </Button>
            </>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-2">Your learning plan has been updated</h3>
                <p className="text-sm text-slate-700">{result.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">What changed</h4>
                <ul className="space-y-1.5">
                  {result.whatChanged.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Why</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{result.why}</p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <span className="text-xs text-slate-400 block">New timeline</span>
                  <span className="text-sm font-medium text-slate-700">{result.newTimeline}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setResult(null)} className="flex-1">Back</Button>
                <Button onClick={handleConfirm} disabled={confirming} className="flex-1">
                  {confirming ? 'Applying...' : 'Confirm Changes'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
