// VISUAL JOURNAL — the homepage's torn-paper collage, re-scattered: torn
// sheet scraps carrying the notes, taped photos pinned over the corners and
// realistic torn strays poking in from the desk's edges. Journal posts live
// as scraps; edit / upload / add / remove all still work.

import { useState } from 'react';
import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';
import { useJournal, addPost, savePostEdit, deletePost } from '../state/journal';
import type { JournalPost } from '../data/extras';

const BASE = import.meta.env.BASE_URL;

/** how each scrap leans as it goes down the pile */
const TILTS = [-3.4, 2.8, -2, 3.6];

function PostCard({ post, index }: { post: JournalPost; index: number }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const tilt = TILTS[index % TILTS.length];
  const right = index % 2 === 1;

  return (
    <figure
      className={`vj-post ${right ? 'vj-post-r' : 'vj-post-l'}`}
      style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
    >
      <img className="vj-post-bg" src={`${BASE}photos/straw-torn-sheet.png`} alt="" loading="lazy" draggable={false} />
      {/* its photo, taped over the scrap's top corner */}
      <div className="vj-post-photo">
        <span className="tape tape-top" aria-hidden="true" />
        <Photo name={`journal-${post.id}`} icon="camera" label={post.title} editable eager={index < 2} />
      </div>
      <figcaption className="vj-post-copy">
        {edit ? (
          <span className="vj-post-fields">
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ border: '1px dashed var(--line)', padding: '6px 8px', font: '700 13px var(--font-mono)', background: '#fdfcf7' }} />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} style={{ border: '1px dashed var(--line)', padding: '6px 8px', font: '12px var(--font-mono)', resize: 'vertical', background: '#fdfcf7' }} />
            <span className="vj-post-tools">
              <button type="button" className="photo-edit-btn" onClick={() => { savePostEdit(post.id, { title, body }); setEdit(false); }}>save ✓</button>
              <button type="button" className="photo-edit-btn" onClick={() => { setTitle(post.title); setBody(post.body); setEdit(false); }}>cancel</button>
            </span>
          </span>
        ) : (
          <>
            <span className="vj-date">{post.dateLabel}</span>
            <span className="vj-post-title">{post.title}</span>
            {post.body && <span className="vj-body-text">{post.body}</span>}
            <span className="vj-post-tools">
              <button type="button" className="photo-edit-btn" onClick={() => setEdit(true)}>edit ✎</button>
              <button
                type="button"
                className="photo-edit-btn photo-edit-remove"
                title="Remove this update"
                onClick={() => { if (window.confirm(`Remove “${post.title}”?`)) deletePost(post.id); }}
              >
                ✕
              </button>
            </span>
          </>
        )}
      </figcaption>
    </figure>
  );
}

export function VisualJournalPage() {
  const posts = useJournal();
  const [first, ...rest] = posts;

  // realistic torn strays cut off by the desk edges, staggered down the page
  const SIDE_SCRAPS = [
    { side: 'l' as const, top: '2%', width: '13%', rot: 24 },
    { side: 'r' as const, top: '9%', width: '15%', rot: -31 },
    { side: 'l' as const, top: '34%', width: '16%', rot: -58 },
    { side: 'r' as const, top: '46%', width: '12%', rot: 12 },
    { side: 'l' as const, top: '72%', width: '12%', rot: 47 },
    { side: 'r' as const, top: '84%', width: '15%', rot: -68 },
  ];

  return (
    <div className="vj-page" aria-label="visual journal collage">
      {SIDE_SCRAPS.map((scrap, index) => (
        <img
          key={index}
          className={`vj-side vj-side-${scrap.side}`}
          src={`${BASE}photos/straw-torn-sheet.png`}
          alt=""
          loading="lazy"
          draggable={false}
          style={{ top: scrap.top, width: scrap.width, transform: `rotate(${scrap.rot}deg)` }}
        />
      ))}

      <div className="vj-flow">
        {/* the title scrap + the small cut-out drifting beside it */}
        <div className="vj-head">
          <div className="vj-title-scrap">
            <img className="vj-post-bg" src={`${BASE}photos/straw-torn-sheet.png`} alt="" draggable={false} />
            <div className="vj-title-copy">
              <span className="prof-kicker vj-kicker">04 · pictures, scraps &amp; visual notes</span>
              <h1 className="vj-title-text">Visual journal</h1>
              <span className="vj-title-sub">a place for the images that don’t need a frame around them.</span>
            </div>
          </div>

          <figure className="vj-cut">
            <Photo name="visual-cutout" icon="user" label="A small cut-out character drawing" className="photo" />
            <span className="vj-caption">small cut-out / transparent PNG</span>
          </figure>
        </div>

        {/* the scrap pile — first entry keeps its note card tucked behind */}
        <div className="vj-pile">
          <section className="note-extra vj-note">
            <span className="note-label">cut-out study / 01</span>
            <p>no white box — just the art, floating on the scraps ✳</p>
          </section>

          {first && <PostCard post={first} index={0} />}
          {rest.map((post, index) => <PostCard key={post.id} post={post} index={index + 1} />)}
        </div>

        {/* the closing pair — sticky tally + the torn “add” scrap */}
        <div className="vj-foot">
          <div className="vj-sticky-col">
            <span className="vj-sticky-num">{String(posts.length + 1).padStart(2, '0')}</span>
            <span className="sticky-note">collect it<br />as you go</span>
          </div>

          <button
            type="button"
            className="vj-add"
            title="Add a new visual update"
            onClick={() => addPost()}
          >
            <img className="vj-post-bg" src={`${BASE}photos/straw-torn-sheet.png`} alt="" loading="lazy" draggable={false} />
            <span style={{ display: 'inline-block' }}>room for another<br />image — tap to add</span>
          </button>
        </div>
      </div>

      {/* eyes tucked between the torn scraps — small ones near the top,
          a big lazy spinner near the bottom of the pile */}
      <ScatteredEyes
        spots={[
          { top: '3%', left: '4%', size: 'clamp(48px, 5vw, 74px)', rotate: -30, flip: true, drift: 0, z: 6, eager: true },
          { top: '30%', right: '3%', size: 'clamp(66px, 7vw, 104px)', rotate: 16, drift: 2.2, z: 6 },
          { top: '76%', left: '2.5%', size: 'clamp(40px, 4.2vw, 62px)', rotate: 44, flip: true, drift: 4, z: 6 },
          { top: '94%', right: '8%', size: 'clamp(92px, 10vw, 150px)', rotate: -8, spin: true, drift: 1.2, z: 6 },
        ]}
      />
    </div>
  );
}
