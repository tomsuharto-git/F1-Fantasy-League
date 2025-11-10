import type { Metadata } from 'next';
import './globals.css';
import { NotificationSystem } from '@/components/shared/NotificationSystem';

export const metadata: Metadata = {
  title: 'F1 Fantasy League',
  description: 'Real-time F1 fantasy racing with friends',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1A1A1A] text-white min-h-screen">
        {children}
        <NotificationSystem />
      </body>
    </html>
  );
}
