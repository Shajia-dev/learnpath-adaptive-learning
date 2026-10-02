import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Button, Input, Select } from '@/components/ui';
import { GraduationCap, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export function Onboarding() {
  const { createGoalAndPlan, session } = useApp();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-teal-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Creating your personalized learning plan...</h2>
          <p className="text-slate-500 mb-8">
            Our AI is analyzing your goal, level, and available time to build a custom roadmap with weeks, tasks, projects, and resources.
          </p>
          <div className="space-y-3 text-left max-w-sm mx-auto">
            {['Analyzing your topic and goal', 'Generating weekly roadmap', 'Creating practice tasks', 'Designing projects', 'Curating resources'].map((step, i) => (
              <div key={step} className="flex items-center gap-3 opacity-100" style={{ animationDelay: `${i * 0.3}s` }}>
                <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-sm text-slate-600">{step}</span>
              </div>
            ))}
          </div>
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mt-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">LearnPath AI</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to LearnPath AI</h1>
          <p className="text-slate-500 text-lg">Let's create a learning plan that fits your goal, level and available time.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">What do you want to learn?</label>
            <Input value={topic} onChange={setTopic} placeholder="e.g. Data Structures and Algorithms, Python, React, Machine Learning..." required />
          </div>

          <div>
            <Select
              label="Current level"
              value={level}
              onChange={setLevel}
              options={[
                { value: 'Beginner', label: 'Beginner — Starting from scratch' },
                { value: 'Basic', label: 'Basic — Some exposure to the topic' },
                { value: 'Intermediate', label: 'Intermediate — Comfortable with basics' },
                { value: 'Advanced', label: 'Advanced — Experienced, looking to master' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">What is your goal?</label>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="e.g. Pass technical interviews at top tech companies, build a full-stack web app, get a job as a data scientist..."
              required
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Hours per day" type="number" value={hoursPerDay} onChange={setHoursPerDay} min={0.5} max={12} step={0.5} required />
            </div>
            <div>
              <Input label="Days per week" type="number" value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input label="Desired duration (weeks)" type="number" value={duration} onChange={setDuration} min={1} max={52} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Optional deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <Button type="submit" size="lg" className="w-full">
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Create My Learning Plan
            </span>
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Signed in as {session?.user?.email}
        </p>
      </div>
    </div>
  );
}
