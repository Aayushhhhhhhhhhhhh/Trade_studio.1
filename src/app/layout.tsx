
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TradesProvider } from '@/context/trades-context';
import { FirebaseClientProvider } from '@/firebase';
import { SettingsProvider } from '@/context/settings-context';
import { AnalyticsProvider } from '@/context/analytics-context';
import { ClientLayout } from './client-layout';

export const metadata: Metadata = {
  title: 'Trade Insights Pro',
  description: 'AI-Powered Trading Analytics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseClientProvider>
          <SettingsProvider>
            <TradesProvider>
              <AnalyticsProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </AnalyticsProvider>
            </TradesProvider>
          </SettingsProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
