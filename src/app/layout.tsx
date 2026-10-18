import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitalLens — Understand your health, earlier",
  description:
    "VitalLens turns lab reports and symptoms into clear, calm guidance. Vision AI reads your blood tests, trend intelligence detects changes early, and Dr. V explains everything in plain language.",
  keywords: ["health AI", "lab report decoder", "symptom checker", "health trends", "UnivaBio"],
  authors: [{ name: "VitalLens Team" }],
  openGraph: {
    title: "VitalLens — Your blood tests, finally speaking your language",
    description: "Detect illness earlier. Understand it better. Live with it more easily.",
    siteName: "VitalLens",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
