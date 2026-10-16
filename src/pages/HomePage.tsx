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

const SCRAPS: Piece[] = [
  // the torn sheet that carries the "this website includes" note
  { left: 8.0, top: 9.8, width: 28.0, rot: 150, z: 3 },
  { left: 72.0, top: 43.3, width: 27.5, rot: 150, z: 2 },
  { left: 0.0, top: 54.25, width: 15.5, rot: 71, z: 2 },
  { left: 40.0, top: 67.6, width: 15.5, rot: 71, z: 2 },
  { left: 1.3, top: 85.3, width: 14.8, rot: -57, z: 2 },
];

const STICKIES = [
  { label: 'Profile Page', to: '/profile', left: 37.7, top: 28.2, width: 14.4, rot: -2 },
  { label: 'course page', to: '/courses', left: 53.0, top: 36.1, width: 14.0, rot: 12 },
  { label: 'personal portfolio', to: '/artworks', left: 44.4, top: 46.4, width: 14.0, rot: -15 },
  { label: 'visual journal', to: '/visual-journal', left: 55.2, top: 57.0, width: 13.6, rot: 20 },
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
              src={`${BASE}photos/straw-torn-sheet.png`}
              alt=""
              loading="lazy"
              style={pieceStyle(scrap)}
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
              transparency; ordinary images get their white background erased */}
          <div className="straw-piece straw-doodle" style={pieceStyle({ left: 60.4, top: 25.3, width: 6.2, rot: 18, z: 4 })}>
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
          <div className="straw-doodle-copy">
            <p>Just GIFs,
            <br />Creating more</p>
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

      {/* the wandering eyes — big one drifting along the right bleed, small
          ones peeking out of the board's empty pockets */}
      <ScatteredEyes
        spots={[
          { top: '30%', right: '0.5%', size: 'clamp(100px, 11vw, 165px)', rotate: 14, flip: true, drift: 0, z: 1, eager: true },
          { top: '49%', left: '37%', size: 'clamp(46px, 5vw, 72px)', rotate: -22, drift: 1.6, z: 1 },
          { top: '62%', left: '1.2%', size: 'clamp(38px, 4vw, 58px)', rotate: 40, drift: 3.2, z: 1 },
          { top: '90%', left: '46%', size: 'clamp(70px, 7.5vw, 110px)', rotate: 28, flip: true, spin: true, drift: .8, z: 1 },
        ]}
      />
    </div>
  );
}
