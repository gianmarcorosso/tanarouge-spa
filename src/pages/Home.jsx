// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from 'react';

const CHAPTERS = 81;
const RENDER_TIMEOUT = 3500; // ms to wait before assuming the chapter didn't draw

function randomChapter() {
  return Math.floor(Math.random() * CHAPTERS) + 1;
}

function buildSrc(chapter) {
  return `${process.env.PUBLIC_URL}/way-of-code/demo.html?n=${chapter}&t=${Date.now()}`;
}

function Home() {
  const [src, setSrc] = useState('');
  const iframeRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    document.title = 'Tanarouge';
    // Skip the visualizer during react-snap prerender: its script uses modern
    // syntax that react-snap's headless Chromium can't parse (breaks the build).
    if (navigator.userAgent === 'ReactSnap') return;
    setSrc(buildSrc(randomChapter()));
    return () => clearTimeout(timerRef.current);
  }, []);

  // Reload with a different chapter (used on both load-failure and blank render).
  const reroll = () => setSrc(buildSrc(randomChapter()));

  // Once the iframe loads, verify the visualizer actually drew something.
  // Some chapters occasionally mount with a zero-size / empty stage and show
  // nothing; if so, pick another chapter.
  const handleLoad = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const frame = iframeRef.current;
      if (!frame) return;
      let ok = false;
      try {
        const doc = frame.contentDocument;
        const stage = doc && doc.getElementById('stage');
        const el = stage && stage.firstElementChild;
        if (el) {
          const rect = el.getBoundingClientRect();
          // The visualizer renders inside the element's shadow root (canvas or
          // ASCII text). Look there, not the light DOM.
          const root = el.shadowRoot;
          const canvas = root && root.querySelector('canvas');
          const drew =
            (canvas && canvas.width > 0 && canvas.height > 0) ||
            (root && (root.querySelector('svg') || (root.textContent || '').trim().length > 0));
          ok = rect.width > 0 && rect.height > 0 && !!drew;
        }
      } catch (e) {
        // Same-origin, so this shouldn't throw; if it does, assume it's fine.
        ok = true;
      }
      if (!ok) reroll();
    }, RENDER_TIMEOUT);
  };

  return (
    <main>
      <section id="home-visualizer">
        {src && (
          <iframe
            ref={iframeRef}
            key={src}
            className="visualizer-frame"
            src={src}
            title="Visualizer"
            onLoad={handleLoad}
            onError={reroll}
            allowFullScreen
          />
        )}
      </section>
    </main>
  );
}

export default Home;
