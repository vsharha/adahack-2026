import type { Metadata } from "next";
import { Libre_Baskerville, Roboto, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSync } from "@/components/theme-sync";
import { appearanceInitScript } from "@/lib/appearance-script";

// Closest free match to the Century Expanded headlines on optiver.com.
const serif = Libre_Baskerville({
  variable: "--font-serif-face",
  subsets: ["latin"],
  weight: ["400"],
});

// Greek subsets carry ρ, the shared-risk symbol used throughout the page.
const sans = Roboto({
  variable: "--font-sans-face",
  subsets: ["latin", "greek"],
  weight: ["300", "400", "500"],
});

const mono = Source_Code_Pro({
  variable: "--font-mono-face",
  subsets: ["latin", "greek"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Optiver Carbon Portfolio Optimizer | AdaHack 2026",
  description:
    "Build a carbon credit portfolio that delivers 100,000 tonnes CO₂e on a budget and survives the unexpected.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeSync />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
