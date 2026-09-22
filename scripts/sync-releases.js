#!/usr/bin/env node
/*
 * Rebuilds src/data/releases.json from three Spotify playlists, one per
 * section of the Music page. Run it with `npm run sync-releases` after
 * putting out something new -- add the track to the right playlist and
 * everything else follows.
 *
 * Nothing here needs credentials. The three sources:
 *   - Spotify's embed page, which ships each track list as JSON
 *   - Deezer's public API, to group those tracks into releases
 *   - the iTunes Search API, for Apple Music links and high-res artwork
 *
 * Grouping rule: tracks sharing a release collapse into one entry, so a
 * ten-track record shows a single cover. A track issued both as a single and
 * on an album keeps both entries, with their own covers -- Spotify gives the
 * two pressings different track ids, and Deezer lists them as separate
 * releases, so they are genuinely two things to link to.
 */

const fs = require('fs');
const path = require('path');

/* Spotify's edge times out over IPv6 from here, while IPv4 connects fine.
   Node 18 prefers whatever DNS returns first, so pin it. */
require('dns').setDefaultResultOrder('ipv4first');

const SECTIONS = [
  /* onlyArtist: the Tanarouge section is the artist's own catalogue, so
     collaborations released under another name (Sorekara and the like) are
     filtered out here and surface under "Produced by Tanarouge" instead.
     dedupe: Works lists the records made for other people, so anything
     already shown in an earlier section is dropped rather than repeated. */
  { id: 'tanarouge', label: 'Tanarouge', playlist: '7fEZwIqkyreN1O5ATzBd1F', onlyArtist: 'TANAROUGE' },
  { id: 'tnrg', label: 'TNRG', playlist: '7gFdL86Rjo3TtoFrdaPiBI' },
  /* Spotify's embed serves only the first 100 tracks of a playlist and ignores
     any offset, so Works is split across two playlists of at most 100 each
     and read as one list. Add a third here if it outgrows them again. */
  {
    id: 'produced',
    label: 'Works',
    playlists: ['4q8p7qUJNeKZrxPyOxTcM4', '6fdofCHksc3EC0OlFkabX2'],
    dedupe: true,
  },
];

const DEEZER_ARTIST_ID = '81416122';
const ITUNES_TERM = 'tanarouge';
const ARTWORK_SIZE = '1200x1200bb';

const OUT = path.join(__dirname, '..', 'src', 'data', 'releases.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/* Run tasks a few at a time. The lookups are independent and each is mostly
   spent waiting on the network, so doing them one after another wastes most
   of the run; a small pool keeps it quick without hammering the APIs. */
async function pooled(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  const runner = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

const POOL = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries) throw new Error(`${url} -> ${err.message}`);
      await sleep(400 * i);
    }
  }
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

/* Titles differ in punctuation and case between services, so compare them
   stripped down to letters and digits. */
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/* iTunes answers with whatever storefront it searched (/us/, /it/ ...), which
   pins every visitor to that country's catalogue. Drop the segment: Apple
   then redirects each visitor to their own store. */
