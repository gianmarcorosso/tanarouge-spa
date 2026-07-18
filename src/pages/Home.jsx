// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from 'react';

const CHAPTERS = 81;
const RENDER_TIMEOUT = 1800; // ms to wait before checking whether it drew
const MAX_TRIES = 6;         // stop rerolling after this many attempts

function randomChapter(exclude) {
  let c;
  do {
    c = Math.floor(Math.random() * CHAPTERS) + 1;
  } while (c === exclude);
  return c;
}

function buildSrc(chapter) {
  return `${process.env.PUBLIC_URL}/way-of-code/demo.html?n=${chapter}&t=${Date.now()}`;
}

function Home() {
  const [src, setSrc] = useState('');
  const iframeRef = useRef(null);
  const timerRef = useRef(null);
  const chapterRef = useRef(0);
  const triesRef = useRef(0);

  const load = () => {
    const next = randomChapter(chapterRef.current);
    chapterRef.current = next;
    setSrc(buildSrc(next));
  };

  useEffect(() => {
    document.title = 'Tanarouge';
    // Skip the visualizer during react-snap prerender: its script uses modern
    // syntax that react-snap's headless Chromium can't parse (breaks the build).
    if (navigator.userAgent === 'ReactSnap') return;
    load();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reroll = () => {
    if (triesRef.current >= MAX_TRIES) return; // give up, avoid infinite loop
    triesRef.current += 1;
    clearTimeout(timerRef.current);
    load();
  };

  // Once the iframe loads, verify the visualizer actually drew something.
  // Some chapters render nothing (blank canvas) or fail to create a WebGL
  // context; in those cases pick another chapter.
  const handleLoad = () => {
    clearTimeout(timerRef.current);

    // Catch runtime failures inside the iframe (e.g. WebGL context errors).
    try {
      const win = iframeRef.current && iframeRef.current.contentWindow;
      if (win) {
        win.addEventListener('error', reroll, { once: true });
      }
    } catch (e) {
      /* cross-origin shouldn't happen (same-origin) */
    }

    timerRef.current = setTimeout(() => {
      const frame = iframeRef.current;
      if (!frame) return;
      let ok = true; // default to keeping it if we can't tell
      try {
        const doc = frame.contentDocument;
        const el = doc && doc.getElementById('stage') && doc.getElementById('stage').firstElementChild;
        const root = el && el.shadowRoot;
        if (root) {
          const canvas = root.querySelector('canvas');
          const textLen = (root.textContent || '').trim().length;
          if (canvas) {
            // For a readable 2D canvas, sample pixels: if everything matches the
            // background, nothing was drawn.
            try {
              const ctx = canvas.getContext('2d');
              const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
              let painted = 0;
              for (let i = 0; i < data.length; i += 400) {
                if (Math.abs(data[i] - 240) > 12 || Math.abs(data[i + 1] - 238) > 12) {
                  painted += 1;
                  if (painted > 3) break;
                }
              }
              ok = painted > 3;
            } catch (e) {
              ok = canvas.width > 0 && canvas.height > 0; // WebGL/tainted: trust size
            }
          } else {
            ok = textLen > 0; // ASCII chapters
          }
        } else {
          ok = false; // element never mounted its shadow render
        }
      } catch (e) {
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
