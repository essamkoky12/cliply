import './globals.css';

export const metadata = {
  title: 'ClipDown — Trim video, your way',
  description: 'Trim supported media and export the segment you need.',
  icons: { icon: '/favicon.svg' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
