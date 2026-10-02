import type {
  LearningGoal,
  PlanWeek,
  Task,
  Project,
  ProjectTask,
  Resource,
  TaskType,
  ProjectDifficulty,
  ResourceType,
  WeekStatus,
} from './types';

interface PlanInput {
  topic: string;
  current_level: string;
  goal: string;
  hours_per_day: number;
  days_per_week: number;
  desired_duration_weeks: number;
}

interface GeneratedWeek {
  week: Omit<PlanWeek, 'id' | 'user_id' | 'goal_id' | 'created_at'>;
  tasks: Omit<Task, 'id' | 'user_id' | 'week_id' | 'created_at' | 'completed' | 'completed_at'>[];
}

interface GeneratedPlan {
  weeks: GeneratedWeek[];
  projects: {
    project: Omit<Project, 'id' | 'user_id' | 'goal_id' | 'created_at'>;
    tasks: Omit<ProjectTask, 'id' | 'user_id' | 'project_id' | 'created_at' | 'completed' | 'completed_at'>[];
  }[];
  resources: Omit<Resource, 'id' | 'user_id' | 'goal_id' | 'created_at' | 'completed' | 'completed_at'>[];
}

const LEVEL_ORDER = ['Beginner', 'Basic', 'Intermediate', 'Advanced'];

const TASK_TEMPLATES: Record<TaskType, { verbs: string[]; suffixes: string[] }> = {
  learn: {
    verbs: ['Study', 'Understand', 'Learn', 'Explore', 'Master'],
    suffixes: ['core concepts', 'fundamentals', 'key principles', 'theory and intuition', 'foundational ideas'],
  },
  watch: {
    verbs: ['Watch', 'Follow along with', 'Review', 'Observe'],
    suffixes: ['a tutorial walkthrough', 'an explanatory video', 'a visual demonstration', 'a guided explanation'],
  },
  practice: {
    verbs: ['Solve', 'Practice', 'Work through', 'Complete', 'Attempt'],
    suffixes: ['3 practice problems', 'hands-on exercises', 'coding challenges', 'worked examples', 'drill problems'],
  },
  exercise: {
    verbs: ['Complete', 'Work through', 'Finish', 'Do'],
    suffixes: ['a structured exercise', 'an interactive exercise', 'a worksheet', 'a mini exercise set', 'a guided exercise'],
  },
  read: {
    verbs: ['Read', 'Review', 'Skim', 'Study'],
    suffixes: ['the documentation', 'a key article', 'a reference guide', 'a chapter', 'a blog post deep-dive'],
  },
  project: {
    verbs: ['Build', 'Create', 'Implement', 'Develop', 'Construct'],
    suffixes: ['a small project', 'a working demo', 'a practical application', 'a hands-on build', 'a proof of concept'],
  },
};

