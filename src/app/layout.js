import '../components/tiptap/styles/_variables.scss';
import '../components/tiptap/styles/_keyframe-animations.scss';
import './globals.css';
import AppProviders from '../components/providers/AppProviders';
import { Barlow_Semi_Condensed, Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--ff-sans',
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['700', '900'],
  display: 'swap',
  variable: '--ff-display',
});

export const metadata = {
  title: 'AI Onboarding Platform',
  description: 'Hackathon MVP built with Next.js and MUI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${barlowSemiCondensed.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
