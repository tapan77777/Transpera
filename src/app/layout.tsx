// src/app/layout.tsx
import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Transpera — Compliance Assist',
  description: 'Lightweight compliance & surveillance dashboard for SME brokers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 22 }}>
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: '#0b1220',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#7ec8ff', fontWeight: 800, fontSize: 18
              }}>
                T
              </div>
              <h1 style={{ margin: 0, fontSize: 20 }}>
                TRANSPERA <span style={{ color: '#7ec8ff', fontWeight: 700 }}>Compliance Assist</span>
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <a className="btn" href="/api/report">Generate PDF</a>
              <a className="btn" href="https://github.com/yourname/transpera-compliance-assist" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </header>

          <main>{children}</main>

          <footer style={{ marginTop: 32, color: 'var(--muted)', fontSize: 13 }}>
            © {new Date().getFullYear()} Transpera — Demo for SEBI Securities Market Hackathon
          </footer>
        </div>
      </body>
    </html>
  );
}
