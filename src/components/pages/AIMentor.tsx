import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/lib/supabase';
import { generateMentorResponse, type MentorContext } from '@/lib/aiEngine';
import { Card, Button, EmptyState } from '@/components/ui';
import type { AIConversation } from '@/lib/types';
import {
  MessageSquare,
  Send,
  Sparkles,
  User as UserIcon,
  Bot,
  BookOpen,
  Code,
  FolderKanban,
  Target,
  RotateCcw,
} from 'lucide-react';

const quickPrompts = [
  { label: 'What should I study today?', icon: Target },
  { label: 'Explain this week\'s topic', icon: BookOpen },
  { label: 'Give me practice exercises', icon: Code },
  { label: 'Help with my project', icon: FolderKanban },
  { label: 'What should I revise?', icon: RotateCcw },
  { label: 'Why am I falling behind?', icon: Sparkles },
];

export function AIMentor() {
  const {
    session,
    goal,
    weeks,
    tasks,
    projects,
    overallProgress,
    completedTasks,
    totalTasks,
    streak,
    currentWeek,
    weakTopics,
  } = useApp();

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) setConversations(data as AIConversation[]);
        });
    }
  }, [session]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversations]);

  if (!goal) {
    return (
      <EmptyState
        icon={<MessageSquare className="w-8 h-8" />}
        title="AI Mentor not ready"
        description="Complete onboarding to start chatting with your AI Mentor."
      />
    );
  }

  const buildContext = (): MentorContext => {
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const recentTasks = (currentWeek
      ? tasks.filter((t) => t.week_id === currentWeek.id)
      : tasks
    ).slice(0, 10).map((t) => ({ title: t.title, completed: t.completed, task_type: t.task_type }));

    return {
      topic: goal.topic,
      level: goal.current_level,
      goal: goal.goal,
      currentWeek: currentWeek?.week_number || 1,
      totalWeeks: weeks.length,
      completedTasks,
      totalTasks,
      completedProjects,
      totalProjects: projects.length,
      overallProgress,
      streak,
      weakTopics,
      recentTasks,
      weekTitles: weeks.map((w) => w.title),
    };
  };

  const handleSend = async (message?: string) => {
    const content = (message || input).trim();
    if (!content || loading || !session?.user) return;

    setInput('');
    setLoading(true);

    // Optimistic add user message
    const userMsg: AIConversation = {
      id: `temp-${Date.now()}`,
      user_id: session.user.id,
      role: 'user',
      content,
      context: null,
      created_at: new Date().toISOString(),
    };
    setConversations((prev) => [...prev, userMsg]);

    // Generate AI response
    const ctx = buildContext();
    const response = generateMentorResponse(content, ctx);

    // Save both messages to DB
    const [{ data: savedUser }, { data: savedAI }] = await Promise.all([
      supabase.from('ai_conversations').insert({
        user_id: session.user.id,
        role: 'user',
        content,
      }).select().single(),
      supabase.from('ai_conversations').insert({
        user_id: session.user.id,
        role: 'assistant',
        content: response,
        context: { topic: ctx.topic, week: ctx.currentWeek, progress: ctx.overallProgress },
      }).select().single(),
    ]);

    if (savedUser && savedAI) {
      setConversations((prev) => [
        ...prev.filter((c) => c.id !== userMsg.id),
        savedUser as AIConversation,
        savedAI as AIConversation,
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">AI Mentor</h1>
            <p className="text-xs text-slate-500">Knows your goal, progress, and plan for {goal.topic}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversations.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Hi! I'm your AI Mentor</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                I know you're learning {goal.topic} at a {goal.current_level.toLowerCase()} level. You're on Week {currentWeek?.week_number || 1} with {overallProgress}% overall progress. Ask me anything!
              </p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                {quickPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.label}
                      onClick={() => handleSend(prompt.label)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 text-left text-sm text-slate-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      {prompt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {conversations.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-teal-600'
              }`}>
                {msg.role === 'user' ? (
                  <UserIcon className="w-4 h-4 text-slate-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your AI Mentor anything..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <Button onClick={() => handleSend()} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
