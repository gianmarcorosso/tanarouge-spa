// src/pages/Home.jsx
import React, { useEffect } from 'react';

function Home() {
  useEffect(() => {
    document.title = "Tanarouge — Home";
  }, []);
  return (
    <main>
      <section id="home">
        <picture>
          <source media="(max-width: 768px)" srcSet="/assets/images/main-shot-A-square.png" />
          <source media="(min-width: 769px)" srcSet="/assets/images/coming-soon.png" />
          <img src="/assets/images/coming-soon.png" className="background-image" alt="Tanarouge" />
        </picture>
        <div className="text-content">
          <p className="description desktop-bio">
            Venice-based artist and producer Tanarouge is in constant pursuit of connection between sound and emotion, human expression and nature. Shaped by electronic landscapes, ambient textures, and a fusion of countless influences, he crafts music that blends raw sonic elements, psychedelic atmospheres and immersive soundscapes of electronic music that aims at the heart, through the ribcage.
            <br /><br />
            For Tanarouge, each album is a timestamp: a reflection of a moment, an evolving snapshot of emotion and experience, never confined by genre or industry expectations. With an artistic vision rooted in creative freedom, he collaborates with musicians and creatives worldwide, leaving a distinctive sonic imprint across different projects.
            <br /><br />
            His music is an invitation to immerse, explore, let go of the unnecessary, and connect with the essence of sound.
          </p>
          <p className="description mobile-bio">
            Venice-based artist and producer Tanarouge is in constant pursuit of connection—between sound and emotion, human expression and nature.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Home;