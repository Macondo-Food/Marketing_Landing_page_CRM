import VturbPlayer from './VturbPlayer.jsx';

export default function VideoSection({ onPlayClick }) {
  return (
    <section style={{ maxWidth: 1020, margin: '0 auto', padding: '44px 24px 0' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid rgba(248,245,34,.35)',
          boxShadow: '0 0 0 6px rgba(248,245,34,.06)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0C0C0C' }}>
          <VturbPlayer onClick={onPlayClick} />
        </div>
      </div>
    </section>
  );
}
