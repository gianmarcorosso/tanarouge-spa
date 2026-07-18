// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';

function Home() {
  const [src, setSrc] = useState('');

  useEffect(() => {
    document.title = "Tanarouge";
    // random chapter (1-81); cache-bust forces a fresh load each visit
    const chapter = Math.floor(Math.random() * 81) + 1;
    setSrc(`${process.env.PUBLIC_URL}/way-of-code/demo.html?n=${chapter}&t=${Date.now()}`);
  }, []);

  return (
    <main>
      <section id="home-visualizer">
        {src && (
          <iframe
            className="visualizer-frame"
            src={src}
            title="Visualizer"
            allowFullScreen
          />
        )}
      </section>
    </main>
  );
}

export default Home;
