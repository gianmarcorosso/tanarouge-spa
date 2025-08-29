// src/pages/Home.jsx
import React, { useEffect } from 'react';

function Home() {
  useEffect(() => {
    document.title = "Tanarouge — Home";
  }, []);
  return (
    <main>
      <section id="home">
        <img src="/assets/images/IMG_0074.jpg" className="background-image" alt="Background" />
        <div className="text-content">
          <p className="description">
            Venice-based artist and producer Tanarouge is in constant pursuit of connection—between sound and emotion, human expression and nature.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Home;