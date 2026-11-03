import "./globals.css";
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: "Cliply",
  applicationName: "Cliply",
  description: "Trim supported videos and export the moments you need as MP4 or MP3.",
  icons: {
    icon: {
      url: "/Minimal Play Download Icon.png",
      type: "image/png",
      sizes: "any",
    },
    shortcut: "/Minimal Play Download Icon.png",
    apple: "/Minimal Play Download Icon.png",
  },
  openGraph: {
    title: "Cliply",
    description: "Trim supported videos and export the moments you need as MP4 or MP3.",
    type: "website",
    siteName: "Cliply",
  },
  twitter: {
    card: "summary",
    title: "Cliply",
    description: "Trim supported videos and export the moments you need as MP4 or MP3.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