const RESOURCE_TITLES: Record<ResourceType, string[]> = {
  video: ['Video Tutorial Series', 'Crash Course', 'Step-by-Step Walkthrough', 'Visual Explainer'],
  documentation: ['Official Documentation', 'Reference Guide', 'Developer Guide', 'API Reference'],
  course: ['Free Interactive Course', 'Structured Bootcamp', 'Self-Paced Course', 'University Lecture Series'],
  article: ['In-Depth Blog Post', 'Technical Article', 'Comprehensive Guide', 'Expert Write-Up'],
  practice: ['Practice Platform', 'Problem Set Archive', 'Interactive Judge', 'Exercise Collection'],
};

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function generateWeeksForTopic(topic: string, input: PlanInput): string[] {
  const normalized = topic.toLowerCase().trim();

  const knownCurricula: Record<string, string[]> = {
    'data structures and algorithms': [
      'Arrays & Dynamic Arrays', 'Strings & Character Arrays', 'Linked Lists', 'Stacks & Queues',
      'Hash Maps & Hash Sets', 'Recursion & Backtracking', 'Sorting Algorithms', 'Binary Search',
      'Trees & Binary Trees', 'Binary Search Trees', 'Heaps & Priority Queues', 'Graphs & BFS/DFS',
      'Dynamic Programming Basics', 'Greedy Algorithms', 'Two Pointers & Sliding Window', 'Advanced DP & Review',
    ],
    'python': [
      'Variables, Types & Operators', 'Control Flow & Loops', 'Functions & Scope', 'Data Structures: Lists & Tuples',
      'Dictionaries & Sets', 'String Manipulation', 'File Handling & I/O', 'Error Handling & Exceptions',
      'Object-Oriented Programming', 'Modules & Packages', 'Working with Libraries', 'Web Scraping & APIs',
      'Testing & Debugging', 'Advanced Python Features', 'Project Building', 'Best Practices & Review',
    ],
    'javascript': [
      'Variables, Types & Operators', 'Control Flow & Functions', 'Arrays & Array Methods', 'Objects & Destructuring',
      'DOM Manipulation', 'Events & Event Handling', 'Async & Promises', 'Fetch & APIs',
      'ES6+ Features', 'Modules & Bundling', 'Error Handling', 'Classes & OOP in JS',
      'Functional Programming', 'Testing JavaScript', 'Project Building', 'Performance & Review',
    ],
    'react': [
      'JSX & Components', 'Props & State', 'Events & Forms', 'Conditional Rendering & Lists',
      'useEffect & Lifecycle', 'Context API', 'Refs & DOM Access', 'Custom Hooks',
      'React Router', 'State Management Patterns', 'API Integration', 'Performance Optimization',
      'Testing React Components', 'Advanced Patterns', 'Project Building', 'Deployment & Review',
    ],
    'machine learning': [
      'Math Foundations: Linear Algebra', 'Statistics & Probability', 'Python for ML', 'NumPy & Pandas',
      'Data Visualization', 'Linear Regression', 'Logistic Regression', 'Decision Trees & Random Forests',
      'KNN & SVM', 'Clustering: K-Means', 'Model Evaluation & Metrics', 'Cross-Validation & Tuning',
      'Neural Networks Basics', 'Deep Learning Intro', 'ML Project', 'Review & Next Steps',
    ],
    'sql': [
      'Database Basics & Tables', 'SELECT & WHERE', 'ORDER BY & LIMIT', 'Joins: INNER & LEFT',
      'GROUP BY & Aggregates', 'Subqueries', 'Window Functions', 'CTEs & Recursive Queries',
      'Indexes & Performance', 'Normalization', 'Transactions & ACID', 'Views & Materialized Views',
      'Stored Procedures', 'Database Design', 'Project: Build a Schema', 'Review & Practice',
    ],
    'web development': [
      'HTML Fundamentals', 'CSS & Layouts', 'Flexbox & Grid', 'Responsive Design',
      'JavaScript Basics', 'DOM & Events', 'Async JS & Fetch', 'Intro to Frontend Frameworks',
      'Backend Basics & Node.js', 'REST APIs', 'Databases & SQL Basics', 'Authentication',
      'Deploying Web Apps', 'Full-Stack Integration', 'Capstone Project', 'Review & Portfolio',
    ],
    'java': [
      'Syntax & Variables', 'Control Flow', 'Arrays & Strings', 'Methods & Overloading',
      'OOP: Classes & Objects', 'Inheritance & Polymorphism', 'Interfaces & Abstract Classes', 'Collections Framework',
      'Generics', 'Exception Handling', 'Streams & Lambdas', 'File I/O',
      'Multithreading Basics', 'JavaFX or Swing Basics', 'Project Building', 'Review & Best Practices',
    ],
  };

  for (const [key, weeks] of Object.entries(knownCurricula)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      const levelIdx = LEVEL_ORDER.indexOf(input.current_level as (typeof LEVEL_ORDER)[number]);
      const skipCount = Math.max(0, levelIdx * 2);
      const sliced = weeks.slice(skipCount);
      while (sliced.length < input.desired_duration_weeks) {
        sliced.push(`Advanced ${topic}: Part ${sliced.length - weeks.length + 1}`);
      }
      return sliced.slice(0, input.desired_duration_weeks);
    }
  }

  const genericWeeks: string[] = [];
  const phases = [
    { label: 'Foundations of', weight: 0.25 },
    { label: 'Core Concepts in', weight: 0.3 },
    { label: 'Intermediate', weight: 0.25 },
    { label: 'Advanced', weight: 0.2 },
  ];

  const phaseCounts = phases.map((p) => Math.max(1, Math.round(input.desired_duration_weeks * p.weight)));
  const totalAllocated = phaseCounts.reduce((a, b) => a + b, 0);
  phaseCounts[phaseCounts.length - 1] += input.desired_duration_weeks - totalAllocated;

  let weekIdx = 0;
  phases.forEach((phase, pi) => {
    for (let i = 0; i < phaseCounts[pi]; i++) {
      if (pi === 0) genericWeeks.push(`${phase.label} ${topic}: Part ${i + 1}`);
      else if (pi === phases.length - 1)
        genericWeeks.push(`${phase.label} ${topic} & Applications: Part ${i + 1}`);
      else genericWeeks.push(`${phase.label} ${topic}: Part ${i + 1}`);
      weekIdx++;
    }
  });

  const levelIdx = LEVEL_ORDER.indexOf(input.current_level as (typeof LEVEL_ORDER)[number]);
  const skipCount = Math.max(0, levelIdx * 2);
  const result = genericWeeks.slice(skipCount);
  while (result.length < input.desired_duration_weeks) {
    result.push(`Mastery of ${topic}: Part ${result.length + 1}`);
  }
  return result.slice(0, input.desired_duration_weeks);
}

function generateTasksForWeek(
  weekTitle: string,
  weekNumber: number,
  input: PlanInput
): GeneratedWeek['tasks'] {
  const topic = input.topic;
  const tasks: GeneratedWeek['tasks'] = [];
  const taskTypes: TaskType[] = ['learn', 'watch', 'practice', 'exercise', 'read'];
  const minutesPerDay = input.hours_per_day * 60;
  const totalMinutes = minutesPerDay * input.days_per_week;
  const taskCount = 5;
  const baseMinutes = Math.round(totalMinutes / taskCount);

  taskTypes.forEach((type, i) => {
    const template = TASK_TEMPLATES[type];
    const verb = pick(template.verbs, weekNumber + i);
    const suffix = pick(template.suffixes, weekNumber + i * 2);
    const title = `${verb} ${suffix}`;
    const description = `Focus: ${weekTitle}. This ${type} session is designed for a ${input.current_level.toLowerCase()} learner working toward "${input.goal}". Spend approximately ${baseMinutes} minutes engaging with the material actively.`;

    tasks.push({
      title,
      description,
      task_type: type,
      estimated_minutes: baseMinutes,
      resource_url: null,
      resource_title: null,
      sort_order: i,
    });
  });

  return tasks;
}

