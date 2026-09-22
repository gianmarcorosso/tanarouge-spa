// src/pages/Music.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import sections from '../data/releases.json';
import ReleaseModal from '../components/ReleaseModal';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'title', label: 'A–Z' },
];

/* Scrolls its text only when it does not fit. The string is rendered twice
   and the track shifts by exactly half its width, so the second copy lands
   where the first began and the loop has no visible seam. Duration follows
   length, keeping a long title and a short one at the same reading speed. */
function Marquee({ text, className }) {
  const boxRef = useRef(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const measure = () => {
      const box = boxRef.current;
      if (!box) return;
      const full = box.querySelector('span');
      setOverflow(full && full.scrollWidth > box.clientWidth ? full.scrollWidth : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  if (!overflow) {
    return (
      <div className={`marquee ${className}`} ref={boxRef}>
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div className={`marquee is-scrolling ${className}`} ref={boxRef}>
      <div
        className="marquee-track"
        style={{ animationDuration: `${Math.max(6, overflow / 28)}s` }}
      >
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

/* A tile is just the artwork and a caption. Titles run to 60+ characters, so
   the caption marquees on hover instead of wrapping and pushing the grid
   around. Clicking opens the modal, where the full title has room. */
function Release({ release, onOpen }) {
  const heading = release.isContribution ? release.trackTitle : release.title;
  /* Name everyone on the track: the album lookup only knows the billed act,
     while the playlist credit line carries the featured artists too. */
  const credits = release.creditedArtists || release.artist;
  const subtitle = release.isContribution
    ? `${credits} — ${release.title}`
    : credits;

  return (
    <div className="music-item">
      <button
        type="button"
        className="music-item-cover"
        onClick={onOpen}
        aria-label={`${heading} — details`}
      >
        <img src={release.artwork} alt={`${heading} cover`} loading="lazy" />
      </button>

      <div className="music-item-caption">
        <div className="music-item-heading">
          <Marquee className="music-item-title" text={heading} />
          <span className="music-item-year">{release.year}</span>
        </div>
        <Marquee className="music-item-artist" text={subtitle} />
      </div>
    </div>
  );
}

function Music() {
  const [openRelease, setOpenRelease] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [tab, setTab] = useState(sections[0]?.id);

  useEffect(() => {
    document.title = 'Tanarouge — Music';
  }, []);

  /* A search looks across all three catalogues -- that is the point of having
     one field above the tabs -- while plain browsing shows the active tab. */
  const searching = query.trim().length > 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sections
      .filter((section) => searching || section.id === tab)
      .map((section) => {
        const releases = section.releases
          .filter(
            (r) =>
              !q ||
              r.title.toLowerCase().includes(q) ||
              (r.artist || '').toLowerCase().includes(q) ||
              (r.year || '').includes(q)
          )
          .slice()
          .sort((a, b) => {
            if (sort === 'title') return a.title.localeCompare(b.title);
            const da = a.releaseDate || '';
            const db = b.releaseDate || '';
            return sort === 'oldest' ? da.localeCompare(db) : db.localeCompare(da);
          });
        return { ...section, releases };
      })
      .filter((section) => section.releases.length);
  }, [query, sort, tab, searching]);

  const total = visible.reduce((n, s) => n + s.releases.length, 0);

  return (
    <main>
      <section id="music">
        <nav className="music-tabs" aria-label="Catalogues">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={!searching && tab === section.id ? 'is-active' : ''}
              aria-current={!searching && tab === section.id ? 'true' : undefined}
              onClick={() => {
                setTab(section.id);
                setQuery('');
              }}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="music-controls">
          <input
            type="search"
            className="music-search"
            placeholder="Search releases"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search releases"
          />
          <div className="music-sort" role="group" aria-label="Sort releases">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={sort === s.key ? 'is-active' : ''}
                aria-pressed={sort === s.key}
                onClick={() => setSort(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          {visible.map((section) => (
            <div key={section.id} className="music-section">
              {searching && <h2 className="music-section-title">{section.label}</h2>}
              <div className="music-grid">
                {section.releases.map((release) => (
                  <Release
                    key={release.id}
                    release={release}
                    onOpen={() => setOpenRelease(release)}
                  />
                ))}
              </div>
            </div>
          ))}

          {total === 0 && <p className="music-empty">No releases match “{query}”.</p>}
        </div>
        {openRelease && (
          <ReleaseModal release={openRelease} onClose={() => setOpenRelease(null)} />
        )}
      </section>
    </main>
  );
}

export default Music;
