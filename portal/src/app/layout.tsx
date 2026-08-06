import type { Metadata } from 'next';
import { fontDisplay, fontMono, fontSans } from '@/shared/format/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal Financeiro — Mouro Soluções',
  description: 'Dashboard executivo e gestão financeira da Mouro Soluções.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
