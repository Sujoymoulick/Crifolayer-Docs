import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import Prism from 'prismjs';

// Import Prism language components for syntax highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';

import logo from './assets/mainlogofinal.png';

import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  AlertTriangle,
  Lightbulb,
  Info
} from 'lucide-react';

import {
  docsStructure,
  docsContent,
  getDocItemById,
  getNextPrevDoc,
  allDocItems
} from './docsConfig';

interface SearchIndexItem {
  docId: string;
  docTitle: string;
  sectionTitle?: string;
  anchor?: string;
  snippet: string;
}

export default function App() {
  const [currentDocId, setCurrentDocId] = useState<string>('introduction');
  const [activeHeaderId, setActiveHeaderId] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchIndexItem[]>([]);
  const [selectedSearchResultIndex, setSelectedSearchResultIndex] = useState<number>(0);
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Collapsible sidebar sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Getting Started': true,
    'Core Architecture': true,
    'Developer Integration': true
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Custom marked renderer to output GitHub Docs style classes and anchors
  useEffect(() => {
    const customRenderer = {
      heading({ text, depth }: { text: string; depth: number }) {
        const cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const id = cleanText
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
          
        let classes = '';
        if (depth === 1) classes = 'text-3xl font-extrabold tracking-tight mt-0 mb-6 text-[#24292f] dark:text-[#f0f6fc] border-b border-[#d0d7de] dark:border-[#30363d] pb-2';
        else if (depth === 2) classes = 'text-2xl font-semibold tracking-tight mt-8 mb-4 text-[#24292f] dark:text-[#f0f6fc] border-b border-[#e1e4e8]/60 dark:border-[#30363d]/60 pb-1.5 scroll-mt-20';
        else if (depth === 3) classes = 'text-xl font-semibold tracking-tight mt-6 mb-3 text-[#24292f] dark:text-[#f0f6fc] scroll-mt-20';
        else classes = 'text-lg font-semibold tracking-tight mt-4 mb-2 text-[#24292f] dark:text-[#f0f6fc] scroll-mt-20';

        return `<h${depth} id="${id}" class="anchor-header group relative ${classes}">
          ${text}
          <a href="#${id}" class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#0969da] dark:text-[#2f81f7] font-normal transition-opacity pr-2" aria-label="Link to section">
            #
          </a>
        </h${depth}>`;
      },
      table({ header, body }: { header: string; body: string }) {
        return `<div class="overflow-x-auto my-6 border border-[#d0d7de] dark:border-[#30363d] rounded-lg">
          <table class="w-full text-left border-collapse text-sm">
            <thead class="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] text-[#24292f] dark:text-[#f0f6fc] font-semibold">
              ${header}
            </thead>
            <tbody class="divide-y divide-[#d0d7de]/50 dark:divide-[#30363d]/50 text-[#24292f] dark:text-[#c9d1d9]">
              ${body}
            </tbody>
          </table>
        </div>`;
      },
      tablerow({ content }: { content: string }) {
        return `<tr class="hover:bg-[#f6f8fa]/50 dark:hover:bg-[#161b22]/50 transition-colors">${content}</tr>`;
      },
      tablecell({ content, flags }: { content: string; flags: { header: boolean; align: string | null } }) {
        const alignClass = flags.align ? `text-${flags.align}` : '';
        const padding = 'px-4 py-3';
        if (flags.header) {
          return `<th class="${padding} ${alignClass} font-semibold">${content}</th>`;
        }
        return `<td class="${padding} ${alignClass}">${content}</td>`;
      }
    };

    marked.use({
      renderer: customRenderer,
      gfm: true,
      breaks: true
    });
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('color-scheme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('color-scheme', 'light');
    }
    localStorage.setItem('theme', theme);
    localStorage.setItem('color-scheme', theme);
  }, [theme]);

  // Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#/', '').replace('#', '');
      const parts = fullHash.split('#');
      const docId = parts[0] || 'introduction';
      const anchor = parts[1] || '';

      if (docsContent[docId]) {
        setCurrentDocId(docId);
        setIsMobileMenuOpen(false);
        
        if (anchor) {
          setTimeout(() => {
            const element = document.getElementById(anchor);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }, 150);
        } else {
          window.scrollTo({ top: 0 });
        }
      } else {
        window.location.hash = '#/introduction';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Build local search index
  useEffect(() => {
    const index: SearchIndexItem[] = [];
    for (const docId of Object.keys(docsContent)) {
      const docItem = getDocItemById(docId);
      if (!docItem) continue;
      const content = docsContent[docId];
      
      // Page Level index
      index.push({
        docId,
        docTitle: docItem.title,
        snippet: content.substring(0, 120).replace(/[#*`_-]/g, ' ')
      });

      // Section Level index
      const lines = content.split('\n');
      let currentHeader = '';
      let currentAnchor = '';
      let currentText = '';

      for (const line of lines) {
        const headerMatch = line.match(/^(##|###)\s+(.*)$/);
        if (headerMatch) {
          if (currentHeader && currentText.trim()) {
            index.push({
              docId,
              docTitle: docItem.title,
              sectionTitle: currentHeader,
              anchor: currentAnchor,
              snippet: currentText.trim().substring(0, 160).replace(/[#*`_-]/g, ' ')
            });
          }
          currentHeader = headerMatch[2].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          currentAnchor = currentHeader
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
          currentText = '';
        } else if (line.trim() && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('```')) {
          currentText += ' ' + line;
        }
      }

      if (currentHeader && currentText.trim()) {
        index.push({
          docId,
          docTitle: docItem.title,
          sectionTitle: currentHeader,
          anchor: currentAnchor,
          snippet: currentText.trim().substring(0, 160).replace(/[#*`_-]/g, ' ')
        });
      }
    }
    setSearchIndex(index);
  }, []);

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle search query filtering
  useEffect(() => {
    if (!queryHasValue(searchQuery)) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = searchIndex.filter(item => {
      const inTitle = item.docTitle.toLowerCase().includes(query);
      const inSection = item.sectionTitle?.toLowerCase().includes(query) || false;
      const inSnippet = item.snippet.toLowerCase().includes(query);
      return inTitle || inSection || inSnippet;
    }).slice(0, 8); // Cap at 8 results
    
    setSearchResults(filtered);
    setSelectedSearchResultIndex(0);
  }, [searchQuery, searchIndex]);

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setSearchQuery('');
    }
  }, [isSearchOpen]);

  // Scroll active section TOC
  useEffect(() => {
    const handleScroll = () => {
      const headers = Array.from(document.querySelectorAll('.anchor-header'));
      let currentActive = '';
      const scrollPosition = window.scrollY + 120; // offset buffer
      
      for (const header of headers) {
        if (header instanceof HTMLElement) {
          if (header.offsetTop <= scrollPosition) {
            currentActive = header.id;
          } else {
            break;
          }
        }
      }

      if (currentActive) {
        setActiveHeaderId(currentActive);
      } else if (headers.length > 0) {
        setActiveHeaderId(headers[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Execute once initially
    setTimeout(handleScroll, 100);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentDocId]);

  // Prism highlighting and Copy Button Injection
  useEffect(() => {
    Prism.highlightAll();

    const container = document.getElementById('docs-content-area');
    if (!container) return;

    const preTags = container.getElementsByTagName('pre');
    for (const pre of Array.from(preTags)) {
      if (pre.parentElement?.classList.contains('code-block-wrapper')) continue;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper relative group my-4';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'absolute top-3 right-3 p-1.5 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shadow-sm hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] cursor-pointer z-10';
      copyBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path>
          <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path>
        </svg>
      `;

      copyBtn.addEventListener('click', () => {
        const codeText = pre.innerText || '';
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = `
            <svg class="w-4 h-4 text-green-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
            </svg>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path>
              </svg>
            `;
          }, 2000);
        });
      });

      wrapper.appendChild(copyBtn);
    }
  }, [currentDocId]);

  function queryHasValue(q: string): boolean {
    return q.trim().length > 0;
  }

  // Pre-process markdown to convert blockquotes containing [!NOTE], [!TIP], etc. into styled divs
  const formatCallouts = (markdown: string): string => {
    const lines = markdown.split('\n');
    const result: string[] = [];
    let inCallout = false;
    let calloutType = '';
    let calloutLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const calloutHeaderMatch = line.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/i);
      
      if (calloutHeaderMatch) {
        inCallout = true;
        calloutType = calloutHeaderMatch[1].toLowerCase();
        calloutLines = [];
      } else if (inCallout && line.startsWith('>')) {
        const content = line.substring(1).trim();
        calloutLines.push(content);
      } else {
        if (inCallout) {
          const typeLabel = calloutType.toUpperCase();
          let iconSvg = '';
          if (calloutType === 'note') {
            iconSvg = `<svg class="w-5 h-5 mt-0.5" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1116 0A8 8 0 010 8zm8-6.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM6.5 7.75A.75.75 0 017.25 7h1.5a.75.75 0 010 1.5h-.75v2.25h.75a.75.75 0 010 1.5h-2.5a.75.75 0 010-1.5h.75V8.5h-.75a.75.75 0 01-.75-.75zM8 4a.999.999 0 110 2 .999.999 0 010-2z"/></svg>`;
          } else if (calloutType === 'tip') {
            iconSvg = `<svg class="w-5 h-5 mt-0.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.836-4 4 0 .907.25 1.746.74 2.436a.25.25 0 01.01.272l-.587 1.173A1.75 1.75 0 005.73 12.2H6.5v.55a1.75 1.75 0 001.75 1.75h3.5a1.75 1.75 0 001.75-1.75v-.55h.77a1.75 1.75 0 001.567-2.819l-.587-1.173a.25.25 0 01.01-.272C13.75 7.246 14 6.407 14 5.5c0-2.164-1.637-4-4-4zm1.5 6.25v2.5a.75.75 0 01-1.5 0v-2.5a.75.75 0 011.5 0z"/></svg>`;
          } else {
            iconSvg = `<svg class="w-5 h-5 mt-0.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8.22 1.754a.25.25 0 00-.44 0L1.698 11.75a.25.25 0 00.22.375h12.164a.25.25 0 00.22-.375L8.22 1.754zM6.28 9.03a.75.75 0 011.06 0l.66.66.66-.66a.75.75 0 111.06 1.06l-1.19 1.19a.75.75 0 01-1.06 0l-1.19-1.19a.75.75 0 010-1.06zM8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4z"/></svg>`;
          }
          
          const typeClass = calloutType === 'caution' || calloutType === 'important' ? 'warning' : calloutType;
          result.push(`\n<div class="callout ${typeClass}">`);
          result.push(`  <div class="callout-icon text-current">${iconSvg}</div>`);
          result.push(`  <div class="callout-content">`);
          result.push(`    <div class="font-semibold flex items-center gap-1.5 mb-1">${typeLabel}</div>`);
          result.push(`    <div>${calloutLines.join(' ')}</div>`);
          result.push(`  </div>`);
          result.push(`</div>\n`);
          inCallout = false;
        }
        result.push(line);
      }
    }
    return result.join('\n');
  };

  // Extract page level headers to populate the TOC outline
  const extractHeaders = (markdown: string) => {
    const lines = markdown.split('\n');
    const headers: { text: string; id: string; level: number }[] = [];
    
    for (const line of lines) {
      const match = line.match(/^(##|###)\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].trim();
        const cleanText = rawText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        const id = cleanText
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        headers.push({ text: cleanText, id, level });
      }
    }
    return headers;
  };

  const activeDocContent = docsContent[currentDocId] || '';
  const renderedHtml = marked.parse(formatCallouts(activeDocContent)) as string;
  const currentHeaders = extractHeaders(activeDocContent);
  const currentDocItem = getDocItemById(currentDocId);
  const { next: nextDoc, prev: prevDoc } = getNextPrevDoc(currentDocId);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const selectSearchResult = (item: SearchIndexItem) => {
    setIsSearchOpen(false);
    window.location.hash = `#/${item.docId}${item.anchor ? '#' + item.anchor : ''}`;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchResultIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectSearchResult(searchResults[selectedSearchResultIndex]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#24292f] dark:bg-[#0d1117] dark:text-[#c9d1d9] transition-colors duration-200">
      
      {/* 1. Global Navigation Top Header */}
      <header className="sticky top-0 z-40 w-full h-[60px] flex items-center justify-between px-4 lg:px-6 bg-white/95 dark:bg-[#0d1117]/95 border-b border-[#d0d7de] dark:border-[#30363d] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1 rounded-md lg:hidden hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] cursor-pointer"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <a href="#/introduction" className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-white hover:opacity-90">
            <img src={logo} alt="Crifolayer Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold tracking-tight">Crifolayer</span>
            <span className="hidden sm:inline text-xs bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] px-2 py-0.5 rounded-full font-normal font-mono">Docs</span>
          </a>
        </div>

        {/* Search Input Bar (Cmd+K) */}
        <div className="flex-1 max-w-lg mx-6 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-sm text-[#57606a] dark:text-[#8b949e] hover:border-[#8c959f] dark:hover:border-[#8b949e] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#57606a] dark:text-[#8b949e]" />
              <span>Search documentation...</span>
            </div>
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[10px] font-mono font-medium shadow-sm">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>
        </div>

        {/* Right Menu Links & Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-md md:hidden hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-[#57606a] dark:text-[#8b949e]">
            <a href="#/getting-started" className="hover:text-[#0969da] dark:hover:text-[#2f81f7] transition-colors">Guides</a>
            <a href="#/api-reference" className="hover:text-[#0969da] dark:hover:text-[#2f81f7] transition-colors">API Reference</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#0969da] dark:hover:text-[#2f81f7] transition-colors flex items-center gap-1">
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          <div className="w-px h-5 bg-[#d0d7de] dark:bg-[#30363d] hidden lg:block" />

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] cursor-pointer transition-colors"
            aria-label="Toggle theme color"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. Main Content Layout Container */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex">
        
        {/* Left Sidebar Navigation - Desktop */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-[60px] h-[calc(100vh-60px)] border-r border-[#d0d7de] dark:border-[#30363d] overflow-y-auto px-6 py-8 custom-scrollbar">
          <nav className="space-y-6">
            {docsStructure.map(section => (
              <div key={section.title} className="space-y-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between font-semibold text-xs tracking-wider text-[#57606a] dark:text-[#8b949e] uppercase hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span>{section.title}</span>
                  {expandedSections[section.title] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {expandedSections[section.title] && (
                  <ul className="space-y-1.5 border-l border-[#d0d7de] dark:border-[#30363d] ml-1 pl-3">
                    {section.items.map(item => {
                      const isActive = currentDocId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#/${item.id}`}
                            className={`block py-1.5 text-sm font-normal rounded-md transition-all ${
                              isActive
                                ? 'text-[#0969da] dark:text-[#2f81f7] font-semibold -ml-3.5 pl-3 border-l-2 border-[#0969da] dark:border-[#2f81f7]'
                                : 'text-[#484f58] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#2f81f7]'
                            }`}
                          >
                            {item.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 py-8 lg:px-10 lg:py-12 flex flex-col justify-between">
          <div className="max-w-[760px] w-full mx-auto">
            
            {/* Breadcrumbs */}
            {currentDocItem && (
              <nav className="flex items-center gap-1.5 text-xs text-[#57606a] dark:text-[#8b949e] mb-6">
                <span>Docs</span>
                <ChevronRight className="w-3 h-3" />
                <span>{currentDocItem.category}</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#24292f] dark:text-[#f0f6fc] font-medium">{currentDocItem.title}</span>
              </nav>
            )}

            {/* Markdown Output Area */}
            <article
              id="docs-content-area"
              className="prose prose-slate dark:prose-invert max-w-none 
                prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white
                prose-a:text-[#0969da] dark:prose-a:text-[#2f81f7] prose-a:no-underline hover:prose-a:underline
                prose-pre:bg-[#f6f8fa] dark:prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[#d0d7de] dark:prose-pre:border-[#30363d]
                prose-code:text-[#24292f] dark:prose-code:text-[#c9d1d9] prose-code:bg-[#f6f8fa] dark:prose-code:bg-[#161b22] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-strong:font-bold prose-strong:text-slate-950 dark:prose-strong:text-white
                prose-img:rounded-lg prose-img:border prose-img:border-[#d0d7de] dark:prose-img:border-[#30363d]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />

            {/* Pagination: Previous & Next */}
            <div className="flex items-center justify-between border-t border-[#d0d7de] dark:border-[#30363d] mt-12 pt-6">
              {prevDoc ? (
                <a
                  href={`#/${prevDoc.id}`}
                  className="flex flex-col gap-1 items-start max-w-[45%] text-left group p-2 -ml-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors"
                >
                  <span className="text-xs text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-medium">
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Previous
                  </span>
                  <span className="text-sm font-semibold text-[#0969da] dark:text-[#2f81f7] line-clamp-1">
                    {prevDoc.title}
                  </span>
                </a>
              ) : (
                <div />
              )}

              {nextDoc ? (
                <a
                  href={`#/${nextDoc.id}`}
                  className="flex flex-col gap-1 items-end max-w-[45%] text-right group p-2 -mr-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors"
                >
                  <span className="text-xs text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-medium">
                    Next <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <span className="text-sm font-semibold text-[#0969da] dark:text-[#2f81f7] line-clamp-1">
                    {nextDoc.title}
                  </span>
                </a>
              ) : (
                <div />
              )}
            </div>

          </div>

          {/* Docs Footer */}
          <footer className="max-w-[760px] w-full mx-auto border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 mt-16 pt-6 text-xs text-[#57606a] dark:text-[#8b949e] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              Crifolayer TrustLayer Platform Documentation · © 2026.
            </div>
            <div className="flex gap-4">
              <a href="#/introduction" className="hover:underline">Home</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">GitHub <ExternalLink className="w-3 h-3" /></a>
            </div>
          </footer>
        </main>

        {/* Right Sidebar - Sticky Table of Contents */}
        {currentHeaders.length > 0 && (
          <aside className="hidden xl:block w-[240px] shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto px-4 py-8 custom-scrollbar">
            <h4 className="font-semibold text-xs text-[#24292f] dark:text-[#f0f6fc] uppercase tracking-wider mb-3">
              On this page
            </h4>
            <ul className="space-y-2 text-xs border-l border-[#d0d7de]/50 dark:border-[#30363d]/50 pl-0">
              {currentHeaders.map(header => {
                const isActive = activeHeaderId === header.id;
                const isH3 = header.level === 3;
                return (
                  <li key={header.id} style={{ paddingLeft: isH3 ? '12px' : '0px' }}>
                    <a
                      href={`#/${currentDocId}#${header.id}`}
                      className={`block py-1 -ml-px pl-3 border-l ${
                        isActive
                          ? 'text-[#0969da] dark:text-[#2f81f7] font-semibold border-l border-[#0969da] dark:border-[#2f81f7]'
                          : 'text-[#57606a] dark:text-[#8b949e] hover:text-slate-900 dark:hover:text-[#f0f6fc] border-l border-transparent'
                      }`}
                    >
                      {header.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}

      </div>

      {/* 3. Mobile Navigation Sidebar Menu Modal */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-[300px] bg-white dark:bg-[#0d1117] h-full flex flex-col p-6 shadow-xl border-r border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <img src={logo} alt="Crifolayer Logo" className="w-5 h-5 object-contain" /> Crifolayer
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
              {docsStructure.map(section => (
                <div key={section.title} className="space-y-2">
                  <div className="font-bold text-xs tracking-wider text-[#57606a] dark:text-[#8b949e] uppercase">
                    {section.title}
                  </div>
                  <ul className="space-y-2 border-l border-[#d0d7de] dark:border-[#30363d] ml-1 pl-3">
                    {section.items.map(item => {
                      const isActive = currentDocId === item.id;
                      return (
                        <li key={item.id}>
                          <a
                            href={`#/${item.id}`}
                            className={`block py-1.5 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'text-[#0969da] dark:text-[#2f81f7] font-semibold -ml-3.5 pl-3 border-l-2 border-[#0969da] dark:border-[#2f81f7]'
                                : 'text-[#484f58] dark:text-[#8b949e] hover:text-[#0969da] dark:hover:text-[#2f81f7]'
                            }`}
                          >
                            {item.title}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          {/* Overlay dismissal */}
          <div className="flex-1 h-full cursor-pointer" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* 4. Global Search Dialog Overlay Modal (Cmd+K) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-slate-900/40 dark:bg-black/50 backdrop-blur-sm">
          {/* Backdrop Dismiss */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsSearchOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex items-center gap-2 px-3 py-3 border-b border-[#d0d7de] dark:border-[#30363d]">
              <Search className="w-5 h-5 text-[#57606a] dark:text-[#8b949e] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search titles, descriptions, and code parameters..."
                className="w-full bg-transparent border-0 outline-none text-slate-900 dark:text-white text-sm placeholder-[#8c959f] dark:placeholder-[#8b949e]"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div
              ref={searchResultsRef}
              className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar bg-[#f6f8fa] dark:bg-[#0d1117]/80 divide-y divide-[#d0d7de]/50 dark:divide-[#30363d]/50"
            >
              {!queryHasValue(searchQuery) && (
                <div className="py-8 text-center text-sm text-[#57606a] dark:text-[#8b949e]">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-[#8c959f] dark:text-[#8b949e]" />
                  Search for topics, guides, or API endpoints.
                </div>
              )}

              {queryHasValue(searchQuery) && searchResults.length === 0 && (
                <div className="py-8 text-center text-sm text-[#57606a] dark:text-[#8b949e]">
                  No results found for "<span className="font-semibold text-slate-800 dark:text-white">{searchQuery}</span>"
                </div>
              )}

              {searchResults.map((item, index) => {
                const isSelected = index === selectedSearchResultIndex;
                return (
                  <div
                    key={`${item.docId}-${item.anchor || 'page'}`}
                    onClick={() => selectSearchResult(item)}
                    onMouseEnter={() => setSelectedSearchResultIndex(index)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#eaeef2] dark:bg-[#21262d] text-[#0969da] dark:text-[#2f81f7]'
                        : 'text-slate-700 dark:text-[#c9d1d9]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">
                        {item.docTitle}
                      </div>
                      {item.sectionTitle && (
                        <div className="text-[10px] bg-[#f6f8fa] dark:bg-[#161b22] px-1.5 py-0.5 rounded border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e]">
                          Section
                        </div>
                      )}
                    </div>
                    {item.sectionTitle && (
                      <h5 className="font-semibold text-sm mt-1 flex items-center gap-1 text-slate-900 dark:text-white">
                        <FileCode className="w-3.5 h-3.5 text-[#0969da] dark:text-[#2f81f7]" /> {item.sectionTitle}
                      </h5>
                    )}
                    <p className="text-xs mt-1.5 opacity-80 line-clamp-2">
                      {item.snippet}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="px-3 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border-t border-[#d0d7de] dark:border-[#30363d] text-[10px] text-[#57606a] dark:text-[#8b949e] flex justify-between">
              <span>Use ↑↓ keys to navigate, [Enter] to select</span>
              <span>Search results: {searchResults.length}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
