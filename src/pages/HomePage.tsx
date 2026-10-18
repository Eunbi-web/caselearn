// HOME — the straw-page pile, copied piece for piece: a big fancy headline,
// torn-paper photos and blank scraps scattered loose, the "this website
// includes" note, four periwinkle stickies as the real links, an uploadable
// doodle-gif slot and the little anime wave that closes the page.
// The board is a fixed-ratio canvas and every piece is placed in % so the
// whole collage scales as one picture. The canvas is deliberately wide
// (1180 units) so the side pieces reach out to fill the desk.

import { Photo } from '../components/Photo';
import { ScatteredEyes } from '../components/ScatteredEyes';

const BASE = import.meta.env.BASE_URL;

interface Piece {
  left: number;
  top: number;
  width: number;
  rot: number;
  z: number;
}

interface PhotoPiece extends Piece { slot: string; cls: string; label: string; eager?: boolean; }

const PHOTOS: PhotoPiece[] = [
  { slot: 'straw-photo-top', cls: 'straw-photo', label: 'A heap of found handwritten papers', left: 66.1, top: 1.0, width: 24.6, rot: 9, z: 2, eager: true },
  { slot: 'straw-photo-mid', cls: 'straw-photo', label: 'A heap of found handwritten papers', left: 6.4, top: 16.6, width: 23.3, rot: 0, z: 2, eager: true },
  { slot: 'straw-photo-tall', cls: 'straw-photo photo-tall', label: 'Old letters piled inside a wooden drawer', left: 4.7, top: 34.8, width: 24.5, rot: 26, z: 2, eager: true },
  { slot: 'straw-photo-lowleft', cls: 'straw-photo', label: 'Loose papers waiting to be sorted', left: 6.8, top: 57.9, width: 23.5, rot: 41, z: 2 },
  { slot: 'straw-photo-lowright', cls: 'straw-photo', label: 'Loose papers turned over on the desk', left: 75.6, top: 75.9, width: 23.9, rot: 46, z: 2 },
];

const SCRAPS: (Piece & { pile?: 1 | 2 | 3 | 4; flip?: boolean; paper?: boolean })[] = [
  // the blank note paper that carries the "this website includes" note
  { left: 12.5, top: 12.5, width: 23.5, rot: -4, z: 3, paper: true },
  // the emptied torn scraps become loose note piles, at their own angles
  { left: 75.5, top: 49.5, width: 23.5, rot: 150, z: 2, pile: 3 },
  { left: 0.0, top: 54.25, width: 13.5, rot: 71, z: 2, pile: 1, flip: true },
  { left: 40.0, top: 67.6, width: 14.5, rot: 71, z: 2, pile: 2, flip: true },
  { left: 1.3, top: 85.3, width: 13.8, rot: -57, z: 2, pile: 4 },
];

const STICKIES = [
  { label: 'Profile Page', to: '/profile', left: 37, top: 26.8, width: 20.2, rot: -2 },
  { label: 'course page', to: '/courses', left: 55.5, top: 40.2, width: 19.6, rot: 12 },
  { label: 'personal portfolio', to: '/artworks', left: 38.5, top: 54.3, width: 19.6, rot: -15 },
  { label: 'visual journal', to: '/visual-journal', left: 53.5, top: 66.5, width: 19, rot: 20 },
];

const pieceStyle = (piece: Piece): React.CSSProperties => ({
  left: `${piece.left}%`,
  top: `${piece.top}%`,
  width: `${piece.width}%`,
  transform: `rotate(${piece.rot}deg)`,
  zIndex: piece.z,
});

const TITLE_LINES = ['HOME', 'PAGE'];

