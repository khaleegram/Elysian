
import type { Metadata } from 'next';
import './globals.css';
import { Inter, Londrina_Solid } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const londrinaSolid = Londrina_Solid({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-londrina-solid',
  weight: "300",
});

export const metadata: Metadata = {
  title: 'ElysianAI - A New Era of Hospitality',
  description: 'Experience seamless stays with AI-powered booking, check-in, and guest services.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.variable, londrinaSolid.variable)}>
        <FirebaseClientProvider>
          <Header />
          <main>{children}</main>
          <Toaster />
        </FirebaseClientProvider>
        <Script src="https://js.paystack.co/v1/inline.js" />
      </body>
    </html>
  );
}
