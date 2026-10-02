import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Card, ProgressBar, Badge, Checkbox, Button, EmptyState } from '@/components/ui';
import type { Project, ProjectDifficulty, ProjectStatus } from '@/lib/types';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  PlayCircle,
  Circle,
  Target,
  Wrench,
  ListChecks,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const difficultyConfig: Record<ProjectDifficulty, { color: 'green' | 'blue' | 'amber' | 'red'; order: number }> = {
  Beginner: { color: 'green', order: 0 },
  Intermediate: { color: 'blue', order: 1 },
  Advanced: { color: 'amber', order: 2 },
  'Final Project': { color: 'red', order: 3 },
};

const statusConfig: Record<ProjectStatus, { label: string; icon: typeof Circle; color: string }> = {
  not_started: { label: 'Not Started', icon: Circle, color: 'text-slate-400' },
  in_progress: { label: 'In Progress', icon: PlayCircle, color: 'text-amber-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
};

export function Projects() {
  const { projects, projectTasks, toggleProjectTask, updateProjectStatus } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="w-8 h-8" />}
        title="No projects yet"
        description="Complete onboarding to get AI-generated projects matched to your learning topic."
      />
    );
  }

  const sortedProjects = [...projects].sort((a, b) => difficultyConfig[a.difficulty].order - difficultyConfig[b.difficulty].order);
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <p className="text-slate-500 mt-1">{completedProjects} of {projects.length} projects completed</p>
      </div>

      <div className="space-y-4">
        {sortedProjects.map((project) => {
          const tasks = projectTasks.filter((t) => t.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order);
          const completedTasks = tasks.filter((t) => t.completed).length;
          const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
          const expanded = expandedId === project.id;
          const statusCfg = statusConfig[project.status];
          const StatusIcon = statusCfg.icon;

          return (
            <Card key={project.id} className="overflow-hidden">
              {/* Project header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : project.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      project.status === 'completed' ? 'bg-green-100' :
                      project.status === 'in_progress' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <FolderKanban className={`w-5 h-5 ${statusCfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge color={difficultyConfig[project.difficulty].color}>{project.difficulty}</Badge>
                        <span className={`flex items-center gap-1 text-xs ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" /> {statusCfg.label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{project.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.objective}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {project.estimated_hours}h</span>
                        <span>{completedTasks}/{tasks.length} tasks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 hidden sm:block">
                      <div className="text-right mb-1"><span className="text-xs font-medium text-slate-600">{Math.round(progress)}%</span></div>
                      <ProgressBar value={progress} />
                    </div>
                    {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expanded && (
                <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/50">
                  {/* Objective */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-slate-500" />
                      <h4 className="text-sm font-semibold text-slate-900">Objective</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{project.objective}</p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Skills You'll Build</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <Badge key={skill} color="teal">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <h4 className="text-sm font-semibold text-slate-900">Requirements</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {project.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ListChecks className="w-4 h-4 text-slate-500" />
                      <h4 className="text-sm font-semibold text-slate-900">Project Tasks</h4>
                    </div>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                          <Checkbox checked={task.completed} onChange={() => toggleProjectTask(task, !task.completed)} />
                          <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Assistance */}
                  <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-teal-800">AI Assistance Available</p>
                      <p className="text-xs text-teal-600 mt-1">Your AI Mentor knows your project and can help with implementation, debugging, and design decisions.</p>
                    </div>
                  </div>

                  {/* Status controls */}
                  <div className="flex gap-2">
                    <Button size="sm" variant={project.status === 'in_progress' ? 'primary' : 'outline'} onClick={() => updateProjectStatus(project.id, 'in_progress')}>
                      Mark In Progress
                    </Button>
                    <Button size="sm" variant={project.status === 'completed' ? 'primary' : 'outline'} onClick={() => updateProjectStatus(project.id, 'completed')}>
                      Mark Completed
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