export function HomePage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="home-page">
      <section className="straw-sheet" aria-label="home collage">
        <div className="straw-board">
          <h1 className="straw-title" aria-label="home page">
            {TITLE_LINES.map((line) => (
              <span key={line} className="straw-title-line" aria-hidden="true">
                {[...line].map((ch, i) => (
                  <span key={i} className="straw-title-letter">{ch}</span>
                ))}
              </span>
            ))}
          </h1>

          {PHOTOS.map((piece) => (
            <div key={piece.slot} className="straw-piece" style={pieceStyle(piece)}>
              <Photo
                name={piece.slot}
                icon="camera"
                label={piece.label}
                className={piece.cls}
                eager={piece.eager}
                editable
              />
            </div>
          ))}

          {SCRAPS.map((scrap, index) => (
            <img
              key={`scrap-${index}`}
              className="straw-scrap"
              src={scrap.paper ? `${BASE}photos/note-paper.png` : scrap.pile ? `${BASE}photos/note-pile-${scrap.pile}.png` : `${BASE}photos/straw-torn-sheet.png`}
              alt=""
              loading="lazy"
              style={{ ...pieceStyle(scrap), transform: `${pieceStyle(scrap).transform}${scrap.flip ? ' scaleX(-1)' : ''}` }}
              draggable={false}
            />
          ))}

          <div className="straw-includes">
            <p>this website includes:</p>
            <ul>
              <li>profile</li>
              <li>personal portfolio</li>
              <li>courses journals</li>
              <li>visual journals</li>
            </ul>
          </div>

          {/* her "animated gif" spot — upload any GIF and it plays with its own
              transparency; ordinary images get their white background erased.
              Sized up and kept in the clear pocket right of the Profile
              sticky — above the course sticky, below the paper pile. */}
          <div className="straw-piece straw-doodle" style={pieceStyle({ left: 58, top: 22.5, width: 12.5, rot: 18, z: 4 })}>
            <Photo
              name="straw-eyes"
              icon="eye"
              label="The animated gif doodle slot (a pair of googly eyes by default)"
              className="straw-doodle-img"
              eager
              editable
              whiteKey
            />
          </div>

          {/* new animated-gif slot pinned over the top of the paper-stack photo */}
          <div className="straw-piece straw-gif-top" style={pieceStyle({ left: 79.2, top: -0.6, width: 13.4, rot: 12, z: 4 })}>
            <Photo
              name="straw-gif-top"
              icon="camera"
              label="The top-right animated gif slot above the paper stack"
              className="straw-gif-top-img"
              eager
              editable
              whiteKey
            />
          </div>

          {STICKIES.map((sticky) => (
            <a
              key={sticky.to}
              href={sticky.to}
              className="straw-sticky"
              style={{
                left: `${sticky.left}%`,
                top: `${sticky.top}%`,
                width: `${sticky.width}%`,
                '--rot': `${sticky.rot}deg`,
                zIndex: 5,
              } as React.CSSProperties}
              onClick={(event) => { event.preventDefault(); navigate(sticky.to); }}
            >
              {sticky.label}
            </a>
          ))}

          {/* the closing anime gif — shown exactly as she posted it, "The end"
              sign and all, a touch bigger than before */}
          <div className="straw-theend" style={{ left: '34.4%', top: '78.9%', width: '31.6%', zIndex: 3 }}>
            <img
              src={`${BASE}photos/straw-the-end.gif`}
              alt="An animated character waving good-bye with a sign that reads “The end”"
              loading="lazy"
              draggable={false}
            />
          </div>
        </div>
      </section>

      {/* the wandering eyes — placed only on measured-empty wall: the wide
          top strip, the right bleed below the paper-stack photo, and the two
          thin bleed columns. None of them touch the board's pieces. */}
      <ScatteredEyes
        spots={[
          // big one filling the top strip between the title and the photo
          { top: '7%', left: '39.5%', size: 'clamp(105px, 11vw, 175px)', rotate: -8, spin: true, drift: 0, z: 0, eager: true },
          // drifting down the right bleed, clear of the paper-stack photo
          { top: '26%', right: '0.8%', size: 'clamp(115px, 12.5vw, 195px)', rotate: 14, flip: true, drift: .8, z: 0 },
          // the two thin left bleed columns — small watchers
          { top: '13%', left: '0.3%', size: 'clamp(48px, 5vw, 84px)', rotate: -14, drift: 2.2, z: 0 },
          { top: '66%', left: '0.3%', size: 'clamp(60px, 6.5vw, 105px)', rotate: 38, flip: true, drift: 1.4, z: 0 },
          // bottom wall, left of "The End" wave and below everything else
          { top: '97%', left: '17%', size: 'clamp(64px, 7vw, 110px)', rotate: 44, drift: 3, z: 0 },
        ]}
      />
    </div>
  );
}
