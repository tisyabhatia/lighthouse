import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIGHTHOUSE - GitHub Repository Analyzer',
  description: 'AI-powered repository analysis and onboarding guide generator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
