import type {Metadata} from 'next';
import { Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth';
import './globals.css'; // Global styles

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Velorah® | Where dreams rise',
  description: 'Designing tools for deep thinkers and bold creators.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${instrumentSerif.variable} ${inter.variable}`}>
      <body suppressHydrationWarning className="bg-background text-foreground font-body antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