function generateProjects(topic: string, input: PlanInput): GeneratedPlan['projects'] {
  const difficulties: ProjectDifficulty[] = ['Beginner', 'Intermediate', 'Advanced', 'Final Project'];

  const projectIdeas: Record<ProjectDifficulty, { title: string; objective: string; skills: string[]; requirements: string[] }> = {
    Beginner: {
      title: `${topic} Fundamentals Explorer`,
      objective: `Build a simple application that demonstrates core ${topic} concepts.`,
      skills: [`Basic ${topic}`, 'Problem decomposition', 'Input/output handling'],
      requirements: ['Implement at least 3 core concepts', 'Handle basic user input', 'Display clear output', 'Keep it under 200 lines'],
    },
    Intermediate: {
      title: `${topic} Data Handler`,
      objective: `Create a project that processes data using intermediate ${topic} techniques.`,
      skills: [`Intermediate ${topic}`, 'Data structures', 'Algorithm selection', 'Error handling'],
      requirements: ['Use at least 2 data structures', 'Implement proper error handling', 'Include test cases', 'Process real or sample data'],
    },
    Advanced: {
      title: `${topic} Integration System`,
      objective: `Develop an advanced system that combines multiple ${topic} concepts into a cohesive solution.`,
      skills: [`Advanced ${topic}`, 'System design', 'Optimization', 'Architecture patterns'],
      requirements: ['Integrate 3+ advanced concepts', 'Optimize for performance', 'Document design decisions', 'Include comprehensive tests'],
    },
    'Final Project': {
      title: `Comprehensive ${topic} Application`,
      objective: `Build a production-quality application showcasing your full ${topic} mastery aligned with your goal: "${input.goal}".`,
      skills: [`Full ${topic} proficiency`, 'Project planning', 'Architecture', 'Testing', 'Documentation'],
      requirements: ['Solve a real-world problem', 'Include full documentation', 'Deploy or present the project', 'Demonstrate all skill levels', 'Code review ready'],
    },
  };

  const hoursBase = input.hours_per_day * input.days_per_week;

  return difficulties.map((diff, idx) => {
    const idea = projectIdeas[diff];
    const taskList = generateProjectTasks(diff, topic);
    return {
      project: {
        title: idea.title,
        difficulty: diff,
        objective: idea.objective,
        skills: idea.skills,
        requirements: idea.requirements,
        estimated_hours: Math.round((hoursBase * (idx + 2)) * 10) / 10,
        status: 'not_started' as const,
        sort_order: idx,
      },
      tasks: taskList,
    };
  });
}

function generateProjectTasks(difficulty: ProjectDifficulty, topic: string): GeneratedPlan['projects'][0]['tasks'] {
  const baseTasks: Record<ProjectDifficulty, string[]> = {
    Beginner: [
      `Set up your ${topic} development environment`,
      'Define the project scope and requirements',
      'Implement the core feature',
      'Add basic input/output handling',
      'Test with sample data',
      'Document your approach',
    ],
    Intermediate: [
      'Design the data flow and architecture',
      `Implement data processing with ${topic}`,
      'Add error handling and edge cases',
      'Write unit tests for core functions',
      'Optimize the implementation',
      'Create usage documentation',
    ],
    Advanced: [
      'Research and select advanced design patterns',
      `Implement the core ${topic} integration engine`,
      'Build the optimization layer',
      'Add comprehensive test coverage',
      'Benchmark and profile performance',
      'Write technical documentation',
    ],
    'Final Project': [
      'Define the real-world problem and scope',
      'Design the full system architecture',
      `Implement all ${topic} components`,
      'Integrate all subsystems',
      'Write comprehensive test suite',
      'Create user and developer documentation',
      'Deploy or prepare presentation',
      'Conduct final code review',
    ],
  };

  return baseTasks[difficulty].map((title, i) => ({
    title,
    sort_order: i,
  }));
}

function generateResources(topic: string, weekTitles: string[], input: PlanInput): GeneratedPlan['resources'] {
  const resources: GeneratedPlan['resources'] = [];
  const types: ResourceType[] = ['video', 'documentation', 'course', 'article', 'practice'];

  types.forEach((type, i) => {
    const titleWords = RESOURCE_TITLES[type];
    const numResources = type === 'documentation' ? 3 : 2;

    for (let j = 0; j < numResources; j++) {
      const weekIdx = Math.min(weekTitles.length - 1, j * Math.floor(weekTitles.length / numResources));
      const weekTopic = weekTitles[weekIdx] || topic;
      const resourceTitle = pick(titleWords, j + i);

      resources.push({
        title: `${weekTopic}: ${resourceTitle}`,
        description: `A curated ${type} resource for learning ${weekTopic}. Recommended for ${input.current_level.toLowerCase()} level learners studying ${topic}.`,
        resource_type: type,
        topic: weekTopic,
        url: '#',
        week_number: weekIdx + 1,
      });
    }
  });

  return resources;
}

export function generateLearningPlan(input: PlanInput): GeneratedPlan {
  const weekTitles = generateWeeksForTopic(input.topic, input);
  const weeklyHours = input.hours_per_day * input.days_per_week;

  const weeks: GeneratedWeek[] = weekTitles.map((title, idx) => ({
    week: {
      week_number: idx + 1,
      title,
      goal_description: `Master ${title} through structured learning and hands-on practice. By the end of this week, you should be comfortable applying these concepts to solve problems related to "${input.goal}".`,
      topics: [title],
      estimated_hours: Math.round(weeklyHours * 10) / 10,
      status: (idx === 0 ? 'in_progress' : 'upcoming') as WeekStatus,
    },
    tasks: generateTasksForWeek(title, idx + 1, input),
  }));

  const projects = generateProjects(input.topic, input);
  const resources = generateResources(input.topic, weekTitles, input);

  return { weeks, projects, resources };
}

