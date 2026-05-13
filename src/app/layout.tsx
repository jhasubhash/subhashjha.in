import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Code & Coffee with Subhash",
    default: "Code & Coffee with Subhash",
  },
  description:
    "Software Developer at Adobe building Photoshop. Writing about macOS tools, systems programming, and creative software.",
  icons: { icon: "/images/profile.png" },
  alternates: {
    types: {
      "application/rss+xml": "https://subhashjha.in/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        <div className="site-wrapper">
          {children}
        </div>
        <footer className="site-footer">
          <p>© 2026 Subhash Jha</p>
        </footer>
      </body>
    </html>
  );
}
