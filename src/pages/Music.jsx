// src/pages/Music.jsx
import { useEffect } from 'react';

function Music() {
  useEffect(() => {
    document.title = "Tanarouge — Music";
  }, []);
  return (
    <main>
      <section id="music" style={{ paddingTop: '2rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div className="spotify-embed">
            <iframe
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/playlist/7fEZwIqkyreN1O5ATzBd1F?utm_source=generator"
              width="100%"
              height="380"
              frameBorder="0"
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              loading="lazy"
              title="Spotify Playlist 1"
            ></iframe>
          </div>

          <div className="spotify-embed" style={{ marginTop: '1.5rem' }}>
            <iframe
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/playlist/3Ef3ulUVVBg5m9OmvtG3cI?utm_source=generator"
              width="100%"
              height="380"
              frameBorder="0"
              allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              loading="lazy"
              title="Spotify Playlist 2"
            ></iframe>
          </div>
        </div>

        {/* 
        Grid layout precedente, commentato:
        <div className="music-grid">
          <div className="music-item" onClick={() => window.location.href='https://share.amuse.io/-BDkyouwJ2WE'}>
            <img src="/assets/images/selune.jpg" alt="Selune, Tanarouge release 2025"/>
            <div className="info">"Selune" <br/> 2025</div>
          </div>
          <div className="music-item" onClick={() => window.location.href='https://share.amuse.io/h49EZunhdNTf'}>
            <img src="/assets/images/selkie.png" alt="Selkie, Tanarouge release 2025"/>
            <div className="info">"Selkie" <br/> 2025</div>
          </div>
          <div className="music-item" onClick={() => window.location.href='https://share.amuse.io/RJ9tPAszinSI'}>
            <img src="/assets/images/01.png" alt="01, Tanarouge release 2024"/>
            <div className="info">"01" <br/> 2024</div>
          </div>
        </div>
        */}
      </section>
    </main>
  );
}

export default Music;