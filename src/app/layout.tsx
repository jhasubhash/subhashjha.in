import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
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
      <body className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
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
