import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LenisProvider } from "@/components/providers/lenis-provider";
import { CustomCursor } from "@/components/ui/custom-cursor";
import { getSiteUrl } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

const calSans = localFont({
  src: "./fonts/CalSans-SemiBold.woff2",
  variable: "--font-display",
  weight: "600",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "InternIQ",
  title: "InternIQ — AI-Powered Career Platform",
  description:
    "AI-powered application tracking, public profiles, and outreach tools for your job search.",
  keywords: [
    "job application tracker",
    "career platform",
    "professional portfolio",
    "resume analyzer",
    "job search outreach",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "InternIQ — Land Your Next Role",
    description:
      "Track applications, build a public profile, and use AI tools to move your search forward.",
    url: "/",
    siteName: "InternIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternIQ — Land Your Next Role",
    description:
      "Track applications, build a public profile, and use AI tools to move your search forward.",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${geistMono.variable} ${calSans.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:ring-2 focus:ring-primary"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <LenisProvider>
            <CustomCursor />
            {children}
          </LenisProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
