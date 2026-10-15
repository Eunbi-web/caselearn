// PORTFOLIO — one continuous gallery of big kept pages; just keep scrolling.

import { Photo } from '../components/Photo';
import { PageHero } from '../components/UI';
import { artworks } from '../data/extras';

const TAGS = ['photo / kept work', 'sketchbook page', 'on the desk', 'visual note', 'working piece', 'scrap & study'];

export function PortfolioPage({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div>
      <PageHero
        num="03"
        kicker="things made along the way"
        title="portfolio"
        sub="A long scroll of pictures, experiments, and bits I wanted to keep."
      />
      <div className="sheet-pad">
        <p className="tip-line">
          <span className="spark" aria-hidden="true">✳</span>
          one continuous gallery — just keep going down
          <span aria-hidden="true">↓</span>
        </p>

        <div className="gallery-list">
          {artworks.map((artwork, index) => (
            <figure className="gallery-item" key={artwork.slot}>
              <div className="g-window">
                <Photo name={artwork.slot} icon="star" label={artwork.label} editable eager={index < 2} />
              </div>
              <figcaption className="gallery-caption">
                <span className="g-num">{artwork.label.slice(-2)}</span>
                <h3>{artwork.label}</h3>
                <span className="g-desc">kept because it feels like a memory.</span>
                <span className="g-tag">{TAGS[index % TAGS.length]}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="gallery-end">
          <span className="spark" aria-hidden="true">✳</span>{' '}
          that’s the bottom of this page
          <br />
          for now, anyway
        </p>

        <p className="tip-line" style={{ paddingBottom: 34 }}>
          <a href="/visual-journal" className="btn" onClick={(event) => { event.preventDefault(); navigate('/visual-journal'); }}>
            then wander into the visual journal ↘
          </a>
        </p>
      </div>
    </div>
  );
}
