import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "JNIS Program Implementation Review",
  description: "SY 2026-2027 Second Quarter Review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="/support.js" strategy="beforeInteractive" />
        <Script src="/image-slot.js" strategy="beforeInteractive" />
        <Script src="/deck-stage.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
