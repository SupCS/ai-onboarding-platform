import '../components/tiptap/styles/_variables.scss';
import '../components/tiptap/styles/_keyframe-animations.scss';
import './globals.css';
import AppProviders from '../components/providers/AppProviders';

export const metadata = {
  title: 'AI Onboarding Platform',
  description: 'Hackathon MVP built with Next.js and MUI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
