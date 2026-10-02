import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Card, Badge, Checkbox, EmptyState } from '@/components/ui';
import { getResourceUrl } from '@/lib/resourceLinks';
import type { ResourceType } from '@/lib/types';
import {
  Library,
  Video,
  FileText,
  GraduationCap,
  Newspaper,
  Code2,
  ExternalLink,
  CheckCircle2,
  Filter,
} from 'lucide-react';

const resourceTypeConfig: Record<ResourceType, { icon: typeof Video; color: string; label: string }> = {
  video: { icon: Video, color: 'bg-red-100 text-red-600', label: 'Video' },
  documentation: { icon: FileText, color: 'bg-blue-100 text-blue-600', label: 'Documentation' },
  course: { icon: GraduationCap, color: 'bg-teal-100 text-teal-600', label: 'Course' },
  article: { icon: Newspaper, color: 'bg-amber-100 text-amber-600', label: 'Article' },
  practice: { icon: Code2, color: 'bg-green-100 text-green-600', label: 'Practice' },
};

const filterOptions: { value: ResourceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'video', label: 'Videos' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'course', label: 'Courses' },
  { value: 'article', label: 'Articles' },
  { value: 'practice', label: 'Practice' },
];

export function Resources() {
  const { resources, toggleResource, currentWeek, goal } = useApp();
  const [filter, setFilter] = useState<ResourceType | 'all'>('all');

  if (resources.length === 0) {
    return (
      <EmptyState
        icon={<Library className="w-8 h-8" />}
        title="No resources yet"
        description="Complete onboarding to get a curated resource library tailored to your learning topic."
      />
    );
  }

  const topic = goal?.topic || '';
  const filtered = filter === 'all' ? resources : resources.filter((r) => r.resource_type === filter);
  const completedCount = resources.filter((r) => r.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
        <p className="text-slate-500 mt-1">{completedCount} of {resources.length} resources completed · {topic}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === opt.value ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Current week highlight */}
      {currentWeek && (
        <Card className="p-4 bg-teal-50 border-teal-200">
          <p className="text-sm text-teal-800">
            <span className="font-semibold">Recommended for this week:</span> Resources for Week {currentWeek.week_number} — {currentWeek.title}
          </p>
        </Card>
      )}

      {/* Resource grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((resource) => {
          const config = resourceTypeConfig[resource.resource_type];
          const Icon = config.icon;
          const isCurrentWeek = currentWeek && resource.week_number === currentWeek.week_number;
          const { url, source } = getResourceUrl(resource.resource_type, topic, resource.topic);

          return (
            <Card key={resource.id} className={`p-5 ${isCurrentWeek ? 'border-teal-300' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">{resource.title}</h3>
                    <Checkbox checked={resource.completed} onChange={() => toggleResource(resource.id, !resource.completed)} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{resource.description}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge color="slate">{config.label}</Badge>
                    {resource.week_number && (
                      <span className="text-xs text-slate-400">Week {resource.week_number}</span>
                    )}
                    <span className="text-xs text-slate-400">{resource.topic}</span>
                    {resource.completed && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> Done
                      </span>
                    )}
                    {isCurrentWeek && !resource.completed && (
                      <Badge color="teal">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-medium hover:text-teal-700 transition-colors"
                    >
                      Open resource <ExternalLink className="w-3 h-3" />
                    </a>
                    <span className="text-xs text-slate-400">· {source}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
