// Auto-load all markdown files in content/docs using Vite glob imports
const rawDocs = import.meta.glob('../content/docs/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Clean up keys to match page IDs (e.g. '../content/docs/introduction.md' -> 'introduction')
export const docsContent: Record<string, string> = {};
for (const path in rawDocs) {
  const pageId = path.split('/').pop()?.replace('.md', '') || '';
  docsContent[pageId] = rawDocs[path];
}

export interface DocItem {
  id: string;
  title: string;
  category: string;
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export const docsStructure: DocSection[] = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction to Crifolayer', category: 'Getting Started' },
      { id: 'getting-started', title: 'Getting Started & Setup', category: 'Getting Started' },
    ],
  },
  {
    title: 'Core Architecture',
    items: [
      { id: 'architecture', title: 'Architecture & System Blueprint', category: 'Core Architecture' },
      { id: 'trust-score', title: 'Trust Score Calculation Logic', category: 'Core Architecture' },
      { id: 'compliance', title: 'GDPR & Compliance Engineering', category: 'Core Architecture' },
    ],
  },
  {
    title: 'Developer Integration',
    items: [
      { id: 'database', title: 'Database Models & Graph Engines', category: 'Developer Integration' },
      { id: 'oauth', title: 'B2B OAuth 2.0 PKCE Flow', category: 'Developer Integration' },
      { id: 'sdk', title: 'B2B Node.js SDK Reference', category: 'Developer Integration' },
      { id: 'api-reference', title: 'Global REST API Reference', category: 'Developer Integration' },
      { id: 'webhooks', title: 'Webhooks Integration Guide', category: 'Developer Integration' },
      { id: 'errors', title: 'Error Handling & Responses', category: 'Developer Integration' },
    ],
  },
];

// Flat list for easy search and next/prev navigation lookup
export const allDocItems = docsStructure.flatMap(section => section.items);

export const getDocItemById = (id: string) => {
  return allDocItems.find(item => item.id === id);
};

export const getNextPrevDoc = (id: string) => {
  const index = allDocItems.findIndex(item => item.id === id);
  if (index === -1) return { next: null, prev: null };
  return {
    prev: index > 0 ? allDocItems[index - 1] : null,
    next: index < allDocItems.length - 1 ? allDocItems[index + 1] : null,
  };
};
