import type { TaskType, ResourceType } from './types';

// Build real, working external URLs based on the user's learning topic.
// We use search URLs on well-known platforms so links always resolve.

function youtubeSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function googleSearch(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

const PRACTICE_SITES: Record<string, string> = {
  'data structures': 'https://leetcode.com/problemset/',
  'algorithm': 'https://leetcode.com/problemset/',
  'python': 'https://www.hackerrank.com/domains/python',
  'javascript': 'https://www.hackerrank.com/domains/javascript',
  'js': 'https://www.hackerrank.com/domains/javascript',
  'react': 'https://www.frontendmentor.io/challenges',
  'sql': 'https://www.hackerrank.com/domains/sql',
  'java': 'https://www.hackerrank.com/domains/java',
  'machine learning': 'https://www.kaggle.com/learn',
  'web development': 'https://www.frontendmentor.io/challenges',
  'css': 'https://www.frontendmentor.io/challenges',
  'html': 'https://www.frontendmentor.io/challenges',
};

const DOC_SITES: Record<string, string> = {
  'python': 'https://docs.python.org/3/tutorial/',
  'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
  'js': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
  'react': 'https://react.dev/learn',
  'sql': 'https://www.postgresql.org/docs/current/tutorial.html',
  'java': 'https://docs.oracle.com/javase/tutorial/',
  'machine learning': 'https://scikit-learn.org/stable/tutorial/index.html',
  'data structures': 'https://www.geeksforgeeks.org/data-structures/',
  'algorithm': 'https://www.geeksforgeeks.org/data-structures/',
  'web development': 'https://developer.mozilla.org/en-US/docs/Learn',
  'css': 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  'html': 'https://developer.mozilla.org/en-US/docs/Web/HTML',
  'typescript': 'https://www.typescriptlang.org/docs/',
  'node': 'https://nodejs.org/docs/latest/api/',
  'nodejs': 'https://nodejs.org/docs/latest/api/',
};

const COURSE_SITES: Record<string, string> = {
  'data structures': 'https://www.freecodecamp.org/learn/college-algebra-with-python/',
  'algorithm': 'https://www.freecodecamp.org/learn/',
  'python': 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
  'javascript': 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
  'js': 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
  'react': 'https://www.freecodecamp.org/learn/front-end-development-libraries/',
  'sql': 'https://www.freecodecamp.org/learn/relational-database/',
  'java': 'https://www.freecodecamp.org/learn/',
  'machine learning': 'https://www.freecodecamp.org/learn/data-analysis-with-python/',
  'web development': 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
  'css': 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
  'html': 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
  'typescript': 'https://www.freecodecamp.org/learn/',
};

function topicKey(topic: string): string {
  return topic.toLowerCase().trim();
}

function matchSite(map: Record<string, string>, topic: string): string | null {
  const key = topicKey(topic);
  if (map[key]) return map[key];
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

export function getTaskResourceUrl(
  taskType: TaskType,
  weekTitle: string,
  topic: string
): { url: string; title: string } {
  const searchQuery = `${weekTitle} ${topic}`;
  const topicQuery = `${topic} ${weekTitle}`;

  switch (taskType) {
    case 'watch': {
      return {
        url: youtubeSearch(`${searchQuery} tutorial explained`),
        title: `YouTube: ${weekTitle} tutorial`,
      };
    }
    case 'learn': {
      const docSite = matchSite(DOC_SITES, topic);
      if (docSite) {
        return { url: docSite, title: `Documentation: ${topic}` };
      }
      return {
        url: googleSearch(`${searchQuery} explained beginner guide`),
        title: `Search: ${weekTitle} guide`,
      };
    }
    case 'practice': {
      const practiceSite = matchSite(PRACTICE_SITES, topic);
      if (practiceSite) {
        return { url: practiceSite, title: `Practice: ${topic}` };
      }
      return {
        url: googleSearch(`${searchQuery} practice problems exercises`),
        title: `Search: ${weekTitle} practice`,
      };
    }
    case 'exercise': {
      const practiceSite = matchSite(PRACTICE_SITES, topic);
      if (practiceSite) {
        return { url: practiceSite, title: `Exercises: ${topic}` };
      }
      return {
        url: googleSearch(`${searchQuery} interactive exercises`),
        title: `Search: ${weekTitle} exercises`,
      };
    }
    case 'read': {
      const docSite = matchSite(DOC_SITES, topic);
      if (docSite) {
        return { url: docSite, title: `Docs: ${topic}` };
      }
      return {
        url: googleSearch(`${searchQuery} article in-depth`),
        title: `Search: ${weekTitle} article`,
      };
    }
    case 'project': {
      return {
        url: googleSearch(`${searchQuery} project tutorial build`),
        title: `Search: ${weekTitle} project`,
      };
    }
    default:
      return {
        url: googleSearch(searchQuery),
        title: `Search: ${weekTitle}`,
      };
  }
}

export function getResourceUrl(
  resourceType: ResourceType,
  topic: string,
  weekTopic: string
): { url: string; source: string } {
  switch (resourceType) {
    case 'video': {
      return {
        url: youtubeSearch(`${weekTopic} ${topic} tutorial course`),
        source: 'youtube.com',
      };
    }
    case 'documentation': {
      const docSite = matchSite(DOC_SITES, topic);
      if (docSite) {
        const host = new URL(docSite).hostname.replace('www.', '');
        return { url: docSite, source: host };
      }
      return {
        url: googleSearch(`${weekTopic} ${topic} official documentation`),
        source: 'google.com',
      };
    }
    case 'course': {
      const courseSite = matchSite(COURSE_SITES, topic);
      if (courseSite) {
        const host = new URL(courseSite).hostname.replace('www.', '');
        return { url: courseSite, source: host };
      }
      return {
        url: googleSearch(`${weekTopic} ${topic} free online course`),
        source: 'google.com',
      };
    }
    case 'article': {
      return {
        url: googleSearch(`${weekTopic} ${topic} in-depth article guide`),
        source: 'google.com',
      };
    }
    case 'practice': {
      const practiceSite = matchSite(PRACTICE_SITES, topic);
      if (practiceSite) {
        const host = new URL(practiceSite).hostname.replace('www.', '');
        return { url: practiceSite, source: host };
      }
      return {
        url: googleSearch(`${weekTopic} ${topic} practice problems`),
        source: 'google.com',
      };
    }
    default:
      return {
        url: googleSearch(`${weekTopic} ${topic}`),
        source: 'google.com',
      };
  }
}