// ========================
// AI Mentor Engine
// ========================

export interface MentorContext {
  topic: string;
  level: string;
  goal: string;
  currentWeek: number;
  totalWeeks: number;
  completedTasks: number;
  totalTasks: number;
  completedProjects: number;
  totalProjects: number;
  overallProgress: number;
  streak: number;
  weakTopics: string[];
  recentTasks: { title: string; completed: boolean; task_type: string }[];
  weekTitles: string[];
}

function buildContextSummary(ctx: MentorContext): string {
  const currentTopic = ctx.weekTitles[ctx.currentWeek - 1] || ctx.topic;
  const incomplete = ctx.recentTasks.filter((t) => !t.completed);
  const completed = ctx.recentTasks.filter((t) => t.completed);
  const lines: string[] = [
    `Topic: ${ctx.topic}`,
    `Level: ${ctx.level}`,
    `Goal: ${ctx.goal}`,
    `Current week: ${ctx.currentWeek} of ${ctx.totalWeeks} — ${currentTopic}`,
    `Overall progress: ${ctx.overallProgress}% (${ctx.completedTasks}/${ctx.totalTasks} tasks done)`,
    `Streak: ${ctx.streak} days`,
    `Projects: ${ctx.completedProjects}/${ctx.totalProjects} completed`,
  ];
  if (incomplete.length > 0) lines.push(`Incomplete tasks: ${incomplete.map((t) => t.title).join(', ')}`);
  if (completed.length > 0) lines.push(`Completed tasks: ${completed.map((t) => t.title).join(', ')}`);
  if (ctx.weakTopics.length > 0) lines.push(`Weak areas: ${ctx.weakTopics.join(', ')}`);
  return lines.join('\n');
}

