import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ServiceNow Platform Simulator | Washington DC Next Experience',
  description: 'Full-featured ServiceNow Platform Simulator for learning, CSA/CAD certification prep, and workflow practice. Powered by Next.js, Supabase, and ImageKit.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
