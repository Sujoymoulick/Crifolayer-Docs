import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from '../src/App.tsx';
import fs from 'fs';
import path from 'path';

try {
  console.log("Test render starting...");
  // Mock window and document properties
  globalThis.window = {
    location: {
      pathname: '/',
      hash: ''
    },
    history: {
      pushState: () => {},
      replaceState: () => {}
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false }),
    scrollTo: () => {}
  };
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  globalThis.document = {
    documentElement: {
      classList: {
        add: () => {},
        remove: () => {}
      }
    }
  };

  const html = ReactDOMServer.renderToString(React.createElement(App));
  console.log("Rendered successfully! Length:", html.length);
  
  const destPath = path.join(process.cwd(), 'scratch', 'rendered.html');
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, html, 'utf8');
  console.log("Saved rendered HTML to:", destPath);
} catch (err) {
  console.error("Render crashed with error:", err);
}
