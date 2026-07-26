import React from 'react';

const clauses = [
  {
    number: '01',
    title: 'Nature of the Tool',
    text: 'This system is a research prototype and not a certified medical device. It has been developed as a proof-of-concept for academic purposes at the African Leadership University. It has not undergone clinical validation and does not carry regulatory approval from any health authority.',
  },
  {
    number: '02',
    title: 'No Clinical Reliance',
    text: "No clinical decision should be made solely on the basis of this system's output. Translations produced by this tool are intended to support, not replace, the judgment of a qualified healthcare professional. Users are advised to seek professional clinical verification before acting on any translation involving medication, dosage, diagnosis, or treatment instructions.",
  },
  {
    number: '03',
    title: 'Data Processing and Privacy',
    text: 'User inputs are processed in-session only. No text submitted through this system is stored, shared with third parties, or used for model retraining without the explicit consent of the user. This system was designed in accordance with the data minimization principles of the Lesotho Data Protection Act (2011), the South African POPIA (2013), and the EU GDPR (2016).',
  },
  {
    number: '04',
    title: 'Limitation of Liability',
    text: 'The developer accepts no liability for clinical outcomes arising from the use of this system. Responsibility for all clinical decisions remains with the qualified healthcare professional using this tool. This system is an aid to communication, not a substitute for professional medical judgment.',
  },
  {
    number: '05',
    title: 'Intended Users',
    text: 'This system is intended for use by healthcare workers, researchers, and community health workers operating in Sesotho-speaking contexts. It is not designed for direct patient self-diagnosis or unsupervised clinical use.',
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={s.root}>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <div style={s.heroContent}>
          <div style={s.pill}>Legal &amp; Privacy</div>
          <h1 style={s.heroH1}>Terms of Use &amp; Privacy Policy</h1>
          <p style={s.heroMeta}>
            Sesotho–English Medical Translation System &nbsp;·&nbsp; ALU Capstone 2026
          </p>
          <p style={s.heroAuthor}>Limpho Elizabeth Semakale</p>
        </div>

        {/* wave divider */}
        <svg viewBox="0 0 1440 60" style={s.wave} preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#f4f6fb" />
        </svg>
      </div>

      {/* ── BODY ── */}
      <div style={s.body}>

        {/* notice banner */}
        <div style={s.notice}>
          <span style={s.noticeIcon}>ℹ️</span>
          <p style={s.noticeText}>
            By using this system you acknowledge and agree to the terms below.
            Please read each clause carefully before submitting text for translation.
          </p>
        </div>

        {/* clause cards */}
        <div style={s.grid}>
          {clauses.map((c, i) => (
            <div key={c.number} style={{ ...s.card, animationDelay: `${i * 0.08}s` }}>
              <div style={s.cardTop}>
                <div style={s.numBadge}>{c.number}</div>
                <span style={s.cardIcon}>{c.icon}</span>
              </div>
              <h3 style={s.cardTitle}>{c.title}</h3>
              <div style={s.divider} />
              <p style={s.cardText}>{c.text}</p>
            </div>
          ))}
        </div>

        {/* footer strip */}
        <div style={s.strip}>
          <div style={s.stripLeft}>
            <div style={s.greenDot} />
            <div>
              <div style={s.stripLabel}>Ethics Approval</div>
              <div style={s.stripVal}>M26-BSE-016 · ALU REC · 11 June 2026</div>
            </div>
          </div>
          <div style={s.stripRight}>
            <div style={s.stripLabel}>Last Updated</div>
            <div style={s.stripVal}>July 2026</div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  root: {
    minHeight: '100vh',
    background: '#f4f6fb',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },

  /* hero */
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #0f2d55 0%, #1d4ed8 60%, #3b82f6 100%)',
    padding: '64px 24px 80px',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '640px',
    margin: '0 auto',
  },
  pill: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '5px 16px',
    borderRadius: '999px',
    marginBottom: '20px',
  },
  heroH1: {
    color: '#fff',
    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
    fontWeight: 800,
    margin: '0 0 14px',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: '0.92rem',
    margin: '0 0 6px',
  },
  heroAuthor: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '0.82rem',
    fontStyle: 'italic',
    margin: 0,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '60px',
    zIndex: 1,
  },

  /* body */
  body: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 24px 80px',
  },

  /* notice */
  notice: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    background: '#dbeafe',
    border: '1px solid #93c5fd',
    borderRadius: '14px',
    padding: '18px 22px',
    marginBottom: '40px',
  },
  noticeIcon: {
    fontSize: '1.3rem',
    flexShrink: 0,
    marginTop: '1px',
  },
  noticeText: {
    margin: 0,
    fontSize: '0.88rem',
    color: '#1e3a8a',
    lineHeight: 1.7,
  },

  /* grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },

  /* card */
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 2px 8px rgba(15,45,85,0.07), 0 8px 24px rgba(15,45,85,0.04)',
    border: '1px solid #e8edf5',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    cursor: 'default',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  numBadge: {
    background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: '1.6rem',
  },
  cardTitle: {
    margin: '0 0 12px',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.01em',
  },
  divider: {
    height: '2px',
    width: '40px',
    background: 'linear-gradient(90deg, #1d4ed8, #93c5fd)',
    borderRadius: '2px',
    marginBottom: '14px',
  },
  cardText: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.75,
  },

  /* footer strip */
  strip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '20px 28px',
  },
  stripLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  greenDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
    flexShrink: 0,
  },
  stripLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: '2px',
  },
  stripVal: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  stripRight: {
    textAlign: 'right',
  },
};
