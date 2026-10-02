import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import { analyzeAndAdapt, type AdaptationType } from '@/lib/aiEngine';
import {
  Settings as SettingsIcon,
  User,
  Target,
  Clock,
  Save,
  Sparkles,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export function Settings() {
  const { profile, goal, updateProfile, updateGoal, saveAdaptation, adaptations } = useApp();
  const [name, setName] = useState(profile?.full_name || '');
  const [topic, setTopic] = useState(goal?.topic || '');
  const [level, setLevel] = useState(goal?.current_level || 'Beginner');
  const [goalText, setGoalText] = useState(goal?.goal || '');
  const [hoursPerDay, setHoursPerDay] = useState(String(goal?.hours_per_day || 2));
  const [daysPerWeek, setDaysPerWeek] = useState(String(goal?.days_per_week || 5));
  const [duration, setDuration] = useState(String(goal?.desired_duration_weeks || 12));
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPlan, setSavedPlan] = useState(false);
  const [adaptResult, setAdaptResult] = useState<{ summary: string; whatChanged: string[] } | null>(null);

  if (!goal) return null;

  const handleSaveProfile = async () => {
    await updateProfile(name);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 3000);
  };

  const handleUpdatePlan = async () => {
    const oldValues = {
      hours_per_day: goal.hours_per_day,
      days_per_week: goal.days_per_week,
      desired_duration_weeks: goal.desired_duration_weeks,
      topic: goal.topic,
      goal: goal.goal,
      current_level: goal.current_level,
    };

    await updateGoal({
      topic,
      current_level: level as typeof goal.current_level,
      goal: goalText,
      hours_per_day: parseFloat(hoursPerDay),
      days_per_week: parseInt(daysPerWeek),
      desired_duration_weeks: parseInt(duration),
      deadline: deadline || null,
    });

    // Run adaptation analysis
    const result = analyzeAndAdapt(
      'settings_change' as AdaptationType,
      goal,
      { completedTasks: 0, totalTasks: 0, currentWeek: 1, streak: 0, weakTopics: [] },
      {
        hours_per_day: parseFloat(hoursPerDay),
        days_per_week: parseInt(daysPerWeek),
        desired_duration_weeks: parseInt(duration),
      }
    );

    await saveAdaptation({
      goal_id: goal.id,
      change_type: 'settings_change',
      summary: result.summary,
      details: { whatChanged: result.whatChanged, why: result.why, newTimeline: result.newTimeline },
      old_values: oldValues,
      new_values: result.newValues,
      confirmed: true,
    });

    setAdaptResult({ summary: result.summary, whatChanged: result.whatChanged });
    setSavedPlan(true);
    setTimeout(() => setSavedPlan(false), 3000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your profile and learning preferences.</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
        </div>
        <div className="space-y-4 max-w-md">
          <Input label="Full Name" value={name} onChange={setName} placeholder="Your name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.id ? '(from account)' : ''}
              disabled
              placeholder="Managed by your account"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50"
            />
          </div>
          <Button onClick={handleSaveProfile} variant="outline">
            <span className="flex items-center gap-2">
              {savedProfile ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
              {savedProfile ? 'Saved!' : 'Save Profile'}
            </span>
          </Button>
        </div>
      </Card>

      {/* Learning Plan Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Learning Plan</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="sm:col-span-2">
            <Input label="What do you want to learn?" value={topic} onChange={setTopic} />
          </div>
          <Select
            label="Current level"
            value={level}
            onChange={(v) => setLevel(v as typeof level)}
            options={[
              { value: 'Beginner', label: 'Beginner' },
              { value: 'Basic', label: 'Basic' },
              { value: 'Intermediate', label: 'Intermediate' },
              { value: 'Advanced', label: 'Advanced' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Goal</label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            />
          </div>
          <Input label="Hours per day" type="number" value={hoursPerDay} onChange={setHoursPerDay} min={0.5} max={12} step={0.5} />
          <Input label="Days per week" type="number" value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} />
          <Input label="Duration (weeks)" type="number" value={duration} onChange={setDuration} min={1} max={52} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
            <input
              type="date"
              value={deadline || ''}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {adaptResult && (
          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-teal-800">Your learning plan has been updated</p>
                <p className="text-xs text-teal-600 mt-1">{adaptResult.summary}</p>
                <ul className="mt-2 space-y-1">
                  {adaptResult.whatChanged.map((c, i) => (
                    <li key={i} className="text-xs text-teal-700 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <Button onClick={handleUpdatePlan}>
            <span className="flex items-center gap-2">
              {savedPlan ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {savedPlan ? 'Plan Updated!' : 'Update Learning Plan'}
            </span>
          </Button>
        </div>
      </Card>

      {/* Plan adaptation history */}
      {adaptations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Plan Adaptation History</h2>
          </div>
          <div className="space-y-3">
            {adaptations.slice(0, 5).map((a) => (
              <div key={a.id} className="p-3 border border-slate-100 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <Badge color="teal">{a.change_type.replace(/_/g, ' ')}</Badge>
                  <span className="text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{a.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Logout */}
      <Card className="p-6">
        <Button variant="danger" onClick={handleLogout}>
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </span>
        </Button>
      </Card>
    </div>
  );
}
