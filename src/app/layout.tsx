import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/navigation/app-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Veymo.ai - AI-Powered Video Generation",
    template: "%s | Veymo.ai"
  },
  description: "Create stunning videos from text using advanced AI technology. Professional video creation made simple with cutting-edge AI models. Generate high-quality videos in minutes.",
  keywords: ["AI video generation", "text to video", "artificial intelligence", "content creation", "video AI", "automated video", "AI tools", "video generator"],
  authors: [{ name: "Veymo.ai Team" }],
  creator: "Veymo.ai",
  publisher: "Veymo.ai",
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://veymo.ai",
    title: "Veymo.ai - AI-Powered Video Generation",
    description: "Create stunning videos from text using advanced AI technology. Professional video creation made simple with cutting-edge AI models.",
    siteName: "Veymo.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veymo.ai - AI-Powered Video Generation",
    description: "Create stunning videos from text using advanced AI technology.",
    creator: "@veymoai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0f", // Dark theme only
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-primary antialiased dark`}
      >
        <Providers>
          <AppHeader />
          {children}
        </Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