function neutralAppleUrl(url) {
  if (!url) return url;
  return url.split('?')[0].replace(/music\.apple\.com\/[a-z]{2}\//, 'music.apple.com/');
}

/* Hand corrections, applied after the catalogues are read. The automatic
   rules place a record from its credits, which is right nearly always and
   wrong in the few cases listed here -- a name credited on the record that
   does not reflect who the release belongs to. Keyed by lowercased title.
     section: move the entry into this section, whatever the credits say
     credits: replace the credit line shown on the page */
const OVERRIDES = {
  'cuore matto': { section: 'tnrg' },
  cioccolatini: { section: 'produced', credits: 'SKA' },
  coordinates: { section: 'tanarouge' },
  'six years': { section: 'tanarouge' },
  /* Album links, supplied by hand. A playlist entry names a track, and the
     embed never reveals which record it came from, so a multi-track release
     has no Spotify URL to offer until one is given here. */
  radici: { spotify: 'https://open.spotify.com/album/6oAu2vAPt3wT6haBRLKUAX' },
  'when the light was slow': { spotify: 'https://open.spotify.com/album/1rC5gXScefce9jAjdYc20t' },
  'nuovi fossili': { spotify: 'https://open.spotify.com/album/7tTef2o1DO9CQ2McWedq74' },
  /* Only Spotify carries this record, so the sources return the track's own
     sleeve. Point at the album's cover and name the record it comes from. */
  shaboo: {
    album: 'Il Mercante Di Venezia',
    artwork: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d0000b273c060913837d47a9617bb8e74',
  },
};

/* The services return these names in whatever case their catalogue holds --
   an old profile left "TANAROUGE" on some records, so the same artist reads
   three different ways across the page. Pin the spelling of the names that
   belong to the site, and leave every other act exactly as credited.
   Also swap the non-breaking spaces Spotify puts between credits for
   ordinary ones, so a long credit line can wrap. */
const CANONICAL_NAMES = ['Tanarouge', 'TNRG'];

/* Collectives are billed under the group's name. Spotify lists every member
   individually, which turns one act into a ten-name credit line that says
   less than the name itself does. */
const COLLECTIVES = ['Santissima Foresta in Fiamme'];

function tidyCredits(value) {
  if (!value) return value;

  const collective = COLLECTIVES.find((c) => norm(value).includes(norm(c)));
  if (collective) return collective;

  return value
    .replace(/\u00a0/g, ' ')
    .split(',')
    .map((part) => {
      const name = part.trim();
      const match = CANONICAL_NAMES.find((n) => norm(name) === norm(n));
      return match || name;
    })
    .join(', ');
}

/* Spotify's embed page carries the playlist in a __NEXT_DATA__ script tag.
   This is the public page any browser loads, not a private endpoint. */
async function fetchPlaylist(playlistId) {
  const html = await getText(`https://open.spotify.com/embed/playlist/${playlistId}`);
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!m) throw new Error('playlist: __NEXT_DATA__ not found (page layout changed?)');

  const seek = (node, key, depth = 0) => {
    if (depth > 12 || node === null || typeof node !== 'object') return null;
    if (!Array.isArray(node) && key in node) return node[key];
    for (const v of Object.values(node)) {
      const hit = seek(v, key, depth + 1);
      if (hit !== null) return hit;
    }
    return null;
  };

  const list = seek(JSON.parse(m[1]), 'trackList');
  if (!Array.isArray(list) || !list.length) throw new Error('playlist: empty track list');

  return list.map((t) => ({
    title: t.title,
    artists: t.subtitle,
    spotifyUrl: t.uri ? `https://open.spotify.com/track/${t.uri.split(':').pop()}` : null,
    /* Spotify marks a track unplayable once it has been taken down. Those
       entries stay on the page -- the record still happened -- but they get
       no link, since there is nothing left to open. */
    isPlayable: t.isPlayable !== false,
    duration: t.duration || 0,
  }));
}

/* Deezer's free-text search is unreliable for these catalogues -- it returns
   nothing for some titles and the wrong artist for others. Resolving the
   artist first, then reading their discography, is far more accurate.
   Artists are cached: one lookup serves every track they appear on. */
async function getArtistCatalogue(artistName, cache) {
  const key = norm(artistName);
  if (cache.has(key)) return cache.get(key);

  let catalogue = [];
  try {
    const { data: found = [] } = await getJSON(
      `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=5`
    );
    /* Names differ in diacritics and styling between services (EUFORIA vs
       EUFØRIA), so compare them normalised and fall back to the top hit. */
    const artist = found.find((a) => norm(a.name) === key) || found[0];
    if (artist) {
      const { data: albums = [] } = await getJSON(
        `https://api.deezer.com/artist/${artist.id}/albums?limit=100`
      );
      for (const a of albums) {
        try {
          const { data: tracks = [] } = await getJSON(`https://api.deezer.com/album/${a.id}/tracks?limit=100`);
          catalogue.push({
            id: a.id,
            title: a.title,
            url: a.link,
            artist: artist.name,
            releaseDate: a.release_date,
            cover: a.cover_xl || a.cover_big || null,
            trackCount: tracks.length || a.nb_tracks || 1,
            trackTitles: tracks.map((t) => norm(t.title)),
            /* Seconds, per track and for the record as a whole: a single
               contribution reports its own length, a full release its total. */
            duration: a.duration || tracks.reduce((n, t) => n + (t.duration || 0), 0),
            trackDurations: tracks.reduce((acc, t) => {
              acc[norm(t.title)] = t.duration || 0;
              return acc;
            }, {}),
          });
        } catch { /* skip an album that fails to load */ }
        await sleep(120);
      }
    }
  } catch (err) {
    console.warn(`  ! Deezer artist "${artistName}": ${err.message}`);
  }

  cache.set(key, catalogue);
  await sleep(120);
  return catalogue;
}

