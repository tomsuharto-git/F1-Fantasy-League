import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NotificationSystem } from '@/components/shared/NotificationSystem';

export const metadata: Metadata = {
  title: 'Grid Kings - F1 Second Screen',
  description: 'The ultimate F1 second screen experience. Live race tracking, fantasy leagues, and AI insights.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Grid Kings',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Grid Kings - F1 Second Screen',
    description: 'Live race tracking, fantasy leagues, and AI insights for F1 fans.',
    type: 'website',
    siteName: 'Grid Kings',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grid Kings - F1 Second Screen',
    description: 'Live race tracking, fantasy leagues, and AI insights for F1 fans.',
  },
};

export const viewport: Viewport = {
  themeColor: '#D2B83E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="text-white min-h-screen">
        {children}
        <NotificationSystem />
      </body>
    </html>
  );
}