export function generateMentorResponse(userMessage: string, ctx: MentorContext): string {
  const msg = userMessage.toLowerCase().trim();
  const currentTopic = ctx.weekTitles[ctx.currentWeek - 1] || ctx.topic;
  const incompleteTasks = ctx.recentTasks.filter((t) => !t.completed);
  const completedTasksList = ctx.recentTasks.filter((t) => t.completed);

  // --- "What should I study today?" ---
  if (msg.includes('study today') || msg.includes('what should i do') || msg.includes('what to do') || msg.includes("what's next") || msg.includes('what is next')) {
    if (incompleteTasks.length > 0) {
      const next = incompleteTasks[0];
      const second = incompleteTasks[1];
      const lines = [
        `Based on your current week (Week ${ctx.currentWeek}: ${currentTopic}), here's my recommendation for today:`,
        ``,
        `**Priority 1: ${next.title}**`,
        `This is a ${next.task_type} task. You haven't completed it yet, and it's the next logical step in your plan.`,
        `Estimated time: ~${ctx.totalTasks > 0 ? Math.round(60 / 5) : 30} minutes.`,
      ];
      if (second) {
        lines.push(``, `**Priority 2: ${second.title}**`, `If you have time after the first task, this ${second.task_type} task is next.`);
      }
      lines.push(
        ``,
        `Your stats: ${ctx.overallProgress}% overall progress, ${ctx.streak}-day streak, ${ctx.completedTasks}/${ctx.totalTasks} tasks completed.`,
        ctx.streak > 0 ? `Keep your ${ctx.streak}-day streak alive by completing at least one task today!` : `Start a new streak today by completing your first task.`,
        ``,
        `Go to the **Learn** page to open the resource and complete each task.`
      );
      return lines.join('\n');
    }
    return [
      `You've completed all ${completedTasksList.length} tasks in your current week (Week ${ctx.currentWeek}: ${currentTopic}). Excellent work!`,
      ``,
      `Here's what I suggest next:`,
      `1. Review this week's concepts to reinforce what you learned`,
      `2. Head to the **Projects** page — you have ${ctx.totalProjects - ctx.completedProjects} projects remaining`,
      `3. Or move to Week ${ctx.currentWeek + 1}: ${ctx.weekTitles[ctx.currentWeek] || 'next week'}`,
      ``,
      `Your overall progress is ${ctx.overallProgress}% with a ${ctx.streak}-day streak. You're on track!`,
    ].join('\n');
  }

  // --- "Explain this topic" ---
  if (msg.includes('explain') || msg.includes('what is') || msg.includes('understand') || msg.includes("this topic") || msg.includes("this week")) {
    return [
      `Let me break down **${currentTopic}** — your Week ${ctx.currentWeek} topic in the ${ctx.topic} learning plan.`,
      ``,
      `Since you're at a **${ctx.level.toLowerCase()}** level, here's how to approach it:`,
      ``,
      `**What it is:** ${currentTopic} is a key concept in ${ctx.topic}. It builds on what you've learned in previous weeks${ctx.currentWeek > 1 ? ` (Week ${ctx.currentWeek - 1}: ${ctx.weekTitles[ctx.currentWeek - 2]})` : ''}.`,
      ``,
      `**How to learn it (3 steps):**`,
      `1. Read or watch an introduction to ${currentTopic} — go to the **Learn** page and click "Open Material" on the first task`,
      `2. Work through a simple example by hand before writing any code`,
      `3. Solve 2-3 practice problems to solidify your understanding`,
      ``,
      `**Why it matters for your goal:**`,
      `Your goal is "${ctx.goal}". ${currentTopic} is essential because it's a foundational building block that later weeks depend on.`,
      ``,
      `**Your current status:** ${incompleteTasks.length} tasks remaining this week, ${completedTasksList.length} completed. ${incompleteTasks.length === 0 ? 'You\'ve finished all tasks for this topic!' : 'Start with the first incomplete task on the Learn page.'}`,
      ``,
      `Would you like me to suggest specific practice exercises for ${currentTopic}?`,
    ].join('\n');
  }

  // --- "I am struggling with this topic" ---
  if (msg.includes('struggling') || msg.includes('hard') || msg.includes('difficult') || msg.includes('falling behind') || msg.includes("can't") || msg.includes("cant") || msg.includes("stuck")) {
    const weakList = ctx.weakTopics.length > 0 ? ctx.weakTopics : [currentTopic];
    return [
      `I can see you're having a tough time. Let me analyze your situation:`,
      ``,
      `**Where you are now:**`,
      `- Week ${ctx.currentWeek} of ${ctx.totalWeeks} (${currentTopic})`,
      `- Overall progress: ${ctx.overallProgress}%`,
      `- Tasks completed this week: ${completedTasksList.length}/${completedTasksList.length + incompleteTasks.length}`,
      `- Current streak: ${ctx.streak} days`,
      ``,
      `**Topics that need attention:**`,
      ...weakList.map((t, i) => `${i + 1}. ${t}`),
      ``,
      `**My recommendations:**`,
      `1. **Slow down on ${currentTopic}** — don't rush. Re-read the material or watch a different video explanation (use the "Watch Video" button on the Learn page)`,
      `2. **Go back to prerequisites** — ${ctx.currentWeek > 1 ? `review Week ${ctx.currentWeek - 1} (${ctx.weekTitles[ctx.currentWeek - 2]})` : 'review the basics of ' + ctx.topic} before tackling ${currentTopic}`,
      `3. **Do easier practice first** — start with simple problems before moving to complex ones`,
      `4. **Use the Adapt My Plan feature** — go to the Dashboard and click "Adapt My Plan" to extend your timeline and reduce daily workload`,
      ``,
      `Remember: struggling means you're learning. Your progress of ${ctx.overallProgress}% shows you ARE making progress. Would you like me to help you adapt your plan to give you more time?`,
    ].join('\n');
  }

  // --- "What should I revise?" ---
  if (msg.includes('revise') || msg.includes('review') || msg.includes('weak') || msg.includes('reinforce')) {
    if (ctx.weakTopics.length > 0) {
      return [
        `Based on your task completion data, here are the topics that need revision:`,
        ``,
        ...ctx.weakTopics.map((t, i) => `**${i + 1}. ${t}** — Your completion rate on this topic is below 50%. Go back and work through 2-3 practice problems.`),
        ``,
        `**How to revise effectively:**`,
        `1. Re-read the documentation or watch a refresher video (use the Learn page resource buttons)`,
        `2. Solve practice problems on the topic — use the "Start Practice" button`,
        `3. Try to explain the concept in your own words`,
        ``,
        `Your overall progress is ${ctx.overallProgress}%. These weak areas are dragging your progress down — addressing them will help you move faster through the remaining weeks.`,
        `Current streak: ${ctx.streak} days. ${ctx.streak > 0 ? 'Keep it going!' : 'Start a new streak today!'}`,
      ].join('\n');
    }
    return [
      `Good news — I don't see any significant weak areas in your progress data! You're at ${ctx.overallProgress}% overall with ${ctx.completedTasks}/${ctx.totalTasks} tasks completed.`,
      ``,
      `For general revision, I'd suggest:`,
      `1. Skim through the topics from earlier weeks: ${ctx.weekTitles.slice(0, Math.max(0, ctx.currentWeek - 1)).slice(-3).join(', ')}`,
      `2. Review your completed projects on the Projects page`,
      `3. Try a practice problem that combines multiple topics you've learned`,
      ``,
      `Your ${ctx.streak}-day streak shows consistency. Keep up the great work!`,
    ].join('\n');
  }

  // --- "Give me practice" ---
  if (msg.includes('practice') || msg.includes('exercise') || msg.includes('give me') || msg.includes('problems')) {
    return [
      `Here are 3 practice exercises for **${currentTopic}** (Week ${ctx.currentWeek}), tailored to your ${ctx.level.toLowerCase()} level:`,
      ``,
      `**Exercise 1 — Easy (${ctx.topic} basics):**`,
      `Implement the simplest version of ${currentTopic}. Focus on correctness, not speed. Test with a small input first.`,
      ``,
      `**Exercise 2 — Medium (real-world application):**`,
      `Apply ${currentTopic} to a problem related to your goal: "${ctx.goal}". Think about edge cases and error handling.`,
      ``,
      `**Exercise 3 — Challenge (integration):**`,
      `Combine ${currentTopic} with ${ctx.currentWeek > 1 ? ctx.weekTitles[ctx.currentWeek - 2] : 'the fundamentals of ' + ctx.topic}. This builds your ability to connect concepts across weeks.`,
      ``,
      `**Where to practice:** Go to the **Learn** page and click "Start Practice" on the practice task — it will take you to a relevant practice platform for ${ctx.topic}.`,
      ``,
      `Your stats: ${ctx.completedTasks}/${ctx.totalTasks} tasks done, ${ctx.overallProgress}% overall. Let's push that number up!`,
    ].join('\n');
  }

  // --- "Help with my project" ---
  if (msg.includes('project') || msg.includes('build')) {
    const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Final Project'];
    const nextDiff = difficulties[Math.min(ctx.completedProjects, 3)];
    return [
      `Let me help with your projects. Here's your current project status:`,
      ``,
      `**Completed:** ${ctx.completedProjects} of ${ctx.totalProjects} projects`,
      `**Next project:** ${nextDiff} difficulty level`,
      ``,
      `**My recommendation for your ${nextDiff} project:**`,
      `Since your goal is "${ctx.goal}", the project should directly serve that purpose.`,
      ``,
      `**Steps to succeed:**`,
      `1. Go to the **Projects** page and expand the ${nextDiff} project to see all sub-tasks`,
      `2. Complete the sub-tasks one at a time — don't try to build everything at once`,
      `3. Use the "Open Guide" button on the Learn page to find tutorials for ${currentTopic}`,
      `4. If you get stuck on a specific part, ask me about that specific concept`,
      ``,
      ctx.completedProjects > 0
        ? `You've already completed ${ctx.completedProjects} project${ctx.completedProjects > 1 ? 's' : ''} — you know the process. Keep going!`
        : 'This will be your first project. Take it step by step — you\'ve got this!',
    ].join('\n');
  }

  // --- Progress / streak ---
  if (msg.includes('streak') || msg.includes('progress') || msg.includes('how am i doing')) {
    return [
      `Here's your complete progress snapshot:`,
      ``,
      `**Plan overview:**`,
      `- Topic: ${ctx.topic}`,
      `- Level: ${ctx.level}`,
      `- Goal: ${ctx.goal}`,
      `- Timeline: ${ctx.totalWeeks} weeks (currently Week ${ctx.currentWeek})`,
      ``,
      `**Progress:**`,
      `- Overall: ${ctx.overallProgress}%`,
      `- Tasks: ${ctx.completedTasks}/${ctx.totalTasks} completed`,
      `- Projects: ${ctx.completedProjects}/${ctx.totalProjects} completed`,
      `- Streak: ${ctx.streak} days`,
      ``,
      `**Current week:** ${currentTopic}`,
      `- ${completedTasksList.length} tasks completed, ${incompleteTasks.length} remaining`,
      ``,
      ctx.weakTopics.length > 0 ? `**Areas to improve:** ${ctx.weakTopics.join(', ')}` : '',
      ``,
      ctx.streak > 0
        ? `Your ${ctx.streak}-day streak is great — keep it alive by completing a task today!`
        : 'Your streak is at 0 — start a new one today by completing at least one task!',
    ].join('\n');
  }

  // --- Goal ---
  if (msg.includes('goal') || msg.includes('why am i learning') || msg.includes('purpose')) {
    return [
      `Here's why you're learning and where you're headed:`,
      ``,
      `**Your goal:** "${ctx.goal}"`,
      `**Your topic:** ${ctx.topic}`,
      `**Your level:** ${ctx.level}`,
      ``,
      `**Your plan:** ${ctx.totalWeeks} weeks, currently on Week ${ctx.currentWeek} (${currentTopic}).`,
      `You're ${ctx.overallProgress}% of the way to your goal.`,
      ``,
      `**What's ahead:**`,
      ...ctx.weekTitles.slice(ctx.currentWeek - 1, Math.min(ctx.currentWeek + 2, ctx.totalWeeks)).map((w, i) => `- Week ${ctx.currentWeek + i}: ${w}`),
      ``,
      `Every task, project, and resource was designed to move you toward "${ctx.goal}". Keep going — you're making real progress!`,
    ].join('\n');
  }

  // --- Adapt plan ---
  if (msg.includes('adapt') || msg.includes('change plan') || msg.includes('update plan') || msg.includes('less time') || msg.includes('more time')) {
    return [
      `I can adapt your learning plan based on your situation. Here's what I can adjust:`,
      ``,
      `**Current plan settings:**`,
      `- ${ctx.totalWeeks} weeks total`,
      `- Week ${ctx.currentWeek} in progress`,
      `- ${ctx.overallProgress}% completed`,
      ``,
      `**What I can do:**`,
      `1. **Less time available?** I'll redistribute tasks and extend the timeline`,
      `2. **Already know a topic?** I'll skip beginner content and move you forward`,
      `3. **Struggling?** I'll add simpler prerequisites and extra practice for ${ctx.weakTopics.length > 0 ? ctx.weakTopics.join(', ') : 'weak topics'}`,
      `4. **Goal changed?** I'll regenerate the remaining roadmap`,
      `5. **Missed days?** I'll create a recovery plan without overwhelming you`,
      ``,
      `Go to the **Dashboard** and click **Adapt My Plan** to make changes. Tell me what's changed in your situation and I'll suggest specific adjustments.`,
    ].join('\n');
  }

  // --- Greeting ---
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('help')) {
    return [
      `Hi! I'm your AI Mentor for **${ctx.topic}**. I have full context on your learning journey:`,
      ``,
      `**Your profile:**`,
      `- Learning: ${ctx.topic} at ${ctx.level} level`,
      `- Goal: ${ctx.goal}`,
      `- Current: Week ${ctx.currentWeek}/${ctx.totalWeeks} — ${currentTopic}`,
      `- Progress: ${ctx.overallProgress}% (${ctx.completedTasks}/${ctx.totalTasks} tasks)`,
      `- Streak: ${ctx.streak} days`,
      `- Projects: ${ctx.completedProjects}/${ctx.totalProjects} done`,
      `${ctx.weakTopics.length > 0 ? `- Weak areas: ${ctx.weakTopics.join(', ')}` : ''}`,
      ``,
      `I can help with:`,
      `- Explaining any topic in your plan`,
      `- Suggesting practice exercises for your current week`,
      `- Helping with your projects`,
      `- Telling you exactly what to study today`,
      `- Identifying weak areas to revise`,
      `- Analyzing why you might be falling behind`,
      `- Adapting your plan when life changes`,
      ``,
      `What would you like to work on?`,
    ].join('\n');
  }

  // --- Default: use full context to answer ---
  return [
    `I'm your AI Mentor for **${ctx.topic}**. I can see your full learning context:`,
    ``,
    buildContextSummary(ctx),
    ``,
    `I can help with:`,
    `- "What should I study today?" — I'll look at your incomplete tasks and recommend the next one`,
    `- "Explain this topic" — I'll break down ${currentTopic} for your ${ctx.level.toLowerCase()} level`,
    `- "I am struggling" — I'll analyze your weak areas and suggest a recovery plan`,
    `- "Give me practice" — I'll suggest exercises for ${currentTopic}`,
    `- "What should I revise?" — I'll check your weak topics`,
    `- "Help with my project" — I'll guide your next project step`,
    ``,
    `What would you like to know?`,
  ].join('\n');
}

