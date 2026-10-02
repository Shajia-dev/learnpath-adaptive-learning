import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Card, Button, Badge, ProgressBar, EmptyState } from '@/components/ui';
import type { Page } from '@/components/AppLayout';
import type { LearningGoal } from '@/lib/types';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  PlayCircle,
  Circle,
  Clock,
  Calendar,
  Target,
  Sparkles,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export function MyPlans({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { allGoals, activeGoalId, switchGoal, deleteGoal, goal } = useApp();
  const [showForm, setShowForm] = useState(false);

  if (allGoals.length === 0 && !showForm) {
    return (
      <EmptyState
        icon={<Layers className="w-8 h-8" />}
        title="No learning plans yet"
        description="Create your first personalized AI learning plan to get started."
        action={<Button onClick={() => setShowForm(true)}><span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Create New Plan</span></Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Plans</h1>
          <p className="text-slate-500 mt-1">{allGoals.length} learning plan{allGoals.length !== 1 ? 's' : ''} · switch between them anytime</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Plan</span>
        </Button>
      </div>

      {showForm && <NewPlanForm onClose={() => setShowForm(false)} onCreated={() => { setShowForm(false); onNavigate('dashboard'); }} />}

      <div className="space-y-3">
        {allGoals.map((g) => (
          <PlanCard
            key={g.id}
            plan={g}
            isActive={g.id === activeGoalId}
            onSwitch={() => { switchGoal(g.id); onNavigate('dashboard'); }}
            onDelete={() => deleteGoal(g.id)}
            onView={() => { if (g.id !== activeGoalId) switchGoal(g.id); onNavigate('plan'); }}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, isActive, onSwitch, onDelete, onView }: {
  plan: LearningGoal;
  isActive: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const { weeks, tasks } = useApp();
  const planTasks = isActive ? tasks : [];
  const planWeeks = isActive ? weeks : [];
  const completedTasksCount = planTasks.filter((t) => t.completed).length;
  const progress = planTasks.length > 0 ? Math.round((completedTasksCount / planTasks.length) * 100) : 0;
  const completedWeeks = planWeeks.filter((w) => w.status === 'completed').length;

  return (
    <Card className={`p-5 ${isActive ? 'border-teal-400 ring-1 ring-teal-200' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-teal-100' : 'bg-slate-100'}`}>
            {isActive ? <PlayCircle className="w-5 h-5 text-teal-600" /> : <Circle className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-base font-semibold text-slate-900">{plan.topic}</h3>
              {isActive && <Badge color="teal">Active</Badge>}
              <Badge color="slate">{plan.current_level}</Badge>
            </div>
            <p className="text-sm text-slate-500 line-clamp-1">{plan.goal}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.hours_per_day}h/day · {plan.days_per_week}d/wk</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {plan.desired_duration_weeks} weeks</span>
              {isActive && <span>{completedTasksCount}/{planTasks.length} tasks · {completedWeeks} weeks done</span>}
            </div>
            {isActive && planTasks.length > 0 && (
              <div className="mt-3">
                <ProgressBar value={progress} />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        {!isActive && <Button size="sm" variant="primary" onClick={onSwitch}>Switch to This Plan</Button>}
        {isActive && <Button size="sm" variant="outline" onClick={onView}>View Plan Details</Button>}
        {allGoals.length > 1 && (
          <button
            onClick={onDelete}
            className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
    </Card>
  );
}

function NewPlanForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createGoalAndPlan } = useApp();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [goalText, setGoalText] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('2');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [duration, setDuration] = useState('12');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !goalText.trim()) {
      setError('Please fill in what you want to learn and your goal.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createGoalAndPlan({
        topic: topic.trim(),
        current_level: level,
        goal: goalText.trim(),
        hours_per_day: parseFloat(hoursPerDay),
        days_per_week: parseInt(daysPerWeek),
        desired_duration_weeks: parseInt(duration),
        deadline: deadline || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-teal-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Creating your new learning plan...</h3>
        <p className="text-sm text-slate-500 mb-4">AI is generating your personalized roadmap with weeks, tasks, projects, and resources.</p>
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-semibold text-slate-900">Create a New Learning Plan</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">What do you want to learn?</label>
          <input
            type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Python, React, Machine Learning, SQL..."
            required
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Current level</label>
          <select
            value={level} onChange={(e) => setLevel(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          >
            <option value="Beginner">Beginner — Starting from scratch</option>
            <option value="Basic">Basic — Some exposure</option>
            <option value="Intermediate">Intermediate — Comfortable with basics</option>
            <option value="Advanced">Advanced — Experienced, looking to master</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">What is your goal?</label>
          <textarea
            value={goalText} onChange={(e) => setGoalText(e.target.value)}
            placeholder="e.g. Pass technical interviews, build a web app, get a data science job..."
            required rows={2}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hours/day</label>
            <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} min={0.5} max={12} step={0.5} required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Days/week</label>
            <input type="number" value={daysPerWeek} onChange={(e) => setDaysPerWeek(e.target.value)} min={1} max={7} required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Weeks</label>
            <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} max={52} required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" />
          </div>
        </div>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex items-center gap-3">
          <Button type="submit" size="lg">
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Create Learning Plan</span>
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
