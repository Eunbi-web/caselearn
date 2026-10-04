// Extras content — the PORTFOLIO gallery and the JOURNAL seed posts.
// Artworks are photo slots (hover → UPLOAD on the site, or drop files into
// public/photos/). Journal posts can be edited, added and deleted on the
// journal page itself.

export type Artwork = { slot: string; label: string };

export const artworks: Artwork[] = [
  { slot: 'artwork-01', label: 'Artwork 01' },
  { slot: 'artwork-02', label: 'Artwork 02' },
  { slot: 'artwork-03', label: 'Artwork 03' },
  { slot: 'artwork-04', label: 'Artwork 04' },
  { slot: 'artwork-05', label: 'Artwork 05' },
  { slot: 'artwork-06', label: 'Artwork 06' },
];

export type JournalPost = {
  id: string;
  date: string; // ISO — used for ordering
  dateLabel: string;
  title: string;
  body: string;
};

export const journalSeed: JournalPost[] = [
  { id: 'j-01', date: '2026-09-30', dateLabel: 'SEP 30, 2026', title: 'Folder #001 is halfway done', body: 'Five entries in and the English folder finally feels like a real file. Next up: rhetoric and audience, then the writing note.' },
  { id: 'j-02', date: '2026-09-18', dateLabel: 'SEP 18, 2026', title: 'New desk setup', body: 'Moved the lamp closer and pinned the progress board above the desk. Suddenly documenting assignments doesn\u2019t feel like a chore.' },
  { id: 'j-03', date: '2026-09-05', dateLabel: 'SEP 05, 2026', title: 'Started the case file', body: 'Built this little site to keep every assignment in one place — five folders, thirty entries, and pictures for all of them. Let\u2019s see how far it goes.' },
];