// ========================
// Adaptive Plan Engine
// ========================

export type AdaptationType =
  | 'less_time'
  | 'already_knows'
  | 'struggling'
  | 'finishes_early'
  | 'missed_days'
  | 'goal_change'
  | 'settings_change';

export interface AdaptationResult {
  changeType: AdaptationType;
  summary: string;
  whatChanged: string[];
  why: string;
  newTimeline: string;
  newTasks: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export function analyzeAndAdapt(
  type: AdaptationType,
  goal: LearningGoal,
  progress: { completedTasks: number; totalTasks: number; currentWeek: number; streak: number; weakTopics: string[] },
  newParams?: Partial<Pick<LearningGoal, 'hours_per_day' | 'days_per_week' | 'desired_duration_weeks' | 'topic' | 'goal' | 'current_level'>>
): AdaptationResult {
  switch (type) {
    case 'less_time': {
      const newHours = newParams?.hours_per_day ?? goal.hours_per_day;
      const oldWeekly = goal.hours_per_day * goal.days_per_week;
      const newWeekly = newHours * goal.days_per_week;
      const ratio = oldWeekly / Math.max(newWeekly, 1);
      const newDuration = Math.ceil(goal.desired_duration_weeks * ratio);

      return {
        changeType: 'less_time',
        summary: `Reduced daily time from ${goal.hours_per_day}h to ${newHours}h — plan extended from ${goal.desired_duration_weeks} to ${newDuration} weeks.`,
        whatChanged: [
          `Daily study time reduced from ${goal.hours_per_day}h to ${newHours}h`,
          `Plan extended from ${goal.desired_duration_weeks} to ${newDuration} weeks`,
          'Task estimated times recalculated',
          'Lower-priority tasks spread across more days',
        ],
        why: `With fewer hours per day, each week covers less material. I've extended the timeline so you still learn everything without being overwhelmed.`,
        newTimeline: `${newDuration} weeks at ${newHours}h/day × ${goal.days_per_week} days/week`,
        newTasks: ['Recalculated all task durations', 'Redistributed practice tasks across longer timeline'],
        oldValues: { hours_per_day: goal.hours_per_day, desired_duration_weeks: goal.desired_duration_weeks },
        newValues: { hours_per_day: newHours, desired_duration_weeks: newDuration },
      };
    }

    case 'already_knows': {
      const skipWeeks = 2;
      const newDuration = Math.max(1, goal.desired_duration_weeks - skipWeeks);
      return {
        changeType: 'already_knows',
        summary: `Skipped ${skipWeeks} beginner weeks — plan shortened from ${goal.desired_duration_weeks} to ${newDuration} weeks.`,
        whatChanged: [
          `Marked Weeks 1-${skipWeeks} as completed (you already know this)`,
          `Plan shortened from ${goal.desired_duration_weeks} to ${newDuration} weeks`,
          'Moved to more advanced content sooner',
        ],
        why: `You indicated you already know the beginner material. I've skipped those weeks and moved you forward so you don't waste time on things you already understand.`,
        newTimeline: `${newDuration} weeks (started from Week ${skipWeeks + 1})`,
        newTasks: ['Skipped beginner weeks', 'Reordered remaining weeks'],
        oldValues: { desired_duration_weeks: goal.desired_duration_weeks },
        newValues: { desired_duration_weeks: newDuration, skipped_weeks: skipWeeks },
      };
    }

    case 'struggling': {
      return {
        changeType: 'struggling',
        summary: 'Added extra practice and simpler prerequisites for weak topics.',
        whatChanged: [
          `Added review tasks for: ${progress.weakTopics.join(', ') || 'current week topics'}`,
          'Inserted prerequisite refresher tasks',
          'Added 2 extra practice problems per weak topic',
          'Extended current week by a few days',
        ],
        why: `Your task completion pattern shows these topics need more attention. I've added simpler explanations and extra practice so you can build confidence before moving on.`,
        newTimeline: `${goal.desired_duration_weeks} weeks (current week extended slightly)`,
        newTasks: ['Added review tasks for weak topics', 'Added prerequisite refreshers', 'Added extra practice problems'],
        oldValues: {},
        newValues: { weak_topics: progress.weakTopics, added_tasks: true },
      };
    }

    case 'finishes_early': {
      return {
        changeType: 'finishes_early',
        summary: 'You\'re ahead of schedule! Added advanced topics and harder projects.',
        whatChanged: [
          'Moved upcoming weeks forward',
          'Added an advanced bonus project',
          'Introduced harder practice problems',
          'Adjusted timeline to finish sooner',
        ],
        why: `You're completing tasks faster than expected. Rather than slowing down, I've added more challenging content to keep you growing.`,
        newTimeline: `${Math.max(1, goal.desired_duration_weeks - 1)} weeks (accelerated)`,
        newTasks: ['Added advanced bonus project', 'Introduced harder practice problems', 'Moved weeks forward'],
        oldValues: {},
        newValues: { accelerated: true, added_advanced_project: true },
      };
    }

    case 'missed_days': {
      const missedDays = Math.max(0, 7 - progress.streak);
      return {
        changeType: 'missed_days',
        summary: `Created a recovery plan for ${missedDays} missed day${missedDays !== 1 ? 's' : ''}.`,
        whatChanged: [
          `Redistributed missed tasks across the next ${Math.min(missedDays + 3, 7)} days`,
          'No new topics until caught up',
          'Reduced daily load slightly to ease back in',
          'Kept the original deadline if possible',
        ],
        why: `Missing days happens. Instead of dumping everything on you at once, I've spread the missed work out so you can recover without stress.`,
        newTimeline: `${goal.desired_duration_weeks} weeks (recovery this week)`,
        newTasks: ['Redistributed missed tasks', 'Eased daily load for recovery'],
        oldValues: {},
        newValues: { missed_days: missedDays, recovery_plan: true },
      };
    }

    case 'goal_change': {
      const newGoal = newParams?.goal ?? goal.goal;
      const newTopic = newParams?.topic ?? goal.topic;
      return {
        changeType: 'goal_change',
        summary: `Goal updated to "${newGoal}" — remaining roadmap regenerated for ${newTopic}.`,
        whatChanged: [
          `Learning goal changed to: "${newGoal}"`,
          `Topic updated to: ${newTopic}`,
          'Regenerated remaining weeks based on new goal',
          'Updated projects to match new direction',
          'Refreshed resource recommendations',
        ],
        why: `Your new goal requires a different focus. I've regenerated the remaining roadmap while preserving your completed progress.`,
        newTimeline: `${goal.desired_duration_weeks} weeks (remaining weeks regenerated)`,
        newTasks: ['Regenerated remaining weeks', 'Updated projects', 'Refreshed resources'],
        oldValues: { goal: goal.goal, topic: goal.topic },
        newValues: { goal: newGoal, topic: newTopic },
      };
    }

    case 'settings_change': {
      const newHours = newParams?.hours_per_day ?? goal.hours_per_day;
      const newDays = newParams?.days_per_week ?? goal.days_per_week;
      const newDuration = newParams?.desired_duration_weeks ?? goal.desired_duration_weeks;
      return {
        changeType: 'settings_change',
        summary: `Updated schedule: ${newHours}h/day, ${newDays} days/week, ${newDuration} weeks.`,
        whatChanged: [
          `Daily time: ${goal.hours_per_day}h → ${newHours}h`,
          `Days per week: ${goal.days_per_week} → ${newDays}`,
          `Duration: ${goal.desired_duration_weeks} → ${newDuration} weeks`,
          'All task estimates recalculated',
        ],
        why: `Your updated schedule changes how much material you can cover each week. I've recalculated everything to match your new availability.`,
        newTimeline: `${newDuration} weeks at ${newHours}h/day × ${newDays} days/week`,
        newTasks: ['Recalculated all task durations', 'Adjusted week content density'],
        oldValues: { hours_per_day: goal.hours_per_day, days_per_week: goal.days_per_week, desired_duration_weeks: goal.desired_duration_weeks },
        newValues: { hours_per_day: newHours, days_per_week: newDays, desired_duration_weeks: newDuration },
      };
    }
  }
}

export function detectAdaptationNeeded(
  goal: LearningGoal,
  progress: { completedTasks: number; totalTasks: number; currentWeek: number; streak: number; weakTopics: string[] }
): { type: AdaptationType; reason: string } | null {
  if (progress.weakTopics.length >= 3) {
    return { type: 'struggling', reason: 'Multiple weak areas detected — extra practice recommended.' };
  }
  if (progress.streak === 0 && progress.totalTasks > 5) {
    return { type: 'missed_days', reason: 'Your streak has been broken — a recovery plan can help.' };
  }
  const expectedProgress = (progress.currentWeek / goal.desired_duration_weeks) * 100;
  const actualProgress = progress.totalTasks > 0 ? (progress.completedTasks / progress.totalTasks) * 100 : 0;
  if (actualProgress > expectedProgress + 15 && actualProgress > 50) {
    return { type: 'finishes_early', reason: 'You\'re ahead of schedule — ready for harder content.' };
  }
  return null;
}
