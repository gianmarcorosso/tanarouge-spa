import React, { useEffect, useRef } from 'react';

const PLATFORMS = [
  { key: 'spotify', label: 'Spotify', icon: 'assets/icons/spotify.svg' },
  { key: 'apple', label: 'Apple Music', icon: 'assets/icons/apple-music.svg' },
  { key: 'deezer', label: 'Deezer', icon: 'assets/icons/deezer.svg' },
];

/* Seconds to m:ss -- a release's total, or one track's length when the entry
   is a single contribution to someone else's record. */
function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* Full-screen view of one release: large artwork, the title with room to
   breathe, credits, and the platform links as logos. The grid tiles stay
   quiet because everything that needs space lives here instead. */
function ReleaseModal({ release, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    /* The page behind must not scroll while this is open. */
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  if (!release) return null;

  const links = PLATFORMS.filter((p) => release.links[p.key]);
  const heading = release.isContribution ? release.trackTitle : release.title;

  /* Spotify credits every artist on the track; the album lookup only knows
     the billed act, so prefer the fuller line when there is one. */
  const credits = release.creditedArtists || release.artist;

  const meta = [
    release.year,
    release.isSingle
      ? 'Single'
      : release.isContribution
        ? `from ${release.title}`
        : `${release.trackCount} tracks`,
    formatDuration(release.duration),
  ].filter(Boolean);

  return (
    <div
      className="release-modal"
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      onMouseDown={(e) => {
        // Close only on a click that starts on the backdrop itself.
        if (!panelRef.current?.contains(e.target)) onClose();
      }}
    >
      <div className="release-modal-panel" ref={panelRef}>
        <button
          type="button"
          className="release-modal-close"
          onClick={onClose}
          aria-label="Close"
          ref={closeRef}
        >
          ×
        </button>

        <img
          className="release-modal-art"
          src={release.artworkFull || release.artwork}
          alt={`${heading} cover`}
        />

        <div className="release-modal-body">
          <h2 className="release-modal-title">{heading}</h2>
          <p className="release-modal-artist">{credits}</p>
          <p className="release-modal-meta">{meta.join(' · ')}</p>

          <div className="release-modal-links">
            {links.map((p) => (
              <a
                key={p.key}
                href={release.links[p.key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={p.label}
                title={p.label}
              >
                {p.icon ? <img src={p.icon} alt="" /> : <span>{p.label}</span>}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReleaseModal;
