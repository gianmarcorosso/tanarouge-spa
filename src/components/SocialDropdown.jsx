import React, { useState, useRef, useEffect } from 'react';

/* Social icon that opens a small menu of artist profiles (Tanarouge / TNRG)
   instead of linking straight out. Opens on hover on desktop, on click
   everywhere -- mobile has no hover, so click is the one that must always work. */
function SocialDropdown({ icon, alt, profiles }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const closeTimer = useRef(null);

  /* Closing on mouseleave alone is unforgiving: a pointer drifting slightly
     off the icon on its way to the menu would dismiss it. Wait a moment, and
     cancel that if the pointer comes back. */
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openNow = () => {
    cancelClose();
    setOpen(true);
  };

  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => cancelClose, []);

  // Click outside closes the menu (mobile has no hover to fall back on)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`social-dropdown${open ? ' open' : ''}`}
      ref={wrapperRef}
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        className="social-dropdown-toggle"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${alt} profiles`}
        onClick={() => {
          cancelClose();
          setOpen(!open);
        }}
      >
        <img src={icon} alt={alt} />
      </button>
      <div className="social-dropdown-menu" role="menu">
        {profiles.map((profile) => (
          <a
            key={profile.url}
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => {
              cancelClose();
              setOpen(false);
            }}
          >
            {profile.name}
          </a>
        ))}
      </div>
    </div>
  );
}

export default SocialDropdown;
