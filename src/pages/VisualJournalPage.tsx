// VISUAL JOURNAL — the collage wall re-scattered: clean lavender glow-paper
// sheets carrying the notes, taped photos pinned over the corners and
// scribbled note piles slipping in from the desk's edges. Journal posts live
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

  // loose scribbled note piles slipping in from the desk edges, staggered
  // down the page
  const SIDE_SCRAPS = [
    { side: 'l' as const, top: '2%', width: '12%', rot: 24, pile: 1 as const },
    { side: 'r' as const, top: '9%', width: '14%', rot: -31, pile: 2 as const, flip: true },
    { side: 'l' as const, top: '34%', width: '15%', rot: -58, pile: 3 as const },
    { side: 'r' as const, top: '46%', width: '12%', rot: 12, pile: 4 as const, flip: true },
    { side: 'l' as const, top: '72%', width: '12%', rot: 47, pile: 2 as const },
    { side: 'r' as const, top: '84%', width: '14%', rot: -68, pile: 3 as const, flip: true },
  ];

  return (
    <div className="vj-page" aria-label="visual journal collage">
      {SIDE_SCRAPS.map((scrap, index) => (
        <img
          key={index}
          className={`vj-side vj-side-${scrap.side}`}
          src={`${BASE}photos/note-pile-${scrap.pile}.png`}
          alt=""
          loading="lazy"
          draggable={false}
          style={{ top: scrap.top, width: scrap.width, transform: `rotate(${scrap.rot}deg)${scrap.flip ? ' scaleX(-1)' : ''}` }}
        />
      ))}

      <div className="vj-flow">
        {/* the title scrap */}
        <div className="vj-head">
          <div className="vj-title-scrap">
            <div className="vj-title-copy">
              <h1 className="vj-title-text">Visual journal</h1>
            </div>
          </div>
        </div>

        {/* the scrap pile — first entry keeps its note card tucked behind */}
        <div className="vj-pile">
          {first && <PostCard post={first} index={0} />}
          {rest.map((post, index) => <PostCard key={post.id} post={post} index={index + 1} />)}
        </div>

        {/* the closing “add” scrap */}
        <div className="vj-foot">
          <button
            type="button"
            className="vj-add"
            title="Add a new visual update"
            onClick={() => addPost()}
          >
            <span style={{ display: 'inline-block' }}>room for another<br />image — tap to add</span>
          </button>
        </div>
      </div>

      {/* eyes tucked into the clear wall: above the title sheet on the right,
          the right margin beside the post cards, and the bottom-left wall —
          clear of every torn scrap */}
      <ScatteredEyes
        spots={[
          { top: '34px', right: '22px', size: 'clamp(100px, 11vw, 160px)', rotate: 16, drift: 0, eager: true },
          { top: '56%', right: '18px', size: 'clamp(82px, 9vw, 132px)', rotate: -24, flip: true, drift: 1.8 },
          { top: '92%', right: '30%', size: 'clamp(110px, 12vw, 175px)', rotate: -30, spin: true, drift: 1.2 },
        ]}
      />
    </div>
  );
}
