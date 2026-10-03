import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeSync } from "@/components/theme-sync";
import { appearanceInitScript } from "@/lib/appearance-script";

const grotesk = Hanken_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Greek subset carries ρ, the shared-risk symbol used throughout the page.
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
      className={`${grotesk.variable} ${mono.variable} h-full antialiased`}
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
