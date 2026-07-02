import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegistrar from "@shared/ui/pwa-registrar";
import ThemeSync from "@shared/ui/theme-sync";

export const metadata: Metadata = {
  title: {
    template: "%s | AetherWave",
    default: "AetherWave",
  },
  description: "A frontend-first multi-agent AI studio with orchestration, provider routing, and open-source backend integration.",
  keywords: ["AetherWave", "Multi-Agent", "Frontend", "AI", "Orchestrator", "Next.js"],
  openGraph: {
    title: "AetherWave",
    description: "Frontend-first multi-agent AI studio for interview demos.",
    siteName: "AetherWave",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "AetherWave Logo",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // App-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeSync />
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