/* Every release in the track's artists' catalogues that carries this title.
   A song put out as a single and again on an album matches both, and both
   are kept -- they are two different things to link to. */
async function findReleases(track, cache) {
  const names = (track.artists || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  const wanted = norm(track.title);
  const hits = [];
  const seen = new Set();

  for (const name of names) {
    const catalogue = await getArtistCatalogue(name, cache);
    for (const album of catalogue) {
      if (album.trackTitles.includes(wanted) && !seen.has(album.id)) {
        seen.add(album.id);
        hits.push(album);
      }
    }
    if (hits.length) break; // the primary artist's catalogue is usually enough
  }

  return hits;
}

/* A song search answers with the track's own metadata, so building a record
   from the first matching track gives it that track's date and credits --
   which is how one EP ended up listed twice under two different years. Ask
   iTunes about the collection itself instead. */
async function lookupItunesAlbum(collectionId, cache) {
  const key = `album:${collectionId}`;
  if (cache.has(key)) return cache.get(key);

  let album = null;
  try {
    const { results = [] } = await getJSON(`https://itunes.apple.com/lookup?id=${collectionId}`);
    const hit = results.find((r) => r.wrapperType === 'collection');
    if (hit) {
      album = {
        title: (hit.collectionName || '').replace(/ - (Single|EP)$/i, ''),
        artist: hit.artistName || null,
        releaseDate: (hit.releaseDate || '').slice(0, 10),
        trackCount: hit.trackCount || 1,
        url: neutralAppleUrl(hit.collectionViewUrl),
      };
    }
  } catch (err) {
    console.warn(`  ! iTunes lookup ${collectionId}: ${err.message}`);
  }

  cache.set(key, album);
  await sleep(180);
  return album;
}

/* Last resort, so that nothing in a playlist is silently dropped. Spotify's
   oEmbed endpoint returns a track's artwork without any credentials, which
   covers records the other catalogues do not carry -- takedowns, exclusives,
   anything that only ever went out on Spotify. The entry gets real artwork,
   title, credits and duration, and only the links the sources actually
   provided: no Deezer or Apple URL is invented for a record they lack. */
async function findViaSpotifyArt(track, cache) {
  const id = (track.spotifyUrl || '').split('/').pop();
  if (!id) return null;

  const key = `art:${id}`;
  const cached = cache.get(key);
  /* Cache the artwork lookup, but re-apply this entry's own availability:
     the image is shared, the takedown state is per track. */
  if (cached) return cached && { ...cached, unavailable: track.isPlayable === false };

  let release = null;
  try {
    const data = await getJSON(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(`spotify:track:${id}`)}`
    );
    /* oEmbed has the artwork but not the date, which lives in the track's
       embed payload -- fetch both so these entries are not left dateless. */
    let releaseDate = null;
    try {
      const html = await getText(`https://open.spotify.com/embed/track/${id}`);
      const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
      if (m) {
        const iso = JSON.stringify(JSON.parse(m[1])).match(/"isoString":"(\d{4}-\d{2}-\d{2})/);
        if (iso) releaseDate = iso[1];
      }
    } catch { /* date is a nice-to-have here; the entry still stands without it */ }

    if (data?.thumbnail_url) {
      /* The size is encoded in the image id: 00001e02 is 300px, 0000b273 is
         640px, which is the largest Spotify serves. */
      const large = data.thumbnail_url.replace('ab67616d00001e02', 'ab67616d0000b273');
      release = {
        /* Keyed by sleeve *and* title: two songs off one EP share a cover,
           so the artwork alone would make them the same release and one of
           them would vanish. Two pressings of one song differ by sleeve. */
        id: `spotify-art:${large.split('/').pop()}:${norm(track.title)}`,
        title: data.title || track.title,
        url: null,
        artist: (track.artists || '').split(',')[0].trim(),
        releaseDate,
        cover: large,
        coverFull: large,
        trackCount: 1,
        duration: track.duration ? Math.round(track.duration / 1000) : 0,
        trackDurations: {},
        appleUrl: null,
        spotifyOnly: true,
        /* Taken down: the track page no longer resolves, so the entry is
           shown for the record it documents, without a link to follow. */
        unavailable: track.isPlayable === false,
      };
    }
  } catch (err) {
    console.warn(`  ! Spotify art "${track.title}": ${err.message}`);
  }

  cache.set(key, release);
  await sleep(150);
  return release;
}

/* Deezer does not carry everything -- some records are simply absent from its
   catalogue, and some artist names there collide with unrelated acts. When an
   artist lookup comes up empty, ask iTunes for the song directly: it returns
   the album that carries it, which is exactly what is needed to build an
   entry. This is what keeps guest appearances on other people's records from
   falling out of the list. */
async function findViaItunes(track, cache) {
  const primary = (track.artists || '').split(',')[0].trim();
  const key = norm(`song|${track.title}|${primary}`);
  if (cache.has(key)) return cache.get(key);

  let release = null;
  try {
    const term = encodeURIComponent(`${primary} ${track.title}`);
    const { results = [] } = await getJSON(
      `https://itunes.apple.com/search?term=${term}&entity=song&limit=12&country=IT`
    );
    /* Title alone is not enough: common words match unrelated records. Also
       require that some credited artist appears in the result's artist name. */
    const credited = (track.artists || '').split(',').map((n) => norm(n.trim())).filter(Boolean);
    const hit = results.find((r) => {
      if (norm(r.trackName) !== norm(track.title)) return false;
      const found = norm(r.artistName);
      return credited.some((c) => c.length > 2 && (found.includes(c) || c.includes(found)));
    });
    if (hit) {
      const clean = (hit.collectionName || '').replace(/ - (Single|EP)$/i, '');
      /* For anything longer than a single, the record's own details are the
         ones that describe it. */
      const parent = (hit.trackCount || 1) > 1
        ? await lookupItunesAlbum(hit.collectionId, cache)
        : null;
      release = {
        id: `itunes:${hit.collectionId}`,
        title: parent?.title || clean,
        url: null,
        artist: parent?.artist || hit.artistName || primary,
        releaseDate: (parent?.releaseDate || hit.releaseDate || '').slice(0, 10),
        cover: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100bb', ARTWORK_SIZE) : null,
        coverFull: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100bb', '3000x3000bb') : null,
        trackCount: hit.trackCount || 1,
        duration: hit.trackTimeMillis ? Math.round(hit.trackTimeMillis / 1000) : 0,
        trackDurations: hit.trackTimeMillis
          ? { [norm(hit.trackName)]: Math.round(hit.trackTimeMillis / 1000) }
          : {},
        appleUrl: parent?.url || neutralAppleUrl(hit.collectionViewUrl),
        copyright: hit.copyright || null,
        genre: hit.primaryGenreName || null,
      };
    }
  } catch (err) {
    console.warn(`  ! iTunes song "${track.title}": ${err.message}`);
  }

  cache.set(key, release);
  await sleep(180);
  return release;
}

/* Apple Music link and artwork for one release, matched on album + artist. */
async function findItunesRelease(album, cache) {
  const key = norm(`${album.title}|${album.artist}`);
  if (cache.has(key)) return cache.get(key);

  let found = null;
  try {
    const term = encodeURIComponent(`${album.artist} ${album.title}`);
    const { results = [] } = await getJSON(
      `https://itunes.apple.com/search?term=${term}&entity=album&limit=10&country=IT`
    );
    const clean = (t) => norm((t || '').replace(/ - (Single|EP)$/i, ''));
    const hit = results.find((r) => clean(r.collectionName) === norm(album.title)) || null;
    if (hit) {
      found = {
        url: neutralAppleUrl(hit.collectionViewUrl),
        artwork: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100bb', ARTWORK_SIZE) : null,
        artworkFull: hit.artworkUrl100 ? hit.artworkUrl100.replace('100x100bb', '3000x3000bb') : null,
      };
    }
  } catch (err) {
    console.warn(`  ! iTunes "${album.title}": ${err.message}`);
  }

  cache.set(key, found);
  await sleep(180);
  return found;
}

async function main() {
  const deezerCache = new Map();
  const itunesCache = new Map();
  const sections = [];
  const problems = [];
  const alreadyShown = new Set();

  for (const section of SECTIONS) {
    console.log(`\nReading playlist: ${section.label}…`);
    const ids = section.playlists || [section.playlist];
    const pages = await Promise.all(ids.map((id) => fetchPlaylist(id)));
    const tracks = pages.flat();
    console.log(
      `  ${tracks.length} tracks${ids.length > 1 ? ` (${pages.map((p) => p.length).join(' + ')})` : ''} — resolving releases…`
    );

    /* Group by Deezer release id. A song issued both as a single and on an
       album resolves to two different ids, so both survive as separate
       entries with their own artwork, which is the point. */
    const byRelease = new Map();

    /* Resolve the tracks concurrently, then fold the answers in playlist
       order: the lookups do not depend on each other, but the grouping does,
       so keep that part sequential and deterministic. */
    const resolved = await pooled(tracks, POOL, async (track) => {
      let matches = await findReleases(track, deezerCache);
      if (!matches.length) {
        /* Not on Deezer -- try iTunes, then Spotify's own artwork, so a
           record missing from both catalogues still appears. */
        const viaItunes = await findViaItunes(track, itunesCache);
        matches = viaItunes ? [viaItunes] : [];
      }
      if (!matches.length) {
        const viaArt = await findViaSpotifyArt(track, itunesCache);
        matches = viaArt ? [viaArt] : [];
      }
      return { track, matches };
    });

    for (const { track, matches } of resolved) {
      if (!matches.length) {
        problems.push({ section: section.label, track });
        continue;
      }
      for (const album of matches) {
        if (!byRelease.has(album.id)) byRelease.set(album.id, { album, tracks: [] });
        const bucket = byRelease.get(album.id);
        if (!bucket.tracks.some((t) => t.spotifyUrl === track.spotifyUrl)) {
          bucket.tracks.push(track);
        }
      }
    }

    /* Each release's Apple lookup is independent of the others, so run them
       through the same pool rather than end to end. */
    const releases = await pooled([...byRelease.values()], POOL, async ({ album, tracks: hits }) => {
      const fromItunes = String(album.id).startsWith('itunes:');
      const spotifyOnly = Boolean(album.spotifyOnly);
      const apple = spotifyOnly || fromItunes
        ? { url: album.appleUrl, artwork: album.cover, artworkFull: album.coverFull }
        : await findItunesRelease(album, itunesCache);

      /* Represent the release by one track when the playlist only carries one
         of them. That covers singles, and equally a guest spot or a single
         production credit on someone else's record -- linking to the whole
         album there would claim far more than the contribution. */
      /* A playlist can list the same song twice (two pressings, or simply a
         duplicate entry), so count distinct titles rather than entries. */
      const distinct = new Set(hits.map((t) => norm(t.title)));
      const single = distinct.size === 1 ? hits[0] : null;
      const isContribution = distinct.size === 1 && album.trackCount > 1;

      return {
        id: String(album.id),
        title: album.title,
        artist: tidyCredits(album.artist),
        /* Spotify's credit line names every artist on the track, which is how
           guest appearances stay attributable after the album-level lookup. */
        /* Credits describe one performance. Merging the credit lines of
           several tracks off the same record invents a line that matches no
           track on it, so only a single-track entry borrows the playlist's
           credits; a full record is billed to its own artist. */
        creditedArtists: tidyCredits(
          distinct.size === 1 ? hits[0].artists : album.artist
        ),
        /* Full date drives the sort; the year alone collides for everything
           put out in the same year. */
        releaseDate: album.releaseDate || null,
        year: (album.releaseDate || '').slice(0, 4) || null,
        trackCount: album.trackCount,
        isSingle: album.trackCount === 1,
        /* One track out of a larger record: show the track's name, not the
           album's, so the page does not imply the whole thing. */
        isContribution,
        /* Only Spotify carries this one; the modal shows the single link it
           has rather than pretending the others exist. */
        spotifyOnly,
        unavailable: Boolean(album.unavailable),
        trackTitle: isContribution ? single.title : null,
        /* One track off a bigger record shows that track's length; anything
           else shows the release's total running time. */
        duration:
          (isContribution && (album.trackDurations || {})[norm(single.title)]) ||
          album.duration ||
          0,
        playlistTitles: [...new Set(hits.map((t) => t.title))],
        artwork: apple?.artwork || album.cover,
        artworkFull: apple?.artworkFull || album.cover,
        links: {
          spotify: album.unavailable ? null : single?.spotifyUrl || null,
          apple: apple?.url || null,
          deezer: album.url || null,
        },
      };
    });

    /* The same record can arrive under two ids -- some of its tracks resolve
       on Deezer, the rest only on iTunes -- which leaves it listed twice.
       Fold those together on title plus release date, keeping whichever copy
       carries more links so nothing is lost in the merge. */
    const merged = new Map();
    for (const r of releases) {
      /* Merge on what identifies the release itself -- record, song, artist
         and date. The sleeve cannot be part of this: the same album carries
         a different image URL on each service, so keying on it leaves one
         entry per catalogue that found the record. Two genuine pressings of
         a song still differ by date. */
      const song = norm(r.trackTitle || r.title);
      const key = `${norm(r.title)}|${song}|${norm(r.artist)}|${r.releaseDate || ''}`;
      const seen = merged.get(key);
      if (!seen) {
        merged.set(key, r);
        continue;
      }
      seen.links = {
        spotify: seen.links.spotify || r.links.spotify,
        apple: seen.links.apple || r.links.apple,
        deezer: seen.links.deezer || r.links.deezer,
      };
      seen.artwork = seen.artwork || r.artwork;
      seen.artworkFull = seen.artworkFull || r.artworkFull;
      seen.duration = seen.duration || r.duration;
    }

    /* A track that only resolved through Spotify's artwork looks like a
       one-track release, even when the record it came from is already in
       this list. Where a fuller release by the same artist shares its date,
       present the track as a contribution to it rather than as a record of
       its own. */
    const candidates = [...merged.values()];
    for (const r of candidates) {
      if (!r.spotifyOnly || r.trackCount > 1) continue;
      const parent = candidates.find(
        (other) =>
          other !== r &&
          other.trackCount > 1 &&
          other.releaseDate === r.releaseDate &&
          norm(other.artist) === norm(r.artist)
      );
      if (parent) {
        r.isContribution = true;
        r.trackTitle = r.title;
        r.title = parent.title;
        r.parentId = parent.id;
      }
    }

    /* Where the record itself is on the page, drop the individual tracks that
       belong to it: showing the album and then each of its songs turns one
       release into ten tiles of the same sleeve. A track only stands alone
       when its record is absent, which is what marks it as a contribution. */
    const shownRecords = new Set(
      candidates.filter((r) => r.trackCount > 1 && !r.isContribution).map((r) => r.id)
    );

    /* Match by title too: a track can be attached to its record by the rule
       above or by the lookup itself, and either way the record already
       speaks for it. */
    const shownTitles = new Set(
      candidates
        .filter((r) => r.trackCount > 1 && !r.isContribution)
        .map((r) => `${norm(r.title)}|${norm(r.artist)}`)
    );

    let final = candidates.filter((r) => {
      if (r.parentId && shownRecords.has(r.parentId)) return false;
      if (r.isContribution && shownTitles.has(`${norm(r.title)}|${norm(r.artist)}`)) return false;
      return true;
    });

    /* Several tracks off one record, with the record itself absent, still
       describe a single release -- so present it as the record rather than
       once per song. One track alone stays named as that track, since it is
       the contribution being shown. */
    const byRecord = new Map();
    for (const r of final) {
      if (!r.isContribution) continue;
      const key = `${norm(r.title)}|${norm(r.artist)}`;
      if (!byRecord.has(key)) byRecord.set(key, []);
      byRecord.get(key).push(r);
    }

    /* A single playlist track that resolved to several records by the same
       artist -- a title search matching more than one release -- would show
       up once per match. Keep the one whose date is nearest the track's own
       release, which is the pressing the playlist points at. */
    const byTrack = new Map();
    for (const r of final) {
      const song = norm(r.trackTitle || r.title);
      const key = `${song}|${norm(r.artist)}`;
      if (!byTrack.has(key)) byTrack.set(key, []);
      byTrack.get(key).push(r);
    }

    const extra = new Set();
    for (const group of byTrack.values()) {
      if (group.length < 2) continue;
      /* Different dates mean genuinely different pressings only when the
         artwork differs too; identical sleeves are the same record. */
      const sleeves = new Set(group.map((r) => (r.artwork || '').slice(-32)));
      if (sleeves.size > 1) continue;
      group.sort((a, b) => b.trackCount - a.trackCount);
      for (const r of group.slice(1)) extra.add(r);
    }
    final = final.filter((r) => !extra.has(r));

    /* Tracks that only resolved through Spotify's artwork each look like a
       one-track release, so a ten-song record arrives as ten tiles of the
       same sleeve with no album among them to attach to. An identical cover
       and release date is the record: fold them into one entry. */
    const bySleeve = new Map();
    for (const r of final) {
      if (r.trackCount > 1 || r.isContribution) continue;
      const sleeve = (r.artwork || '').split('/').pop();
      if (!sleeve) continue;
      const key = `${sleeve}|${r.releaseDate || ''}|${norm(r.artist)}`;
      if (!bySleeve.has(key)) bySleeve.set(key, []);
      bySleeve.get(key).push(r);
    }

    const folded = new Set();
    for (const group of bySleeve.values()) {
      if (group.length < 2) continue;
      const [keep, ...rest] = group;
      /* The record's name is not in the data -- these entries only know
         their own song titles -- so keep the first and count the rest. */
      keep.trackCount = group.length;
      keep.isSingle = false;
      keep.trackTitle = null;
      keep.isContribution = false;
      for (const r of rest) {
        keep.links = {
          spotify: keep.links.spotify || r.links.spotify,
          apple: keep.links.apple || r.links.apple,
          deezer: keep.links.deezer || r.links.deezer,
        };
        folded.add(r);
      }
    }
    final = final.filter((r) => !folded.has(r));

    const collapsed = new Set();
    for (const group of byRecord.values()) {
      if (group.length < 2) continue;
      /* Keep the copy that knows most about the record. */
      group.sort((a, b) => b.trackCount - a.trackCount ||
        Object.values(b.links).filter(Boolean).length -
        Object.values(a.links).filter(Boolean).length);
      const [keep, ...rest] = group;
      keep.isContribution = false;
      keep.trackTitle = null;
      for (const r of rest) {
        keep.links = {
          spotify: keep.links.spotify || r.links.spotify,
          apple: keep.links.apple || r.links.apple,
          deezer: keep.links.deezer || r.links.deezer,
        };
        collapsed.add(r);
      }
    }

    final = final.filter((r) => !collapsed.has(r));

    /* A release cannot be a contribution to itself: when the track name and
       the record name are the same, the entry is simply that record. */
    for (const r of final) {
      if (r.isContribution && norm(r.trackTitle || '') === norm(r.title)) {
        r.isContribution = false;
        r.trackTitle = null;
      }
    }
    if (section.onlyArtist) {
      /* Match the name anywhere in the credits, not just as the lead: a track
         billed "Sorekara, Tanarouge" or "Tauma & TANAROUGE" is still theirs.
         Comparison is case- and punctuation-insensitive, so TANAROUGE,
         Tanarouge and tanarouge all count as the same person. */
      const wanted = norm(section.onlyArtist);
      final = final.filter((r) => {
        const credited = norm(`${r.artist} ${r.creditedArtists || ''}`);
        return credited.includes(wanted);
      });

      /* A guest spot on someone else's album belongs here as the track, not
         as the whole record -- the record itself belongs to whoever made it
         and shows up under "Produced by". */
      final = final.map((r) => {
        if (r.isSingle || r.isContribution) return r;
        const ownRecord = norm(r.artist).includes(wanted);
        if (ownRecord) return r;
        const mine = (r.playlistTitles || []).filter(Boolean);
        return mine.length === 1
          ? { ...r, isContribution: true, trackTitle: mine[0] }
          : r;
      });
    }
    if (section.dedupe) {
      /* Match on the release itself, not on its id: the same record reached
         through two different sources carries two ids, and keying on those
         let an artist's own work reappear here after the earlier section
         already showed it. */
      final = final.filter((r) => {
        const song = norm(r.trackTitle || r.title);
        return (
          !alreadyShown.has(r.id) &&
          !alreadyShown.has(`${song}|${norm(r.artist)}|${r.releaseDate || ''}`)
        );
      });
    }
    /* Only a full-record entry claims the id. An earlier section showing just
       one track off a record leaves the record itself free to appear here. */
    for (const r of final) {
      if (r.isContribution) continue;
      alreadyShown.add(r.id);
      const song = norm(r.trackTitle || r.title);
      alreadyShown.add(`${song}|${norm(r.artist)}|${r.releaseDate || ''}`);
    }

    final.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    sections.push({ id: section.id, label: section.label, releases: final });
    console.log(`  -> ${final.length} releases (${releases.length} before filtering)`);
  }

  /* Apply the hand corrections once every section exists, so an entry can be
     moved from one to another. */
  for (const [title, fix] of Object.entries(OVERRIDES)) {
    let entry = null;
    let from = null;

    for (const sec of sections) {
      const i = sec.releases.findIndex((r) => norm(r.title) === norm(title));
      if (i !== -1) {
        [entry] = sec.releases.splice(i, 1);
        from = sec;
        break;
      }
    }

    if (!entry) {
      console.warn(`  ! override "${title}": no matching release`);
      continue;
    }

    if (fix.credits) entry.creditedArtists = fix.credits;
    if (fix.title) {
      entry.title = fix.title;
      entry.trackTitle = null;
      entry.isContribution = false;
    }

    /* Replace the sleeve the sources supplied. Either a full URL or a path
       under public/, e.g. "assets/images/shaboo.jpg". */
    if (fix.spotify) entry.links = { ...entry.links, spotify: fix.spotify };

    if (fix.artwork) {
      entry.artwork = fix.artwork;
      entry.artworkFull = fix.artworkFull || fix.artwork;
    }

    /* Recast the entry as a track off the named record, borrowing that
       record's sleeve when it is already in the list. */
    if (fix.album) {
      entry.trackTitle = entry.trackTitle || entry.title;
      entry.title = fix.album;
      entry.isContribution = true;

      const parent = sections
        .flatMap((sec) => sec.releases)
        .find((r) => norm(r.title) === norm(fix.album) && r.trackCount > 1);
      if (parent) {
        entry.artwork = parent.artwork;
        entry.artworkFull = parent.artworkFull;
        entry.links = {
          spotify: entry.links.spotify || parent.links.spotify,
          apple: entry.links.apple || parent.links.apple,
          deezer: entry.links.deezer || parent.links.deezer,
        };
      }
    }

    const target = fix.section
      ? sections.find((sec) => sec.id === fix.section)
      : from;

    if (!target) {
      console.warn(`  ! override "${title}": unknown section "${fix.section}"`);
      from.releases.push(entry);
      continue;
    }

    target.releases.push(entry);
    target.releases.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    if (target !== from) {
      console.log(`  override: ${entry.title} -> ${target.label}`);
    }
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(sections, null, 2) + '\n');

  console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`);
  for (const sec of sections) {
    console.log(`\n${sec.label} — ${sec.releases.length} releases`);
    for (const r of sec.releases) {
      const platforms = Object.entries(r.links).filter(([, v]) => v).map(([k]) => k).join(', ');
      const kind = r.isSingle ? 'single' : `${r.trackCount} tracks`;
      console.log(`  ${r.year}  ${r.title.slice(0, 36).padEnd(36)} ${String(r.artist).slice(0, 22).padEnd(22)} [${kind}] ${platforms}`);
    }
  }

  if (problems.length) {
    console.log(`\n${problems.length} track(s) not found on Deezer, left out:`);
    for (const p of problems) console.log(`  - [${p.section}] ${p.track.title} (${p.track.artists})`);
  }
}

main().catch((err) => {
  console.error('\nsync-releases failed:', err.message);
  process.exit(1);
});
