import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

import { getAssetPath } from "@/lib/store";

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
        <Script src={getAssetPath("/support.js")} strategy="beforeInteractive" />
        <Script src={getAssetPath("/image-slot.js")} strategy="beforeInteractive" />
        <Script src={getAssetPath("/deck-stage.js")} strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
