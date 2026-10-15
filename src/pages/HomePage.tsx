// HOME — a found-paper table of contents: torn-paper headline, the
// "this website includes" list, four periwinkle cards pinned to the pile,
// floating polaroids and the little animated doodle.

import { Photo } from '../components/Photo';

const INCLUDES = ['profile', 'course journals', 'personal artworks', 'visual journals'];

const CARDS = [
  { num: '1', label: 'Profile Page', to: '/profile' },
  { num: '2', label: 'course journals', to: '/courses' },
  { num: '3', label: 'personal artworks', to: '/artworks' },
  { num: '4', label: 'visual journal', to: '/visual-journal' },
];

export function HomePage({ navigate }: { navigate: (to: string) => void }) {
  const name = 'Fiona';
  return (
    <div className="home-page">
      <div className="home-hero sheet-pad">
        <p className="kicker">a little collection by {name}</p>
        <div style={{ marginTop: 20 }}>
          <span className="torn-title">
            <span className="torn-kicker">A LITTLE COLLECTION BY {name.toUpperCase()}</span>
            <span className="display-title" style={{ display: 'block' }}>HOME<br />PAGE</span>
            <span className="marker-bar" aria-hidden="true" />
          </span>
        </div>
        <div className="home-includes">
          <span className="mono-tip">this website includes:</span>
          <ul>
            {INCLUDES.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="sheet-pad">
        <div className="explore-stage">
          <figure className="polaroid float-polaroid float-right">
            <div className="polaroid-window"><Photo name="home-found-paper" icon="camera" label="A cluster of found handwritten papers" editable eager /></div>
            <figcaption className="polaroid-caption">found paper · 001</figcaption>
          </figure>

          {CARDS.map((card) => (
            <a
              key={card.to}
              href={card.to}
              className="explore-card"
              onClick={(event) => { event.preventDefault(); navigate(card.to); }}
            >
              <span className="num-sticker num-chip">{card.num}</span>
              {card.label}
              <span className="card-cross" aria-hidden="true">↗</span>
            </a>
          ))}

          <figure className="polaroid float-polaroid float-left">
            <div className="polaroid-window"><Photo name="home-bits-pieces" icon="star" label="Bits and pieces of paper scattered on a table" editable eager /></div>
            <figcaption className="polaroid-caption">bits &amp; pieces</figcaption>
          </figure>
        </div>

        <div className="home-bottom">
          <div className="doodle-card">
            <span className="eyes" aria-hidden="true">
              <span className="eye" />
              <span className="eye" />
            </span>
            <span className="doodle-copy">
              basically an animated doodle
              <span className="doodle-note">(more doodles soon!)</span>
            </span>
          </div>
          <span className="sticky-corner">
            <a
              href="/visual-journal"
              className="sticky-note"
              onClick={(event) => { event.preventDefault(); navigate('/visual-journal'); }}
            >
              <span className="sticky-spark" aria-hidden="true">✳</span>
              little things
              <br />
              worth keeping
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
