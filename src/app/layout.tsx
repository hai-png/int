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
  title: "3D Experience Builder - Interactive 3D Editor",
  description: "No-code platform to transform GLTF models into interactive 3D experiences with hotspots, animations, and behaviors. Built with React Three Fiber.",
  keywords: ["3D", "GLTF", "Interactive", "Experience Builder", "React Three Fiber", "Hotspots", "No-code"],
  authors: [{ name: "3D Experience Builder" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "3D Experience Builder",
    description: "Transform GLTF models into interactive 3D experiences",
    siteName: "3D Experience Builder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Experience Builder",
    description: "Transform GLTF models into interactive 3D experiences",
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
