import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Subhash Jha | Retro Portfolio",
  description:
    "Software Developer at Adobe Systems — Photoshop · Bangalore, India",
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/images/profile.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable}`}>{children}</body>
    </html>
  );
}
