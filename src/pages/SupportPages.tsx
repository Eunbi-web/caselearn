import { PageIntro, SectionLabel, type Navigate } from '../components/UI';
import { useProfile } from '../state/profile';
import { Photo } from '../components/Photo';

export function AboutPage({ navigate }: { navigate: Navigate }) {
  const profile = useProfile();
  return (
    <main className="shell page-shell about-page">
      <PageIntro 
        kicker="ABOUT ME" 
        title="ABOUT" 
        description="Learn more about me and my work." 
      />
      <div className="about-artwork-placeholder">
        <SectionLabel>CUSTOM ARTWORK AREA</SectionLabel>
        <div className="artwork-upload-area">
          <Photo 
            name="about-artwork" 
            icon="star" 
            label="About page artwork" 
            editable 
          />
          <p className="upload-hint">Upload your custom artwork here. This placeholder will display your image once uploaded.</p>
        </div>
      </div>
      <div className="about-cta">
        <div>
          <SectionLabel>START ANYWHERE</SectionLabel>
          <h2>The newest entry is always on the home page.</h2>
        </div>
        <button className="button button-primary" onClick={() => navigate('/courses')}>OPEN THE FOLDERS <span>↗</span></button>
      </div>
      <p className="about-sig">filed by {profile.name} · case: {profile.caseNumber}</p>
    </main>
  );
}

export function NotFoundPage({ navigate }: { navigate: Navigate }) {
  return <main className="shell page-shell not-found-page"><div className="not-found-card"><div className="not-found-mark">404</div><SectionLabel>NOT IN THE FILE</SectionLabel><h1>This page went missing.</h1><p>The page you requested is not in the active folders. Head back to the case file and pick another entry.</p><button className="button button-primary" onClick={() => navigate('/courses')}>BACK TO THE FOLDERS <span>↗</span></button></div></main>;
}
