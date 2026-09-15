import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compile — Visual Programming Contest",
  description:
    "A Lightbot-style visual programming puzzle contest. Stack command blocks to guide your bot and trace target shapes across 10 challenging levels.",
  keywords: ["coding", "puzzle", "contest", "programming", "visual"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
