import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header id="header">
      {/* Desktop menu */}
      <div className="menu">
        <Link to="/" className="artist-name">⊙ Tanarouge</Link>
        <Link to="/home" data-page="home" data-title="Home" className="home-link">Home</Link>
        <Link to="/music" data-page="music" data-title="Music">Music</Link>
        <a href="https://circletoughts.notion.site/circle-thoughts-6159fd0576e94df9bed51900f499239b" target="_blank" rel="noopener noreferrer">Blog</a>
        <Link to="/live" data-page="live" data-title="Live">Live</Link>
        <Link to="/info" data-page="info" data-title="Info">Info</Link>
        <div className="social" aria-label="Social media links">
          <a href="https://instagram.com/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/instagram.svg" alt="Instagram" /></a>
          <a href="https://x.com/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/x.svg" alt="X" /></a>
          <a href="https://open.spotify.com/artist/565GKMj0rrNhGBPyNR4RUT?si=oRssEFu2TBSyfpvYfVBTtQ&dl_branch=1" target="_blank" rel="noopener noreferrer"><img src="assets/icons/spotify.svg" alt="Spotify" /></a>
          <a href="https://music.amazon.com/artists/B08ZJT72C9/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/amazonmusic.svg" alt="Amazon Music" /></a>
          <a href="https://music.apple.com/it/artist/tanarouge/1492120861" target="_blank" rel="noopener noreferrer"><img src="assets/icons/apple-music.svg" alt="Apple Music" /></a>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          ⊙
        </button>
      </div>

      {/* Mobile header */}
      <div className="mobile-header">
        <Link to="/" className="artist-name">⊙ Tanarouge</Link>
        <div className="mobile-menu-icon" aria-label="Toggle menu" onClick={toggleMenu}>
          <img
            src="assets/icons/plus.svg"
            alt="Menu Open"
            className="menu-icon open-icon"
            style={{ display: menuOpen ? 'none' : 'block' }}
          />
          <img
            src="assets/icons/cross.svg"
            alt="Menu Close"
            className="menu-icon close-icon"
            style={{ display: menuOpen ? 'block' : 'none' }}
          />
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link to="/home" data-page="home" data-title="Home" className="home-link" onClick={closeMenu}>Home</Link>
        <Link to="/music" data-page="music" data-title="Music" className="home-link" onClick={closeMenu}>Music</Link>
        <a href="https://circletoughts.notion.site/circle-thoughts-6159fd0576e94df9bed51900f499239b" target="_blank" rel="noopener noreferrer" className="home-link" onClick={closeMenu}>Blog</a>
        <Link to="/live" data-page="live" data-title="Live" className="home-link" onClick={closeMenu}>Live</Link>
        <Link to="/info" data-page="info" data-title="Info" className="home-link" onClick={closeMenu}>Info</Link>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          ⊙
        </button>
        <div className="social" aria-label="Social media links mobile">
          <a href="https://instagram.com/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/instagram.svg" alt="Instagram" /></a>
          <a href="https://x.com/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/x.svg" alt="X" /></a>
          <a href="https://open.spotify.com/artist/565GKMj0rrNhGBPyNR4RUT?si=oRssEFu2TBSyfpvYfVBTtQ&dl_branch=1" target="_blank" rel="noopener noreferrer"><img src="assets/icons/spotify.svg" alt="Spotify" /></a>
          <a href="https://music.amazon.com/artists/B08ZJT72C9/tanarouge" target="_blank" rel="noopener noreferrer"><img src="assets/icons/amazonmusic.svg" alt="Amazon Music" /></a>
          <a href="https://music.apple.com/it/artist/tanarouge/1492120861" target="_blank" rel="noopener noreferrer"><img src="assets/icons/apple-music.svg" alt="Apple Music" /></a>
        </div>
      </div>
    </header>
  );
}

export default Header;