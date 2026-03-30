import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import AlertTopBar from '@/components/layout/AlertTopBar';

export const metadata: Metadata = {
  title: 'LinkAble Access Hub — Operations',
  description: 'AI-powered accessibility service request platform with real-time alerts and SLA tracking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="ml-60 flex flex-1 flex-col overflow-hidden">
            {/* Global alert banner — auto-shows when there are critical/high unread alerts */}
            <AlertTopBar />
            <main className="flex-1 overflow-y-auto bg-slate-50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
