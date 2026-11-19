import { ImageResponse } from 'next/og';
export const alt = 'Nexo Studio — Seu negócio. Sua essência. Seu próximo site.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#090c12',
        color: '#f4f6fb',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 90,
        width: '100%',
        height: '100%',
      }}
    >
      <div style={{ fontSize: 30, color: '#8ba7ff', marginBottom: 35 }}>nexo studio.</div>
      <div style={{ fontSize: 78, letterSpacing: -4, lineHeight: 1.1 }}>
        Seu negócio. Sua essência.
      </div>
      <div style={{ fontSize: 78, color: '#7a9bff', letterSpacing: -4 }}>Seu próximo site.</div>
      <div style={{ fontSize: 24, color: '#969ead', marginTop: 40 }}>
        Design com intenção. Desenvolvimento com cuidado.
      </div>
    </div>,
    size,
  );
}
