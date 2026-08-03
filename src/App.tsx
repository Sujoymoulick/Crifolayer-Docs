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
  Shield,
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
  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    // Determine initial document ID based on current pathname
    if (typeof window === 'undefined') return 'home';
    const pathname = window.location.pathname;
    const docId = pathname.replace(/^\//, '') || '';
    if (docId === '' || docId === 'home') {
      return 'home';
    }
    return docsContent[docId] ? docId : 'home';
  });
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

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

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
          <a href="#${id}" class="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-[#e05314] dark:text-[#ff7a00] font-normal transition-opacity pr-2" aria-label="Link to section">
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

  // Path Routing
  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      // Extract docId from pathname (e.g., "/getting-started" -> "getting-started")
      const docId = pathname.replace(/^\//, '') || '';
      const anchor = hash.replace('#', '') || '';

      if (docId === '' || docId === 'home') {
        setCurrentDocId('home');
        setIsMobileMenuOpen(false);
        window.scrollTo({ top: 0 });
      } else if (docsContent[docId]) {
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
        // Fallback to home route
        window.history.replaceState(null, '', '/');
        setCurrentDocId('home');
      }
    };

    // Listen for popstate updates (standard for history navigation)
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
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
    const newUrl = `/${item.docId}${item.anchor ? '#' + item.anchor : ''}`;
    navigateTo(newUrl);
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
          
          <a 
            href="/" 
            onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
            className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-white hover:opacity-90"
          >
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
            <a 
              href="/introduction" 
              onClick={(e) => { e.preventDefault(); navigateTo('/introduction'); }}
              className="hover:text-[#e05314] dark:hover:text-[#ff7a00] transition-colors"
            >
              Guides
            </a>
            <a 
              href="/api-reference" 
              onClick={(e) => { e.preventDefault(); navigateTo('/api-reference'); }}
              className="hover:text-[#e05314] dark:hover:text-[#ff7a00] transition-colors"
            >
              API Reference
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e05314] dark:hover:text-[#ff7a00] transition-colors flex items-center gap-1">
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
      {currentDocId === 'home' ? (
        <LandingPage navigateTo={navigateTo} />
      ) : (
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
                              href={`/${item.id}`}
                              onClick={(e) => { e.preventDefault(); navigateTo(`/${item.id}`); }}
                              className={`block py-1.5 text-sm font-normal rounded-md transition-all ${
                                isActive
                                  ? 'text-[#e05314] dark:text-[#ff7a00] font-semibold -ml-3.5 pl-3 border-l-2 border-[#e05314] dark:border-[#ff7a00]'
                                  : 'text-[#484f58] dark:text-[#8b949e] hover:text-[#e05314] dark:hover:text-[#ff7a00]'
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
                  prose-a:text-[#e05314] dark:prose-a:text-[#ff7a00] prose-a:no-underline hover:prose-a:underline
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
                    href={`/${prevDoc.id}`}
                    onClick={(e) => { e.preventDefault(); navigateTo(`/${prevDoc.id}`); }}
                    className="flex flex-col gap-1 items-start max-w-[45%] text-left group p-2 -ml-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors"
                  >
                    <span className="text-xs text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-medium">
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Previous
                    </span>
                    <span className="text-sm font-semibold text-[#e05314] dark:text-[#ff7a00] line-clamp-1">
                      {prevDoc.title}
                    </span>
                  </a>
                ) : (
                  <div />
                )}

                {nextDoc ? (
                  <a
                    href={`/${nextDoc.id}`}
                    onClick={(e) => { e.preventDefault(); navigateTo(`/${nextDoc.id}`); }}
                    className="flex flex-col gap-1 items-end max-w-[45%] text-right group p-2 -mr-2 rounded-lg hover:bg-[#f6f8fa] dark:hover:bg-[#161b22] transition-colors"
                  >
                    <span className="text-xs text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-medium">
                      Next <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-sm font-semibold text-[#e05314] dark:text-[#ff7a00] line-clamp-1">
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
                <a 
                  href="/" 
                  onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
                  className="hover:underline"
                >
                  Home
                </a>
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
                        href={`/${currentDocId}#${header.id}`}
                        onClick={(e) => { e.preventDefault(); navigateTo(`/${currentDocId}#${header.id}`); }}
                        className={`block py-1 -ml-px pl-3 border-l ${
                          isActive
                            ? 'text-[#e05314] dark:text-[#ff7a00] font-semibold border-l border-[#e05314] dark:border-[#ff7a00]'
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
      )}

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
                            href={`/${item.id}`}
                            onClick={(e) => { e.preventDefault(); navigateTo(`/${item.id}`); }}
                            className={`block py-1.5 text-sm rounded-md transition-colors ${
                              isActive
                                ? 'text-[#e05314] dark:text-[#ff7a00] font-semibold -ml-3.5 pl-3 border-l-2 border-[#e05314] dark:border-[#ff7a00]'
                                : 'text-[#484f58] dark:text-[#8b949e] hover:text-[#e05314] dark:hover:text-[#ff7a00]'
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
                        ? 'bg-[#eaeef2] dark:bg-[#21262d] text-[#e05314] dark:text-[#ff7a00]'
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
                        <FileCode className="w-3.5 h-3.5 text-[#e05314] dark:text-[#ff7a00]" /> {item.sectionTitle}
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

function LandingPage({ navigateTo }: { navigateTo: (path: string) => void }) {
  return (
    <div className="flex-1 relative overflow-hidden bg-white text-slate-900 dark:bg-[#0d1117] dark:text-[#c9d1d9] transition-colors duration-200">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-400/10 dark:bg-orange-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-400/10 dark:bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-[1200px] mx-auto px-4 pt-24 pb-20 text-center sm:px-6 lg:px-8 relative z-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
          Secure, Decentralized <br />
          <span className="bg-gradient-to-r from-[#e05314] via-[#ff7a00] to-[#f59e0b] dark:from-[#ff7a00] dark:via-amber-500 dark:to-[#f59e0b] bg-clip-text text-transparent">
            Trust & Reputation Gateway
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg md:text-xl text-[#57606a] dark:text-[#8b949e] font-normal leading-relaxed">
          Automated B2B compliance, sybil fraud auditing, and identity passport sharing. Securely check reputation with zero friction and enterprise-grade privacy protection.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
          <a
            href="/introduction"
            onClick={(e) => { e.preventDefault(); navigateTo('/introduction'); }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#e05314] hover:bg-[#c5420b] dark:bg-[#ff7a00] dark:hover:bg-[#e06c00] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group cursor-pointer"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="https://github.com/Sujoymoulick/Crifolayer-Docs"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#21262d] dark:hover:bg-[#30363d] border border-[#d0d7de] dark:border-[#30363d] font-semibold transition-all hover:-translate-y-0.5 cursor-pointer text-slate-700 dark:text-[#c9d1d9]"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 relative z-10">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-16">
          Core Engine Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: Trust Score */}
          <div className="backdrop-blur-md bg-white/40 dark:bg-[#161b22]/40 border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40 text-[#e05314] dark:text-[#ff7a00] mb-5 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Dynamic Trust Scoring</h3>
            <p className="text-[#57606a] dark:text-[#8b949e] text-sm leading-relaxed">
              Calculate user reputation scores (300-1000) inside our verification pipeline, analyzing KYC, social integrations, and collusion risks.
            </p>
          </div>

          {/* Card 2: B2B OAuth PKCE */}
          <div className="backdrop-blur-md bg-white/40 dark:bg-[#161b22]/40 border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-[#8250df] dark:text-[#d2a8ff] mb-5 shadow-inner">
              <FileCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Secure OAuth PKCE</h3>
            <p className="text-[#57606a] dark:text-[#8b949e] text-sm leading-relaxed">
              Enable partner B2B integrations to request data sharing consent loops securely without handling raw user access credentials.
            </p>
          </div>

          {/* Card 3: GDPR Compliance */}
          <div className="backdrop-blur-md bg-white/40 dark:bg-[#161b22]/40 border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-5 shadow-inner">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">GDPR Purge & Compliance</h3>
            <p className="text-[#57606a] dark:text-[#8b949e] text-sm leading-relaxed">
              Perform GDPR compliant Right to Erasure account wipes. Encrypt data and prevent sybil score resets using ledger salting.
            </p>
          </div>

        </div>
      </div>

      {/* Code Showcase Section */}
      <div className="max-w-[1200px] mx-auto px-4 py-20 sm:px-6 lg:px-8 border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        <div className="lg:col-span-5">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            Simple Developer Integration
          </h2>
          <p className="text-[#57606a] dark:text-[#8b949e] mb-8 leading-relaxed">
            Integrate Crifolayer in minutes. Our type-safe Node.js SDK covers query fetching, passport decryption, webhooks verification, and background updates.
          </p>
          <ul className="space-y-3.5">
            {['Official B2B Node.js SDK', 'Automatic rate limit retry handling', 'HMAC webhook signature validation'].map((feat, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm font-semibold">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-7">
          {/* Mock Terminal Window */}
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden font-mono text-xs text-left">
            <div className="bg-[#0d1117] px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-[#8b949e] font-sans text-xs">integration-example.js</span>
              <div className="w-4" />
            </div>
            <div className="p-5 overflow-x-auto text-[#c9d1d9] leading-relaxed select-all">
              <span className="text-[#ff7b72]">const</span> CrifolayerSDK = <span className="text-[#d2a8ff]">require</span>(<span className="text-[#a5d6ff]">'@crifolayer/sdk'</span>);<br />
              <br />
              <span className="text-[#ff7b72]">const</span> client = <span className="text-[#ff7b72]">new</span> <span className="text-[#79c0ff]">CrifolayerSDK</span>({`{`} <br />
              &nbsp;&nbsp;apiKey: <span className="text-[#a5d6ff]">'tl_sb_acmeapp_8d7f6e52c803ab971e44f32e987c...'</span>,<br />
              &nbsp;&nbsp;baseUrl: <span className="text-[#a5d6ff]">'https://api.crifolayer.com/api/v1'</span><br />
              {`}`});<br />
              <br />
              <span className="text-[#ff7b72]">async</span> <span className="text-[#ff7b72]">function</span> <span className="text-[#d2a8ff]">getUserReputation</span>(userId) {`{`}<br />
              &nbsp;&nbsp;<span className="text-[#ff7b72]">try</span> {`{`}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ff7b72]">const</span> response = <span className="text-[#ff7b72]">await</span> client.<span className="text-[#d2a8ff]">getTrustScore</span>(userId);<br />
              &nbsp;&nbsp;&nbsp;&nbsp;console.<span className="text-[#d2a8ff]">log</span>({"`Score: ${response.data.score}`"}); <span className="text-[#8b949e]">// 720 (HIGH_TRUST)</span><br />
              &nbsp;&nbsp;{`}`} <span className="text-[#ff7b72]">catch</span> (err) {`{`}<br />
              &nbsp;&nbsp;&nbsp;&nbsp;console.<span className="text-[#d2a8ff]">error</span>(err);<br />
              &nbsp;&nbsp;{`}`}<br />
              {`}`}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-[#f6f8fa]/50 dark:bg-[#161b22]/30 border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 py-16 text-center relative z-10">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to secure your application?</h3>
        <p className="text-[#57606a] dark:text-[#8b949e] mt-2 mb-8 text-sm">Explore our integration blueprints, SDK methods, and API schemas.</p>
        <a
          href="/introduction"
          onClick={(e) => { e.preventDefault(); navigateTo('/introduction'); }}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#e05314] hover:bg-[#c5420b] dark:bg-[#ff7a00] dark:hover:bg-[#e06c00] text-white font-semibold transition-all hover:-translate-y-0.5 cursor-pointer shadow-md hover:shadow-lg"
        >
          Explore Documentation
        </a>
      </div>

    </div>
  );
}
